"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestIntake } from "@/app/admin/actions";

/**
 * The intake behind a request, correctable before the run.
 *
 * Read-only until you click Edit, because the common visit is to check what
 * you're about to run rather than to change it. But it must be changeable:
 * requests are created at one moment and run at another, and re-running to fix
 * one field costs ten model calls.
 *
 * Field order is by how much each one moves the analysis, not by how it was
 * collected. Programs and role groups first — the prompts weight both above
 * the industry label, which the model overwrites for any company it can
 * identify anyway.
 */
export default function IntakePanel({
  requestId,
  intake,
  emailDomain,
}: {
  requestId: string;
  intake: {
    employees?: string;
    industry?: string;
    roleGroups?: string;
    programs?: string;
    context?: string;
  };
  emailDomain?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [d, setD] = useState({
    employees: intake.employees ?? "",
    industry: intake.industry ?? "",
    roleGroups: intake.roleGroups ?? "",
    programs: intake.programs ?? "",
    context: intake.context ?? "",
  });

  const save = () =>
    start(async () => {
      setErr(null);
      const res = await updateRequestIntake(requestId, d);
      if (!res.ok) return setErr(res.error);
      setEditing(false);
      router.refresh();
    });

  const label =
    "block font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool mb-1";
  const input =
    "w-full border border-border bg-white/60 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors";

  const rows: [string, string, string][] = [
    ["programs", "Programs of interest", d.programs],
    ["roleGroups", "Role groups", d.roleGroups],
    ["employees", "Covered subscribers", d.employees],
    ["industry", "Industry", d.industry],
    ["context", "Additional context", d.context],
  ];

  if (!editing) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            Intake
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-3 text-[14px]">
          {rows.map(([k, lab, v]) => (
            <div key={k}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                {lab}
              </dt>
              <dd className="text-navy mt-0.5 whitespace-pre-wrap">
                {v || <span className="text-gray-cool">—</span>}
              </dd>
            </div>
          ))}
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
              Email domain
            </dt>
            <dd className="text-navy mt-0.5">
              {emailDomain || <span className="text-gray-cool">—</span>}
            </dd>
          </div>
        </dl>
        {!d.programs && (
          <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool">
            No programs named. If you know what they run or what they&rsquo;re
            being sold, add it — the analysis answers a named program directly,
            and leaves it out of the suggested mix rather than ranking a
            decision they already made.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
          Intake
        </h2>
        <button
          onClick={() => {
            setEditing(false);
            setErr(null);
          }}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className={label}>Programs or vendors to examine</label>
          <textarea
            rows={2}
            value={d.programs}
            onChange={(e) => setD({ ...d, programs: e.target.value })}
            placeholder="Hinge Health, Lyra, GLP-1 coverage"
            className={input}
          />
        </div>
        <div>
          <label className={label}>Role groups</label>
          <input
            value={d.roleGroups}
            onChange={(e) => setD({ ...d, roleGroups: e.target.value })}
            placeholder="investment principals, portfolio operations, finance"
            className={input}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Covered subscribers</label>
            <input
              value={d.employees}
              onChange={(e) => setD({ ...d, employees: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Industry</label>
            <input
              value={d.industry}
              onChange={(e) => setD({ ...d, industry: e.target.value })}
              className={input}
            />
          </div>
        </div>
        <div>
          <label className={label}>Additional context</label>
          <textarea
            rows={3}
            value={d.context}
            onChange={(e) => setD({ ...d, context: e.target.value })}
            className={input}
          />
        </div>

        <button
          onClick={save}
          disabled={pending}
          className="px-4 py-2 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? "Saving" : "Save intake"}
        </button>
        <p className="text-[12px] leading-[1.6] text-gray-cool">
          Takes effect on the next run. A run already completed won&rsquo;t
          change — its inputs are recorded in the research job.
        </p>
      </div>

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
