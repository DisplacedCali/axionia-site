"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReportRender from "@/components/ReportRender";
import {
  markReportReviewed,
  regenerateSection,
  revertRevision,
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
  /** Kept in the type for the request page's use; the flow strip renders them. */
  reviewedAt?: string | null;
  blockers?: string[];
  /** Prior comment, the model's note, and the text it replaced — per target. */
  revisions: Record<
    string,
    { comment?: string; note?: string; at?: string; previous?: string }
  >;
  /** Existing per-axis justifications, so a re-open doesn't look unexplained. */
  scoreNotes?: Record<string, { rationale?: string }>;
};

/**
 * Revision targets, and which report section each lives in.
 *
 * Keyed by target rather than by section: the findings section renders three
 * separately editable things, and one shared box at its foot meant a comment
 * written under "Where to start" rewrote the findings list several paragraphs
 * above. The revision worked and looked like it hadn't.
 *
 * `in` is the section that must be visible for the target to render — a
 * withheld section shouldn't sprout a comment box.
 */
const TARGETS: { target: RevisableSection; in: SectionId; label: string }[] = [
  { target: "summary", in: "findings", label: "Opening summary" },
  { target: "findings", in: "findings", label: "Key findings" },
  { target: "topOpportunity", in: "findings", label: "Where to start" },
  { target: "profile", in: "profile", label: "Company profile" },
  { target: "regulatory", in: "regulatory", label: "Regulatory exposure" },
  { target: "brief", in: "brief", label: "Pre-meeting brief" },
];

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";
const btn =
  "px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40";

/**
 * Comment box for one section. The summary is edited through the findings
 * section, since the two read as one block to a client.
 *
 * MODULE SCOPE, NOT NESTED — and it has to stay that way.
 *
 * This was declared inside ReportReview's body. A function declared during
 * render gets a new identity on every render, so React saw a different
 * component type each time, unmounted the whole subtree and mounted a fresh
 * one. The textarea was therefore destroyed and recreated on every keystroke:
 * you could type exactly one character before focus was lost, because the
 * element you were typing into no longer existed.
 *
 * Everything it needs comes in as props for the same reason — closing over
 * parent state is what makes nesting tempting.
 */
function CommentBox({
  section,
  prior,
  current,
  busy,
  pending,
  value,
  onChange,
  onRegenerate,
  onRevert,
}: {
  section: RevisableSection;
  prior?: { comment?: string; note?: string; at?: string; previous?: string };
  /** What the section says now, for the diff. */
  current?: string;
  value: string;
  busy: boolean;
  pending: boolean;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onRevert: () => void;
}) {
  /*
    Show the change, don't describe it.

    The prose note was the only record of a revision, and a note can be
    perfectly accurate while pointing you at the wrong paragraph — "replaced X
    with plain language" reads as false if the X you happen to be looking at is
    in a different field that the box can't edit. Before-and-after cannot
    mislead that way.

    The note was also rendered twice: once from the overlay as "Last revision"
    and once from the fresh response in green. One record, once.
  */
  const changed = prior?.previous && current && prior.previous.trim() !== current.trim();

  return (
    <div className="border border-blue/25 bg-blue-light/30 p-4">
      {changed && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className={eyebrow}>What changed</span>
            <button
              onClick={onRevert}
              disabled={busy || pending}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy disabled:opacity-40"
            >
              Revert
            </button>
          </div>
          <p className="border-l-2 border-risk/50 pl-3 py-1 text-[13px] leading-[1.6] text-gray-cool line-through decoration-risk/40">
            {prior!.previous}
          </p>
          <p className="mt-2 border-l-2 border-pos pl-3 py-1 text-[13px] leading-[1.6] text-navy">
            {current}
          </p>
          {prior?.comment && (
            <p className="mt-2 font-mono text-[10px] leading-[1.6] text-gray-cool">
              You asked: &ldquo;{prior.comment}&rdquo;
            </p>
          )}
          {prior?.note && (
            <p className="mt-1 font-mono text-[10px] leading-[1.6] text-gray-warm">
              {prior.note}
            </p>
          )}
        </div>
      )}

      <label className={eyebrow}>What needs to change here?</label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Too generous on CFO engagement — they have never seen a claims file. Drop the vendor name."
        className="mt-2 w-full border border-border bg-white/70 px-3 py-2.5 font-sans text-[14px] focus:outline-none focus:border-navy"
        disabled={busy}
      />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={onRegenerate} disabled={busy || pending} className={btn}>
          {busy ? "Rewriting…" : "Regenerate section"}
        </button>
        <span className="font-mono text-[10px] text-gray-cool">1 model call</span>
      </div>
    </div>
  );
}

