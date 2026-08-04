"use client";

import { useState, useTransition } from "react";
import { setRequestStatus } from "@/app/admin/actions";

/**
 * Archive (and un-archive) a request from the queue row.
 *
 * Archiving was previously reachable only from inside the request, which meant
 * clearing a test submission or a duplicate cost two navigations to do
 * something you'd already decided on from the list.
 *
 * There is no delete. Archive removes the row from every working view, and a
 * second lifecycle for "really gone" would be a third state machine on top of
 * the two this queue already runs — for the sake of rows nobody looks at.
 *
 * Two-step, not one. Archiving is reversible, but an accidental archive on a
 * live request looks exactly like the request disappearing, and this control
 * sits on a row you might be clicking to open. The confirm is one extra click
 * on a rare action, which is the right side of that trade.
 */
export default function ArchiveControl({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archived = status === "archived";

  const run = (next: "archived" | "new") => {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      const res = await setRequestStatus(requestId, next);
      if (!res.ok) setError(res.error);
    });
  };

  // Released work is the record of something a client received. Reopening it
  // from a list would be a strange thing to do by accident, so the control is
  // simply absent rather than disabled.
  if (status === "sent") return null;

  const base =
    "font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border transition-colors disabled:opacity-40";

  if (archived) {
    return (
      <button
        type="button"
        onClick={() => run("new")}
        disabled={pending}
        className={`${base} border-border text-gray-cool hover:border-navy hover:text-navy`}
      >
        {pending ? "…" : "Restore"}
      </button>
    );
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => run("archived")}
          disabled={pending}
          className={`${base} border-risk text-risk hover:bg-risk hover:text-base`}
        >
          {pending ? "…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`${base} border-border text-gray-cool hover:border-navy`}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${base} border-border text-gray-cool hover:border-navy hover:text-navy`}
      >
        Archive
      </button>
      {error && <span className="font-mono text-[9px] text-risk">{error}</span>}
    </span>
  );
}
