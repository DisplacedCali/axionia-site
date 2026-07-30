"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  advanceResearch,
  attachResearchToReport,
  saveReportEdits,
  startResearchForRequest,
} from "@/app/admin/research-actions";
import type { ReportEdits, ReportView } from "@/lib/modules/research/report";

/**
 * Research trigger, progress, and the light review surface.
 *
 * Three states in one panel, because they're one task:
 *   idle    → nothing run yet; show the ask and a Run button
 *   running → wave-by-wave progress
 *   review  → edit narrative and scores, choose what the client sees, build
 *
 * Editing is deliberately shallow. Free-tier review should be a couple of
 * minutes of correcting hallucinations and sharpening a sentence, not a
 * document editor — so: eight number inputs, four textareas, done.
 */

type StepRow = {
  id: string;
  label: string;
  status: string;
  degraded: boolean;
  ms: number | null;
};

export type AxisRow = {
  key: string;
  label: string;
  score: number | null;
  modelScore: number | null;
  rationale: string;
  adjusted: boolean;
};

type Props = {
  requestId: string;
  /** The client's own words from the intake — the thing worth honouring. */
  ask: { programs: string | null; context: string | null };
  /** Existing draft, if research has already been attached. */
  report: {
    id: string;
    title: string;
    clientView: ReportView;
    reviewedAt: string | null;
    hasContent: boolean;
    axes: AxisRow[];
    narrative: {
      summary: string;
      findings: string[];
      profile: string;
      regulatory: string;
    };
    edits: ReportEdits;
    overallScore: number | null;
    band: string | null;
    isFallback: boolean;
    visibleSections: string[];
    withheldSections: string[];
    blockers: string[];
  } | null;
  /** A job already in flight for this request, if any. */
  activeJob: { id: string; status: string; steps: StepRow[]; runId: string | null } | null;
};

const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";
const input =
  "w-full border border-border bg-white/50 px-4 py-3 font-sans text-[15px] focus:outline-none focus:border-navy transition-colors";
const btn =
  "px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40";
const btnQuiet =
  "px-4 py-2 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-navy hover:text-navy transition-colors disabled:opacity-40";

const STATUS_MARK: Record<string, string> = {
  done: "●",
  running: "◐",
  failed: "✕",
  skipped: "○",
  pending: "·",
};

const STATUS_COLOR: Record<string, string> = {
  done: "text-pos",
  running: "text-blue",
  failed: "text-risk",
  skipped: "text-caution",
  pending: "text-gray-cool",
};

function seedScores(report: Props["report"]): Record<string, string> {
  const seed: Record<string, string> = {};
  for (const a of report?.axes ?? []) {
    seed[a.key] = a.score === null ? "" : String(a.score);
  }
  return seed;
}

