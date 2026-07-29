"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAlignment } from "@/app/admin/actions";

type Props = {
  requestId: string;
  alignment: "matched" | "review" | "cleared" | "restricted";
  reason: string | null;
  note: string | null;
  companyName: string | null;
  contactEmail: string;
};

const STATE = {
  matched: {
    label: "Aligned",
    dot: "bg-pos",
    text: "text-pos",
    border: "border-border",
    bg: "",
  },
  review: {
    label: "Needs validation",
    dot: "bg-caution",
    text: "text-caution",
    border: "border-caution",
    bg: "bg-amber-light",
  },
  cleared: {
    label: "Cleared by you",
    dot: "bg-pos",
    text: "text-pos",
    border: "border-pos",
    bg: "bg-green-light",
  },
  restricted: {
    label: "Restricted",
    dot: "bg-risk",
    text: "text-risk",
    border: "border-risk",
    bg: "bg-red-light",
  },
} as const;

export default function AlignmentPanel({
  requestId,
  alignment,
  reason,
  note,
  companyName,
  contactEmail,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [err, setErr] = useState<string | null>(null);

  const s = STATE[alignment];
  const needsAction = alignment === "review";

  function apply(next: "cleared" | "restricted" | "review") {
    startTransition(async () => {
      const res = await setAlignment(requestId, next, draftNote);
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className={`border p-6 ${s.border} ${s.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${s.text}`}
        >
          Requester alignment — {s.label}
        </span>
      </div>

      {reason && (
        <p className="text-[14px] leading-[1.65] text-navy mb-3">{reason}</p>
      )}

      {needsAction && (
        <p className="text-[13px] leading-[1.65] text-gray-warm mb-4">
          Confirm that <strong className="text-navy">{contactEmail}</strong> is
          genuinely affiliated with{" "}
          <strong className="text-navy">{companyName || "this company"}</strong>{" "}
          before running the analysis. Holding companies, rebrands and shared
          services addresses are common and legitimate — brokers and competitors
          are not.
        </p>
      )}

      {alignment !== "matched" && (
        <>
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2">
            Validation note — internal
          </label>
          <textarea
            rows={2}
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="e.g. confirmed by phone — parent company of the named entity"
            className="w-full border border-border bg-white/60 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors mb-3"
          />
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {alignment !== "cleared" && (
          <button
            onClick={() => apply("cleared")}
            disabled={pending}
            className="px-4 py-2 border border-pos text-pos font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-pos hover:text-base transition-colors disabled:opacity-50"
          >
            Confirm affiliation
          </button>
        )}
        {alignment !== "restricted" && (
          <button
            onClick={() => apply("restricted")}
            disabled={pending}
            className="px-4 py-2 border border-risk text-risk font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-risk hover:text-base transition-colors disabled:opacity-50"
          >
            Restrict research
          </button>
        )}
        {alignment !== "review" && alignment !== "matched" && (
          <button
            onClick={() => apply("review")}
            disabled={pending}
            className="px-4 py-2 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
          >
            Reopen
          </button>
        )}
      </div>

      {alignment === "restricted" && (
        <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
          Restricting archives the request. Nothing is sent to the requester
          automatically — reply to them directly.
        </p>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
