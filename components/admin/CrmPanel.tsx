"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCrm } from "@/app/admin/companies/actions";

/**
 * Pipeline state for one company.
 *
 * Saves on change rather than behind a Save button. A CRM that asks you to
 * confirm every field is a CRM that stops getting updated, and stale pipeline
 * data is worse than none — it gets trusted.
 */

export const STAGES = [
  { id: "lead", label: "Lead", note: "Known to us, nothing in motion" },
  { id: "engaged", label: "Engaged", note: "Two-way conversation underway" },
  { id: "analysis", label: "Analysis", note: "We're running work for them" },
  { id: "proposal", label: "Proposal", note: "Terms are with them" },
  { id: "client", label: "Client", note: "Signed and running" },
  { id: "dormant", label: "Dormant", note: "Real, but not now" },
  { id: "declined", label: "Declined", note: "Said no, or we did" },
] as const;

export const STAGE_TONE: Record<string, string> = {
  lead: "text-gray-warm border-border",
  engaged: "text-blue border-blue/40",
  analysis: "text-blue border-blue/40",
  proposal: "text-caution border-caution/40",
  client: "text-pos border-pos/40",
  dormant: "text-gray-cool border-stone",
  declined: "text-gray-cool border-stone",
};

export default function CrmPanel({
  companyId,
  stage,
  ownerId,
  nextAction,
  nextActionAt,
  staff,
}: {
  companyId: string;
  stage: string;
  ownerId: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  staff: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [action, setAction] = useState(nextAction ?? "");
  const [saved, setSaved] = useState(false);

  const save = (patch: Parameters<typeof updateCrm>[1]) =>
    start(async () => {
      setErr(null);
      const res = await updateCrm(companyId, patch);
      if (!res.ok) return setErr(res.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      router.refresh();
    });

  const label = "block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2";
  const field =
    "w-full border border-border bg-white/50 px-3 py-2.5 text-[14px] focus:outline-none focus:border-navy";

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Pipeline
        </h2>
        {saved && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-pos">
            Saved
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={label} htmlFor="crm-stage">Stage</label>
          <select
            id="crm-stage"
            value={stage}
            disabled={pending}
            onChange={(e) => save({ stage: e.target.value })}
            className={field}
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-gray-cool">
            {STAGES.find((s) => s.id === stage)?.note}
          </p>
        </div>

        <div>
          <label className={label} htmlFor="crm-owner">Owner</label>
          <select
            id="crm-owner"
            value={ownerId ?? ""}
            disabled={pending}
            onChange={(e) => save({ ownerId: e.target.value || null })}
            className={field}
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="crm-action">Next action</label>
          <input
            id="crm-action"
            value={action}
            disabled={pending}
            onChange={(e) => setAction(e.target.value)}
            onBlur={() => {
              if (action !== (nextAction ?? "")) save({ nextAction: action || null });
            }}
            placeholder="Send the MSK teardown before their 14 Aug renewal"
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="crm-when">Due</label>
          <input
            id="crm-when"
            type="date"
            value={nextActionAt ?? ""}
            disabled={pending}
            onChange={(e) => save({ nextActionAt: e.target.value || null })}
            className={field}
          />
        </div>
      </div>

      {err && <p className="mt-3 text-[13px] text-risk">{err}</p>}
    </div>
  );
}