export default function ResearchPanel({ requestId, ask, report, activeJob }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [analystContext, setAnalystContext] = useState("");
  const [jobId, setJobId] = useState<string | null>(activeJob?.id ?? null);
  const [steps, setSteps] = useState<StepRow[]>(activeJob?.steps ?? []);
  const [running, setRunning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [tokens, setTokens] = useState<{ input: number; output: number } | null>(null);
  const [cachedRun, setCachedRun] = useState<{ runId: string; ageDays?: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Edit state, seeded from the saved overlay so a reload doesn't lose work.
  const [title, setTitle] = useState(report?.title ?? "");
  const [clientView, setClientView] = useState<ReportView>(report?.clientView ?? "summary");
  const [summary, setSummary] = useState(report?.edits.narrative?.summary ?? report?.narrative.summary ?? "");
  const [findings, setFindings] = useState(
    (report?.edits.narrative?.findings ?? report?.narrative.findings ?? []).join("\n"),
  );
  const [profile, setProfile] = useState(report?.edits.narrative?.profile ?? "");
  const [regulatory, setRegulatory] = useState(report?.edits.narrative?.regulatory ?? "");
  const [scores, setScores] = useState<Record<string, string>>(() => seedScores(report));
  const [seededFor, setSeededFor] = useState<string | null>(report?.hasContent ? report.id : null);

  /**
   * Re-seed when research arrives.
   *
   * The panel mounts before any research exists, so every useState initializer
   * ran against a null report and the fields stayed empty even after
   * router.refresh() brought the data in — React keeps initial state across
   * re-renders. Keyed on report id so it seeds exactly once per report and
   * never clobbers edits in progress.
   */
  useEffect(() => {
    if (!report?.hasContent) return;
    if (seededFor === report.id) return;

    setScores(seedScores(report));
    setTitle(report.title);
    setSummary(report.edits.narrative?.summary ?? report.narrative.summary ?? "");
    setFindings((report.edits.narrative?.findings ?? report.narrative.findings ?? []).join("\n"));
    setProfile(report.edits.narrative?.profile ?? "");
    setRegulatory(report.edits.narrative?.regulatory ?? "");
    setClientView(report.clientView);
    setSeededFor(report.id);
  }, [report, seededFor]);

  const flash = (m: string) => {
    setMsg(m);
    setErr(null);
    setTimeout(() => setMsg(null), 3000);
  };

  /** Live overall, so adjusting an axis shows its effect immediately. */
  const liveOverall = (() => {
    const w: Record<string, number> = {
      spendEfficiency: 13, vendorIndependence: 10, analyticsReadiness: 10,
      cfoEngagement: 10, workforceAlignment: 13, decisionMaturity: 13,
      regulatoryReadiness: 11, appreciationValue: 11,
    };
    let total = 0;
    let weight = 0;
    for (const [k, wt] of Object.entries(w)) {
      const raw = scores[k];
      if (raw === "" || raw === undefined) return null;
      const v = Number(raw);
      if (!Number.isFinite(v)) return null;
      total += v * wt;
      weight += wt;
    }
    return weight ? Math.round((total / weight) * 10) / 10 : null;
  })();

  async function run(force = false) {
    setErr(null);
    setCachedRun(null);
    const res = await startResearchForRequest({ requestId, analystContext, force });
    if (!res.ok) return setErr(res.error);

    if (res.cached && res.runId) {
      setCachedRun({ runId: res.runId, ageDays: res.ageDays });
      return;
    }
    if (!res.jobId) return setErr("No job was created.");

    setJobId(res.jobId);
    setRunning(true);
    await drive(res.jobId);
  }

  /** Advance one wave at a time until done. Abandonable — the job persists. */
  async function drive(id: string) {
    for (let i = 0; i < 25; i++) {
      const r = await advanceResearch(id);
      if (!r.ok) {
        setErr(r.error);
        setRunning(false);
        return;
      }
      setSteps(r.steps);
      setPercent(r.percent);
      setTokens(r.tokens);

      if (r.done && r.runId) {
        setRunning(false);
        const attached = await attachResearchToReport({
          requestId,
          runId: r.runId,
          clientView,
        });
        if (!attached.ok) return setErr(attached.error);
        flash("Research complete — draft created.");
        router.refresh();
        return;
      }
      if (r.status === "failed") {
        setErr("A required step failed. Fix the cause and run again — completed waves are kept.");
        setRunning(false);
        return;
      }
      await new Promise((res) => setTimeout(res, r.retryAfterMs ?? 300));
    }
    setRunning(false);
    setErr("Stopped after 25 waves without completing. Check the job queue.");
  }

  async function useCached() {
    if (!cachedRun) return;
    const res = await attachResearchToReport({ requestId, runId: cachedRun.runId, clientView });
    if (!res.ok) return setErr(res.error);
    flash("Existing research attached.");
    router.refresh();
  }

  const anyAsk = Boolean(ask.programs?.trim() || ask.context?.trim());

  return (
    <div className="space-y-8">
      {/* ── What the client asked for ─────────────────────────────────── */}
      {anyAsk && (
        <div className="border border-blue/30 bg-blue-light/40 p-6">
          <h2 className={`${label} mb-3`}>What they asked to have looked at</h2>
          {ask.programs?.trim() && (
            <p className="text-[15px] leading-[1.7] text-navy mb-2">{ask.programs}</p>
          )}
          {ask.context?.trim() && (
            <p className="text-[14px] leading-[1.7] text-gray-warm">{ask.context}</p>
          )}
          <p className="mt-3 font-mono text-[10px] text-gray-cool">
            Fed into the benefits, scoring and brief steps automatically.
          </p>
        </div>
      )}

      {/* ── Run ───────────────────────────────────────────────────────── */}
      {!report?.hasContent && (
        <div className="border border-border p-6">
          <h2 className={`${label} mb-4`}>Research</h2>

          <label className={label}>
            Analyst context — optional, from documents you read yourself
          </label>
          <textarea
            rows={3}
            value={analystContext}
            onChange={(e) => setAnalystContext(e.target.value)}
            placeholder="e.g. Renewal packet shows 14% trend, broker recommending a captive. Vendor deck claims 3:1 ROI on MSK with no control group."
            className={`${input} mt-2`}
            disabled={running}
          />
          <p className="mt-2 text-[12px] text-gray-cool">
            The pipeline does not read attachments. Summarise what matters and it will be
            treated as verified fact.
          </p>

          {cachedRun && (
            <div className="mt-5 border border-caution/40 bg-amber-light/50 p-4">
              <p className="text-[14px] leading-[1.7] text-navy">
                Research already exists for this company
                {typeof cachedRun.ageDays === "number" && ` — ${cachedRun.ageDays} day${cachedRun.ageDays === 1 ? "" : "s"} old`}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => startTransition(useCached)} disabled={pending} className={btn}>
                  Use existing — no cost
                </button>
                <button onClick={() => startTransition(() => run(true))} disabled={pending} className={btnQuiet}>
                  Re-run anyway
                </button>
              </div>
            </div>
          )}

          {!cachedRun && (
            <button
              onClick={() => startTransition(() => run(false))}
              disabled={pending || running}
              className={`${btn} mt-5`}
            >
              {running ? "Running…" : "Run research"}
            </button>
          )}

          {!running && !cachedRun && (
            <p className="mt-2 font-mono text-[10px] text-gray-cool">
              10 model calls across 7 waves · about 60–90 seconds · spends real credit
            </p>
          )}
        </div>
      )}

      {/* ── Progress ──────────────────────────────────────────────────── */}
      {(running || (steps.length > 0 && !report?.hasContent)) && (
        <div className="border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={label}>Pipeline</h2>
            <span className="font-mono text-[10px] text-navy">{percent}%</span>
          </div>

          <div className="h-[2px] bg-stone mb-5">
            <div
              className="h-full bg-axionia-gradient transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ul className="space-y-1.5">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-3 font-mono text-[11px]">
                <span className={`w-3 ${STATUS_COLOR[s.status] ?? "text-gray-cool"}`}>
                  {STATUS_MARK[s.status] ?? "·"}
                </span>
                <span className={s.status === "pending" ? "text-gray-cool" : "text-navy"}>
                  {s.label}
                </span>
                {s.degraded && <span className="text-caution">degraded</span>}
                {s.ms !== null && <span className="text-gray-cool">{(s.ms / 1000).toFixed(1)}s</span>}
              </li>
            ))}
          </ul>

          {tokens && (
            <p className="mt-4 font-mono text-[10px] text-gray-cool">
              {tokens.input.toLocaleString()} in · {tokens.output.toLocaleString()} out
            </p>
          )}
          {jobId && !running && (
            <button onClick={() => startTransition(() => drive(jobId))} className={`${btnQuiet} mt-4`}>
              Resume
            </button>
          )}
        </div>
      )}

      {/* ── Review ────────────────────────────────────────────────────── */}
      {report?.hasContent && (
        <>
          <a
            href={`/admin/reports/${report.id}`}
            className="block border border-navy bg-navy px-6 py-5 text-base hover:opacity-90 transition-opacity"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
              Research complete
            </span>
            <span className="mt-1 block font-serif text-[22px] font-light">
              Read the report →
            </span>
            <span className="mt-1 block text-[13px] opacity-70">
              Renders exactly what the client sees. Comment on a section and regenerate it,
              or print to PDF.
            </span>
          </a>

          {report.isFallback && (
            <div className="border border-risk/40 bg-red-light/60 p-5">
              <h2 className={`${label} mb-2 text-risk`}>Scores are estimated, not assessed</h2>
              <p className="text-[14px] leading-[1.7] text-navy">
                The scoring step failed and estimated defaults were substituted. These are
                excluded from benchmarks and cannot be released. Re-run before continuing.
              </p>
            </div>
          )}

          {report.isFallback ? null : (
            <p className="text-[13px] leading-[1.7] text-gray-warm">
              Scores, narrative and the client view are all edited on the report page — you
              adjust a score while reading the rationale that justifies it.
            </p>
          )}

          {report.blockers.length > 0 && (
            <div className="border border-caution/40 bg-amber-light/50 p-5">
              <h2 className={`${label} mb-2 text-caution`}>Before releasing</h2>
              <ul className="space-y-1">
                {report.blockers.map((b) => (
                  <li key={b} className="text-[14px] leading-[1.7] text-navy">
                    — {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}

      {msg && <p className="text-pos font-mono text-[11px]">{msg}</p>}
      {err && <p className="text-risk text-sm">{err}</p>}
    </div>
  );
}
