"use client";

import { useState, useTransition } from "react";
import { assignRequest } from "@/app/admin/actions";

/**
 * Queue assignment, inline on the row.
 *
 * "Claim" rather than a dropdown for the common case: the overwhelmingly
 * frequent action is one person taking the next thing, and making that a
 * two-step select is friction on the hot path. The dropdown is there for
 * handing work to someone else, which is rarer.
 */
export default function AssignControl({
  requestId,
  assignedTo,
  currentUserId,
  staff,
}: {
  requestId: string;
  assignedTo: string | null;
  currentUserId: string;
  staff: { id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (assignee: string | null) => {
    setError(null);
    startTransition(async () => {
      const res = await assignRequest(requestId, assignee);
      if (!res.ok) setError(res.error);
    });
  };

  if (!assignedTo) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => run(currentUserId)}
            disabled={pending}
            className="font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border border-navy text-navy hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
          >
            {pending ? "…" : "Claim"}
          </button>
          {staff.length > 1 && (
            <select
              onChange={(e) => e.target.value && run(e.target.value)}
              disabled={pending}
              defaultValue=""
              aria-label="Assign to"
              className="font-mono text-[9px] uppercase tracking-[0.1em] bg-transparent text-gray-cool border-none focus:outline-none cursor-pointer"
            >
              <option value="">→</option>
              {staff
                .filter((s) => s.id !== currentUserId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </select>
          )}
        </div>
        {error && <span className="text-[10px] text-risk">{error}</span>}
      </div>
    );
  }

  const holder = staff.find((s) => s.id === assignedTo);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.1em] truncate ${
            assignedTo === currentUserId ? "text-blue" : "text-gray-warm"
          }`}
        >
          {assignedTo === currentUserId ? "You" : holder?.label ?? "Assigned"}
        </span>
        <button
          onClick={() => run(null)}
          disabled={pending}
          title="Return to the open queue"
          className="font-mono text-[11px] leading-none text-gray-cool hover:text-risk transition-colors disabled:opacity-40"
        >
          ×
        </button>
      </div>
      {error && <span className="text-[10px] text-risk">{error}</span>}
    </div>
  );
}
