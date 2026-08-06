"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mergeCompanies, unmergeCompany } from "@/app/admin/companies/merge-actions";

/**
 * Fold a duplicate company into the real one.
 *
 * Companies are created from an email domain, and a real business has several
 * — invidiacap.com, invidiacapital.com and internal.invidia-capital.com all
 * arrived as separate employers.
 *
 * The duplicate is kept, not deleted, and the wording says so at the moment of
 * clicking. `domain` is what every lookup joins on, so deleting the row means
 * the next email from that domain recreates it and you merge the same company
 * again next month. Merged, it becomes an alias that keeps resolving.
 *
 * Two-step, and it names what will move. This reassigns reports between
 * accounts, and the failure mode is showing one employer's analysis to
 * another — not something to do on a single mis-click.
 */
export default function MergeControl({
  company,
  candidates,
  mergedInto,
}: {
  company: { id: string; label: string };
  /** Other active companies. Excludes this one and anything already merged. */
  candidates: { id: string; label: string }[];
  /** Set when this row IS an alias — offers to undo instead. */
  mergedInto?: { id: string; label: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const link =
    "font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool hover:text-navy disabled:opacity-40";

  if (mergedInto) {
    return (
      <span className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
          alias of {mergedInto.label}
        </span>
        <button
          onClick={() =>
            startTransition(async () => {
              const res = await unmergeCompany({ companyId: company.id });
              if (!res.ok) setErr(res.error);
              else router.refresh();
            })
          }
          disabled={pending}
          className={link}
        >
          Undo
        </button>
        {err && <span className="font-mono text-[9px] text-risk">{err}</span>}
      </span>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={link}>
        Merge
      </button>
    );
  }

  return (
    <span className="flex flex-col gap-1.5 items-start">
      <span className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm">
          Fold into
        </span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border border-border bg-white/60 px-2 py-1 font-sans text-[13px] max-w-[220px]"
        >
          <option value="">Choose…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            startTransition(async () => {
              setErr(null);
              const res = await mergeCompanies({
                sourceId: company.id,
                targetId: target,
              });
              if (!res.ok) return setErr(res.error);
              setOpen(false);
              router.refresh();
            })
          }
          disabled={pending || !target}
          className="px-2 py-1 border border-navy text-navy font-mono text-[9px] uppercase tracking-[0.1em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
        >
          {pending ? "Merging…" : "Merge"}
        </button>
        <button onClick={() => setOpen(false)} className={link}>
          Cancel
        </button>
      </span>
      <span className="font-mono text-[9px] leading-[1.5] text-gray-cool max-w-[280px]">
        Moves every contact, report, request and file to the other company.{" "}
        {company.label} is kept as an alias so its domain keeps resolving —
        nothing is deleted.
      </span>
      {err && <span className="font-mono text-[9px] text-risk">{err}</span>}
    </span>
  );
}