export default function ReportReview({
  reportId,
  requestId,
  report,
  clientView,
  revisions,
  scoreNotes: initialScoreNotes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // The transient "here's what I did" note is gone — the diff replaces it, and
  // keeping both meant the same sentence rendered twice after every revision.
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

  /** Per-axis justification. Required by the action for any changed score. */
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const [k, v] of Object.entries(initialScoreNotes ?? {})) {
      if (v?.rationale) seed[k] = v.rationale;
    }
    return seed;
  });

  async function saveScores() {
    const scoreEdits: Record<string, number> = {};
    for (const a of report.axes) {
      const raw = scores[a.key];
      if (raw === "" || raw === undefined) continue;
      const v = Number(raw);
      if (Number.isFinite(v) && v !== a.modelScore) scoreEdits[a.key] = v;
    }

    // Checked again server-side — this is only so the message arrives before a
    // round trip, not instead of one.
    const missing = Object.keys(scoreEdits).filter((k) => !scoreNotes[k]?.trim());
    if (missing.length) {
      return setErr(
        `Say why you changed ${missing.join(", ")} before saving. An unexplained override is a hidden assumption.`,
      );
    }

    const notes: Record<string, { rationale: string; by: string; at: string }> = {};
    for (const k of Object.keys(scoreEdits)) {
      // `by` and `at` are stamped from the session in the action; these are
      // placeholders that get overwritten and never trusted.
      notes[k] = { rationale: scoreNotes[k].trim(), by: "", at: "" };
    }

    const res = await saveReportEdits({
      reportId,
      requestId: requestId ?? "",
      edits: { scores: scoreEdits, scoreNotes: notes },
    });
    if (!res.ok) return setErr(res.error);
    setErr(null);
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

    setComments((p) => ({ ...p, [section]: "" }));
    router.refresh();
  }

  /** Undo one revision. The prior text is kept on the overlay — see revertRevision. */
  async function revert(section: RevisableSection) {
    setBusy(section);
    setErr(null);
    const res = await revertRevision({
      reportId,
      requestId: requestId ?? "",
      section,
    });
    setBusy(null);
    if (!res.ok) return setErr(res.error);
    router.refresh();
  }

  /** What each target currently says, so the diff has an "after". */
  const currentText = (t: RevisableSection): string => {
    switch (t) {
      case "summary":
        return report.summary;
      case "findings":
        return report.findings.map((f) => f.text).join("\n");
      case "topOpportunity":
        return report.callToAction?.headline ?? "";
      case "profile":
        return report.profile;
      case "regulatory":
        return report.regulatory;
      case "brief":
        return report.brief;
    }
  };

  const visible = new Set(report.visibleSections);
  const slots: Partial<
    Record<SectionId | "summary" | "topOpportunity", React.ReactNode>
  > = {};

  for (const t of TARGETS) {
    if (!visible.has(t.in)) continue;
    slots[t.target as keyof typeof slots] = (
      <CommentBox
        key={t.target}
        section={t.target}
        prior={revisions[t.target]}
        current={currentText(t.target)}
        value={comments[t.target] ?? ""}
        busy={busy === t.target}
        pending={pending}
        onChange={(v) => setComments((p) => ({ ...p, [t.target]: v }))}
        onRegenerate={() => regenerate(t.target)}
        onRevert={() => revert(t.target)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="border border-border p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Audience, not view. `internal` is the default and cannot be
                released — it includes the pre-meeting brief, which is a sales
                dossier about the reader. See migration 027. */}
            <span className={eyebrow}>Audience</span>
            {(
              [
                ["internal", "Internal", "Everything, incl. the brief"],
                ["summary", "Client · free", "Scorecard, findings, designed mix"],
                ["full", "Client · paid", "Adds workforce and benefit design"],
              ] as const
            ).map(([v, label, hint]) => (
              <button
                key={v}
                title={hint}
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
                    ? v === "internal"
                      ? "border-caution bg-caution text-base"
                      : "border-navy bg-navy text-base"
                    : "border-border text-gray-warm hover:border-navy"
                }`}
              >
                {label}
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
            {/*
              Mark reviewed and the blocker list both moved to DocumentFlow at
              the top of this page — they're stages of the document's life, not
              editing controls, and having them in two places on one screen
              meant two sources of truth for "is this ready".
            */}
            <button onClick={() => window.print()} className={btn}>
              Print / PDF
            </button>
          </div>
        </div>

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
          notes: scoreNotes,
          onNoteChange: (key, value) => {
            setScoreNotes((p) => ({ ...p, [key]: value }));
            setScoresDirty(true);
          },
        }}
      />
    </div>
  );
}
