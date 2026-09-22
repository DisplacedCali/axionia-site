"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTerms, seedIntakeChecklist } from "@/app/admin/companies/actions";

/**
 * Commercial terms for one company — founding cohort or not, and the fee
 * rate locked in if so.
 *
 * Separate from CrmPanel on purpose, same reasoning as BriefPanel: this
 * answers a different question (what did we agree to charge them) than
 * pipeline state (where are they in the funnel), and it's gated by a
 * different permission — updateTerms requires release, updateCrm only
 * staff. A panel that silently mixed the two would either loosen the
 * commercial gate to match the pipeline one, or block an analyst from
 * moving a stage because they can't see a rate field they have no reason
 * to touch. This panel renders for anyone who can see the hub; the save
 * calls enforce the real boundary server-side, so a non-release staffer
 * sees the fields and gets a clear error on save rather than a missing
 * panel that reads as a bug.
 *
 * Rate is edited and displayed as a percent (0.75) and converted to the
 * fraction the column stores (0.0075) at the boundary — nobody should have
 * to type 0.0075 into a text box to mean three quarters of one percent.
 */
export default function TermsPanel({
  companyId,
  foundingCohort,
  feeRate,
  seatsTaken,
  seatsCap,
  conversionLabel,
}: {
  companyId: string;
  foundingCohort: boolean;
  feeRate: number | null;
  seatsTaken: number;
  seatsCap: number;
  conversionLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [ratePct, setRatePct] = useState(
    feeRate != null ? String(Math.round(feeRate * 10000) / 100) : "",
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr(null);
      const res = await fn();
      if (!res.ok) return setErr(res.error ?? "Something went wrong.");
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      router.refresh();
    });

  const seatsFull = seatsTaken >= seatsCap && !foundingCohort;

  const label = "block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2";
  const field =
    "w-full border border-border bg-white/50 px-3 py-2.5 text-[14px] focus:outline-none focus:border-navy disabled:opacity-50";

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Terms
        </h2>
        {saved && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-pos">
            Saved
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          id="terms-founding"
          type="checkbox"
          checked={foundingCohort}
          disabled={pending || seatsFull}
          onChange={(e) =>
            run(() => updateTerms(companyId, { foundingCohort: e.target.checked }))
          }
          className="mt-1"
        />
        <label htmlFor="terms-founding" className="text-[14px] text-navy leading-snug">
          Founding cohort
          <span className="block mt-1 text-[12px] text-gray-cool leading-snug">
            Free through {conversionLabel}, then the rate below — priced
            against verified savings, held for the term, per /pricing.{" "}
            {seatsTaken}/{seatsCap} seats taken.
            {seatsFull && " No seats left."}
          </span>
        </label>
      </div>

      {foundingCohort && (
        <div className="mt-5">
          <label className={label} htmlFor="terms-rate">
            Fee rate — % of verified savings
          </label>
          <div className="flex items-center gap-2 max-w-[160px]">
            <input
              id="terms-rate"
              type="number"
              step="0.05"
              min="0"
              max="5"
              placeholder="0.75"
              value={ratePct}
              disabled={pending}
              onChange={(e) => setRatePct(e.target.value)}
              onBlur={() => {
                const n = ratePct.trim() === "" ? null : Number(ratePct);
                if (n !== null && Number.isNaN(n)) return setErr("Not a number.");
                const fraction = n === null ? null : n / 100;
                if (fraction === feeRate) return;
                run(() => updateTerms(companyId, { feeRate: fraction }));
              }}
              className={field}
            />
            <span className="font-mono text-[12px] text-gray-warm">%</span>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-cool">
            Of spend, this is NOT. Same basis as everyone else — a fraction
            of what we find and you verify. Not set until you type a number.
          </p>
        </div>
      )}

      {foundingCohort && (
        <div className="mt-5 pt-4 border-t border-border">
          <button
            onClick={() => run(() => seedIntakeChecklist(companyId))}
            disabled={pending}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:text-navy transition-colors disabled:opacity-40"
          >
            + Seed the onboarding checklist below
          </button>
        </div>
      )}

      {err && <p className="mt-3 text-[13px] text-risk">{err}</p>}
    </div>
  );
}
