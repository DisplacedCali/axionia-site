"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkHideAccounts } from "@/app/admin/users/review-actions";

/**
 * Clear the suspected list in one action.
 *
 * The point of the whole triage design: reviewing signup abuse one row at a
 * time is the thing nobody does twice, so the default path is "these all look
 * automated, hide them" with per-row rescue available for the occasional real
 * person the heuristic misjudged.
 *
 * Hidden, never deleted. The ids come from the list you are looking at rather
 * than being recomputed server-side, so a row that arrived a second ago can't
 * be swept without ever having been on screen.
 */
export default function ReviewSweep({
  count,
  userIds,
  canReview,
}: {
  count: number;
  userIds: string[];
  canReview: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (count === 0) {
    return (
      <div className="mb-6 border border-border bg-base-2 p-5">
        <p className="font-serif text-xl mb-1">Nothing to review.</p>
        <p className="text-[14px] leading-[1.7] text-gray-warm max-w-measure">
          No unreviewed account currently looks automated. New signups appear
          here only when several signals agree.
        </p>
      </div>
    );
  }

  const run = () =>
    startTransition(async () => {
      setErr(null);
      const res = await bulkHideAccounts(userIds);
      if (!res.ok) return setErr(res.error);
      setConfirming(false);
      setMsg(`${res.hidden} hidden. Nothing was deleted.`);
      router.refresh();
    });

  return (
    <div className="mb-6 border border-caution/40 bg-amber-light/50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution-dark mb-2">
        {count} account{count === 1 ? "" : "s"} look automated
      </p>
      <p className="text-[14px] leading-[1.7] text-gray-warm max-w-measure mb-4">
        Flagged because several signals agree — most often an email that was
        never verified, plus a name or company that looks machine-generated.
        Hiding removes them from the working list. Nothing is deleted, and
        anything here can be restored from Hidden.
      </p>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={pending}
            className="px-4 py-2 border border-risk text-risk font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-risk hover:text-base transition-colors disabled:opacity-40"
          >
            {pending ? "Hiding…" : `Yes, hide ${count}`}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={!canReview}
          className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
        >
          Hide all {count}
        </button>
      )}

      {!canReview && (
        <p className="mt-2 text-[13px] text-gray-warm">
          Reviewing accounts needs the admin or owner role.
        </p>
      )}
      {msg && <p className="mt-3 text-[13px] text-pos-dark">{msg}</p>}
      {err && <p className="mt-3 text-[13px] text-risk">{err}</p>}
    </div>
  );
}
