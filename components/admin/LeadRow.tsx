"use client";

import { useState, useTransition } from "react";
import { setLeadHandled } from "@/app/admin/inbox/actions";

/**
 * One inquiry, and the one action worth taking on it.
 *
 * The reply happens in email — there's no value in rebuilding a mail client
 * here — so the button that matters is "I dealt with this", and the mailto is
 * the fastest route to actually doing it.
 *
 * The note is optional and one line. It exists so that the same person in
 * three weeks knows what was said, not to become a CRM: `companies.stage`
 * already handles anything that turns into a real opportunity.
 */
export default function LeadRow({
  lead,
}: {
  lead: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    interest: string;
    message: string | null;
    handledAt: string | null;
    handledNote: string | null;
    when: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handled = Boolean(lead.handledAt);

  const run = (h: boolean, n?: string) => {
    setErr(null);
    startTransition(async () => {
      const res = await setLeadHandled({ leadId: lead.id, handled: h, note: n });
      if (!res.ok) setErr(res.error);
      else {
        setNoting(false);
        setNote("");
      }
    });
  };

  const btn =
    "px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:opacity-40";

  return (
    <div className={`p-5 ${handled ? "bg-base-2/60" : "bg-base"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[15px] text-navy">{lead.name}</span>
            <a
              href={`mailto:${lead.email}`}
              className="text-[13px] text-blue hover:underline"
            >
              {lead.email}
            </a>
            {lead.company && (
              <span className="text-[13px] text-gray-warm">{lead.company}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 border border-border text-gray-warm">
              {lead.interest}
            </span>
            <span className="font-mono text-[10px] text-gray-cool">{lead.when}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`mailto:${lead.email}?subject=${encodeURIComponent("Following up — Axionia")}`}
            className={`${btn} border-border text-gray-warm hover:border-navy hover:text-navy`}
          >
            Reply
          </a>
          {handled ? (
            <button
              onClick={() => run(false)}
              disabled={pending}
              className={`${btn} border-border text-gray-cool hover:border-navy hover:text-navy`}
            >
              Reopen
            </button>
          ) : noting ? (
            <button
              onClick={() => run(true, note)}
              disabled={pending}
              className={`${btn} border-pos text-pos-dark hover:bg-pos hover:text-base`}
            >
              {pending ? "…" : "Save"}
            </button>
          ) : (
            <button
              onClick={() => setNoting(true)}
              className={`${btn} border-navy text-navy hover:bg-navy hover:text-base`}
            >
              Mark handled
            </button>
          )}
        </div>
      </div>

      {lead.message && (
        <p className="mt-3 text-[14px] leading-[1.7] text-gray-warm max-w-measure whitespace-pre-line">
          {lead.message}
        </p>
      )}

      {noting && !handled && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you do about it? (optional)"
          className="mt-3 w-full max-w-measure border border-border bg-white/60 px-3 py-2 font-sans text-[14px] focus:outline-none focus:border-navy"
        />
      )}

      {handled && lead.handledNote && (
        <p className="mt-3 font-mono text-[11px] leading-[1.6] text-gray-warm">
          {lead.handledNote}
        </p>
      )}

      {err && <p className="mt-2 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
