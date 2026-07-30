"use client";

import { useState, useTransition } from "react";
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
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const a of report?.axes ?? []) seed[a.key] = a.score === null ? "" : String(a.score);
    return seed;
  });

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
      const v = Number(scores[k]);
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

  async function save(markReviewed = false) {
    if (!report) return;
    const scoreEdits: Record<string, number> = {};
    for (const a of report.axes) {
      const v = Number(scores[a.key]);
      if (Number.isFinite(v) && v !== a.modelScore) scoreEdits[a.key] = v;
    }

    const edits: ReportEdits = {
      scores: scoreEdits,
      narrative: {
        summary: summary.trim() || undefined,
        findings: findings.split("\n").map((f) => f.trim()).filter(Boolean),
        profile: profile.trim() || undefined,
        regulatory: regulatory.trim() || undefined,
      },
    };

    const res = await saveReportEdits({
      reportId: report.id,
      requestId,
      edits,
      clientView,
      title,
      markReviewed,
    });
    if (!res.ok) return setErr(res.error);
    flash(markReviewed ? "Saved and marked reviewed." : "Edits saved.");
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
          {report.isFallback && (
            <div className="border border-risk/40 bg-red-light/60 p-5">
              <h2 className={`${label} mb-2 text-risk`}>Scores are estimated, not assessed</h2>
              <p className="text-[14px] leading-[1.7] text-navy">
                The scoring step failed and estimated defaults were substituted. These are
                excluded from benchmarks and cannot be released. Re-run before continuing.
              </p>
            </div>
          )}

          <div className="border border-border p-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className={label}>Scorecard</h2>
              <span className="font-serif text-[28px] leading-none text-navy">
                {liveOverall ?? report.overallScore ?? "—"}
                {report.band && (
                  <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                    {report.band}
                  </span>
                )}
              </span>
            </div>

            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {report.axes.map((a) => {
                const changed = Number(scores[a.key]) !== a.modelScore;
                return (
                  <div key={a.key} className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={scores[a.key] ?? ""}
                      onChange={(e) => setScores((p) => ({ ...p, [a.key]: e.target.value }))}
                      className={`w-16 border px-2 py-1.5 text-center font-mono text-[13px] focus:outline-none ${
                        changed ? "border-blue text-blue" : "border-border text-navy"
                      }`}
                    />
                    <span className="flex-1 text-[13px] text-navy">{a.label}</span>
                    {changed && a.modelScore !== null && (
                      <span
                        className="font-mono text-[10px] text-gray-cool"
                        title="What the model scored. Kept on the record."
                      >
                        was {a.modelScore}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 font-mono text-[10px] leading-[1.6] text-gray-cool">
              Overall recomputes from these. The model&rsquo;s original score is retained and
              adjusted axes are marked, so the benchmark stays honest about which numbers are
              yours.
            </p>
          </div>

          <div className="border border-border p-6 space-y-5">
            <h2 className={label}>Narrative</h2>

            <div>
              <label className={label}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${input} mt-2`} />
            </div>

            <div>
              <label className={label}>Summary — the first thing they read</label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={`${input} mt-2`}
              />
            </div>

            <div>
              <label className={label}>Key findings — one per line</label>
              <textarea
                rows={5}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className={`${input} mt-2 font-mono text-[13px]`}
              />
            </div>

            <details className="border-t border-border pt-4">
              <summary className={`${label} cursor-pointer`}>
                Override profile / regulatory text
              </summary>
              <div className="mt-4 space-y-4">
                <textarea
                  rows={4}
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  placeholder="Leave empty to use the model's company profile."
                  className={input}
                />
                <textarea
                  rows={5}
                  value={regulatory}
                  onChange={(e) => setRegulatory(e.target.value)}
                  placeholder="Leave empty to use the model's regulatory section."
                  className={input}
                />
              </div>
            </details>
          </div>

          <div className="border border-border p-6">
            <h2 className={`${label} mb-4`}>What the client sees</h2>
            <div className="flex gap-2 mb-4">
              {(["summary", "full"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setClientView(v)}
                  className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                    clientView === v
                      ? "border-navy bg-navy text-base"
                      : "border-border text-gray-warm hover:border-navy"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-[13px] leading-[1.7] text-gray-warm">
              {clientView === "summary" ? (
                <>
                  Shows scorecard, findings, profile and regulatory exposure. Withholds
                  workforce intelligence, benefit design and the internal brief — the paid
                  substance.
                </>
              ) : (
                <>
                  Shows everything, including segment-level workforce analysis and the benefit
                  design prescription. Only do this deliberately.
                </>
              )}
            </p>
          </div>

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

          <div className="flex flex-wrap gap-3">
            <button onClick={() => startTransition(() => save(false))} disabled={pending} className={btn}>
              Save edits
            </button>
            <button
              onClick={() => startTransition(() => save(true))}
              disabled={pending}
              className={btn}
              title="Records that a human has read this. Required before release."
            >
              {report.reviewedAt ? "Save & re-confirm review" : "Save & mark reviewed"}
            </button>
          </div>
        </>
      )}

      {msg && <p className="text-pos font-mono text-[11px]">{msg}</p>}
      {err && <p className="text-risk text-sm">{err}</p>}
    </div>
  );
}
