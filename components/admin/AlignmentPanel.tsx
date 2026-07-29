"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAlignment } from "@/app/admin/actions";

type AlignmentValue =
  | "matched"
  | "review"
  | "cleared"
  | "third_party"
  | "restricted";

type Props = {
  requestId: string;
  alignment: AlignmentValue;
  reason: string | null;
  note: string | null;
  companyName: string | null;
  contactEmail: string;
};

const STATE: Record<
  AlignmentValue,
  { label: string; dot: string; text: string; border: string; bg: string }
> = {
  matched: {
    label: "Own employer",
    dot: "bg-pos",
    text: "text-pos",
    border: "border-border",
    bg: "",
  },
  review: {
    label: "Unclassified — likely third-party",
    dot: "bg-caution",
    text: "text-caution",
    border: "border-caution",
    bg: "bg-amber-light",
  },
  cleared: {
    label: "Own employer — confirmed by you",
    dot: "bg-pos",
    text: "text-pos",
    border: "border-pos",
    bg: "bg-green-light",
  },
  third_party: {
    label: "Third-party research — billable",
    dot: "bg-blue",
    text: "text-blue",
    border: "border-blue",
    bg: "bg-blue-light",
  },
  restricted: {
    label: "Declined",
    dot: "bg-risk",
    text: "text-risk",
    border: "border-risk",
    bg: "bg-red-light",
  },
};

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
  const unclassified = alignment === "review";

  function apply(next: "cleared" | "third_party" | "restricted" | "review") {
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
        <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${s.text}`}>
          {s.label}
        </span>
      </div>

      {reason && (
        <p className="text-[14px] leading-[1.65] text-navy mb-3">{reason}</p>
      )}

      {unclassified && (
        <p className="text-[13px] leading-[1.65] text-gray-warm mb-4">
          <strong className="text-navy">{contactEmail}</strong> asked about{" "}
          <strong className="text-navy">{companyName || "another company"}</strong>.
          If that&rsquo;s genuinely their employer — holding company, rebrand, shared
          services address — mark it as such and it runs as a normal free report.
          Otherwise it&rsquo;s a paid research engagement: benchmarking, diligence, or
          client work. Route it and follow up with scope.
        </p>
      )}

      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2">
        Routing note — internal
      </label>
      <textarea
        rows={2}
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value)}
        placeholder="e.g. broker at Willis prepping a renewal conversation — quoted as one-off diligence"
        className="w-full border border-border bg-white/60 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors mb-3"
      />

      <div className="flex flex-wrap gap-2">
        {alignment !== "cleared" && (
          <button
            onClick={() => apply("cleared")}
            disabled={pending}
            className="px-4 py-2 border border-pos text-pos font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-pos hover:text-base transition-colors disabled:opacity-50"
          >
            It&rsquo;s their own employer
          </button>
        )}
        {alignment !== "third_party" && (
          <button
            onClick={() => apply("third_party")}
            disabled={pending}
            className="px-4 py-2 border border-blue text-blue font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-blue hover:text-base transition-colors disabled:opacity-50"
          >
            Route as paid research
          </button>
        )}
        {alignment !== "restricted" && (
          <button
            onClick={() => apply("restricted")}
            disabled={pending}
            className="px-4 py-2 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-risk hover:text-risk transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        )}
        {alignment !== "review" && (
          <button
            onClick={() => apply("review")}
            disabled={pending}
            className="px-4 py-2 border border-border text-gray-cool font-mono text-[10px] uppercase tracking-[0.12em] hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
          >
            Reopen
          </button>
        )}
      </div>

      {alignment === "third_party" && (
        <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
          Stays in the queue — it&rsquo;s work, just billable. Scope and price it
          before running the analysis.
        </p>
      )}
      {alignment === "restricted" && (
        <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
          Archived. Nothing is sent automatically — reply to them directly.
        </p>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
