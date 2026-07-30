"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReportRender from "@/components/ReportRender";
import {
  markReportReviewed,
  regenerateSection,
  saveReportEdits,
  setClientView,
} from "@/app/admin/research-actions";
import type { AssembledReport, ReportView, SectionId } from "@/lib/modules/research/report";
import type { RevisableSection } from "@/lib/modules/research/pipeline/revise";

/**
 * Review the report as the client will see it, and correct it by comment.
 *
 * The preview is the same ReportRender the client route uses — the only way to
 * be certain you're reviewing what they get is for it to be the same code. The
 * comment boxes are injected as per-section slots, so the client route never
 * knows they exist.
 */

type Props = {
  reportId: string;
  requestId: string | null;
  report: AssembledReport;
  clientView: ReportView;
  reviewedAt: string | null;
  blockers: string[];
  /** Previous comment + the model's note, per section. */
  revisions: Record<string, { comment?: string; note?: string; at?: string }>;
};

const REVISABLE: Record<string, RevisableSection> = {
  findings: "findings",
  profile: "profile",
  regulatory: "regulatory",
  brief: "brief",
};

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";
const btn =
  "px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40";

export default function ReportReview({
  reportId,
  requestId,
  report,
  clientView,
  reviewedAt,
  blockers,
  revisions,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<ReportView>(clientView);

  /**
   * Score edits live here now, not on the request page.
   *
   * You adjust a score while reading the rationale that justifies it — they are
   * one judgement, so they belong on one screen. The request page keeps queue
   * and status work.
   */
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const a of report.axes) seed[a.key] = a.score === null ? "" : String(a.score);
    return seed;
  });
  const [scoresDirty, setScoresDirty] = useState(false);

  async function saveScores() {
    const scoreEdits: Record<string, number> = {};
    for (const a of report.axes) {
      const raw = scores[a.key];
      if (raw === "" || raw === undefined) continue;
      const v = Number(raw);
      if (Number.isFinite(v) && v !== a.modelScore) scoreEdits[a.key] = v;
    }
    const res = await saveReportEdits({
      reportId,
      requestId: requestId ?? "",
      edits: { scores: scoreEdits },
    });
    if (!res.ok) return setErr(res.error);
    setScoresDirty(false);
    router.refresh();
  }

  async function regenerate(section: RevisableSection) {
    const comment = comments[section]?.trim();
    if (!comment) {
      setErr("Describe what to change before regenerating.");
      return;
    }
    setBusy(section);
    setErr(null);
    const res = await regenerateSection({ reportId, requestId: requestId ?? "", section, comment });
    setBusy(null);
    if (!res.ok) return setErr(res.error);

    setNotes((p) => ({ ...p, [section]: res.note }));
    setComments((p) => ({ ...p, [section]: "" }));
    router.refresh();
  }

  /**
   * Comment box for one section. The summary is edited through the findings
   * section, since the two read as one block to a client.
   */
  function CommentBox({ id }: { id: SectionId }) {
    const section = REVISABLE[id];
    if (!section) return null;

    const prior = revisions[section];
    const isBusy = busy === section;

    return (
      <div className="border border-blue/25 bg-blue-light/30 p-4">
        {prior?.note && (
          <p className="mb-3 font-mono text-[10px] leading-[1.6] text-gray-warm">
            Last revision: {prior.note}
            {prior.comment && (
              <span className="block mt-1 text-gray-cool">
                Your note was: &ldquo;{prior.comment}&rdquo;
              </span>
            )}
          </p>
        )}
        {notes[section] && (
          <p className="mb-3 font-mono text-[10px] text-pos">{notes[section]}</p>
        )}

        <label className={eyebrow}>What needs to change here?</label>
        <textarea
          rows={2}
          value={comments[section] ?? ""}
          onChange={(e) => setComments((p) => ({ ...p, [section]: e.target.value }))}
          placeholder="e.g. Too generous on CFO engagement — they have never seen a claims file. Drop the vendor name."
          className="mt-2 w-full border border-border bg-white/70 px-3 py-2.5 font-sans text-[14px] focus:outline-none focus:border-navy"
          disabled={isBusy}
        />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={() => regenerate(section)} disabled={isBusy || pending} className={btn}>
            {isBusy ? "Rewriting…" : "Regenerate section"}
          </button>
          <span className="font-mono text-[10px] text-gray-cool">1 model call</span>
        </div>
      </div>
    );
  }

  const slots: Partial<Record<SectionId, React.ReactNode>> = {};
  for (const id of report.visibleSections) {
    if (REVISABLE[id]) slots[id] = <CommentBox id={id} />;
  }

  return (
    <div className="space-y-8">
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="border border-border p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={eyebrow}>Client sees</span>
            {(["summary", "full"] as const).map((v) => (
              <button
                key={v}
                onClick={() =>
                  startTransition(async () => {
                    setView(v);
                    const res = await setClientView({ reportId, view: v });
                    if (!res.ok) setErr(res.error);
                    else router.refresh();
                  })
                }
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                  view === v
                    ? "border-navy bg-navy text-base"
                    : "border-border text-gray-warm hover:border-navy"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {scoresDirty && (
              <button
                onClick={() => startTransition(saveScores)}
                disabled={pending}
                className="px-4 py-2 border border-blue text-blue font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-blue hover:text-base transition-colors"
              >
                Save score changes
              </button>
            )}
            <button onClick={() => window.print()} className={btn}>
              Print / PDF
            </button>
            <button
              onClick={() =>
                startTransition(async () => {
                  const res = await markReportReviewed({
                    reportId,
                    requestId: requestId ?? undefined,
                  });
                  if (!res.ok) setErr(res.error);
                  else router.refresh();
                })
              }
              disabled={pending}
              className={btn}
            >
              {reviewedAt ? "Reviewed ✓" : "Mark reviewed"}
            </button>
          </div>
        </div>

        {blockers.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className={`${eyebrow} text-caution mb-2`}>Blocking release</p>
            <ul className="space-y-1">
              {blockers.map((b) => (
                <li key={b} className="text-[13px] leading-[1.6] text-navy">
                  — {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 font-mono text-[10px] leading-[1.6] text-gray-cool">
          Regenerating a section clears the review flag — the text changed since you read
          it, so it needs reading again.
        </p>
      </div>

      {err && <p className="text-risk text-sm print:hidden">{err}</p>}

      {/* ── The report, exactly as the client sees it ─────────────── */}
      <ReportRender
        report={report}
        slots={slots}
        showWithheld
        editScores={{
          values: scores,
          onChange: (key, value) => {
            setScores((p) => ({ ...p, [key]: value }));
            setScoresDirty(true);
          },
        }}
      />
    </div>
  );
}
