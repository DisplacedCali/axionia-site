"use client";

import { useState, useTransition } from "react";
import { sendReportTo } from "@/app/admin/send-actions";

/**
 * Send a released report to anyone, account or not.
 *
 * Until now a report could only reach the person who submitted the request,
 * and admin-initiated research had nobody to notify at all — it sat in the
 * company folder waiting for someone from that company to happen to sign up.
 * Useless for the actual case: a CFO you met at a conference, a broker who
 * asked to see the work, an advisor who will never create an account.
 *
 * Two modes, and the choice is a real one rather than a preference:
 *
 *   Invite — creates the account, so RLS does the authorisation and every view
 *            is attributable to a person. Costs the recipient one sign-in.
 *   Link   — signed, expiring, bound to this report id. Zero friction, and
 *            anyone holding the URL can read it.
 *
 * Company is optional on purpose. A broker has no company record here and
 * shouldn't need one invented to receive a report — requiring it would push
 * junk rows into the CRM, which is worse than a null.
 */
export default function SendReport({
  reportId,
  requestId,
  companyId,
  companyName,
  released,
  linksEnabled,
}: {
  reportId: string;
  requestId: string | null;
  companyId: string | null;
  companyName: string | null;
  released: boolean;
  linksEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"invite" | "link">("invite");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [attach, setAttach] = useState(true);
  const [days, setDays] = useState(14);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState<{ url: string; created: boolean } | null>(null);

  const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";
  const input =
    "w-full border border-border bg-white/60 px-3 py-2.5 font-sans text-[14px] focus:outline-none focus:border-navy";
  const btn =
    "px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40";

  // Sending a draft would route around the one gate the review process exists
  // to defend. The action refuses too — this only avoids offering it.
  if (!released) return null;

  function send() {
    setErr(null);
    setSent(null);
    startTransition(async () => {
      const res = await sendReportTo({
        reportId,
        requestId,
        email,
        fullName,
        organisation,
        companyId: attach ? companyId : null,
        mode,
        days,
      });
      if (!res.ok) return setErr(res.error);
      setSent({ url: res.url, created: res.created });
      setEmail("");
      setFullName("");
      setOrganisation("");
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={btn}>
        Send to someone else
      </button>
    );
  }

  return (
    <div className="border border-border bg-base p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className={label}>Send this report</h3>
        <button
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy"
        >
          Close
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(
          [
            ["invite", "Invite", "They get an account"],
            ["link", "Signed link", "No account needed"],
          ] as const
        ).map(([m, title, note]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={m === "link" && !linksEnabled}
            className={`flex-1 text-left px-3 py-2.5 border transition-colors disabled:opacity-40 ${
              mode === m ? "border-navy bg-navy text-base" : "border-border hover:border-navy"
            }`}
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.12em]">
              {title}
            </span>
            <span
              className={`block font-mono text-[9px] mt-0.5 ${
                mode === m ? "opacity-70" : "text-gray-cool"
              }`}
            >
              {note}
            </span>
          </button>
        ))}
      </div>

      {mode === "link" && !linksEnabled && (
        <p className="mb-4 text-[13px] leading-[1.6] text-caution-dark">
          Signed links need <span className="font-mono">REPORT_LINK_SECRET</span> set
          to 24 characters or more. Falls back to{" "}
          <span className="font-mono">DECK_LINK_SECRET</span> if that&rsquo;s
          present — though separate secrets mean a deck leak doesn&rsquo;t lock
          clients out of their reports.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cfo@example.com"
            className={`${input} mt-1.5`}
          />
        </div>
        <div>
          <label className={label}>Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dana Whitfield"
            className={`${input} mt-1.5`}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className={label}>
          Organisation <span className="text-gray-cool">(optional)</span>
        </label>
        <input
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
          placeholder="Their firm — a broker or advisor may not be the employer"
          className={`${input} mt-1.5`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        {companyId && (
          <label className="flex items-center gap-2 text-[13px] text-gray-warm">
            <input
              type="checkbox"
              checked={attach}
              onChange={(e) => setAttach(e.target.checked)}
            />
            Attach to {companyName || "this company"}
          </label>
        )}
        {mode === "link" && (
          <label className="flex items-center gap-2 text-[13px] text-gray-warm">
            Expires in
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-border bg-white/60 px-2 py-1 font-mono text-[12px]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
        )}
      </div>

      {/*
        Said plainly, because it's the part someone will be asked about later.
        Attaching to a company also grants that person every future released
        report for that employer via RLS — which is usually what you want and
        occasionally very much not.
      */}
      <p className="mt-4 text-[12px] leading-[1.6] text-gray-warm max-w-measure">
        {mode === "invite"
          ? attach && companyId
            ? "They'll get an account linked to this company, which also gives them any future released report for it."
            : "They'll get an account that can see this report only."
          : "Anyone holding the link can read the report until it expires. Revoke early by rotating REPORT_LINK_SECRET, which invalidates every outstanding link at once."}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={send} disabled={pending || !email.trim()} className={btn}>
          {pending ? "Sending…" : "Send"}
        </button>
        {err && <span className="text-risk text-[13px]">{err}</span>}
      </div>

      {sent && (
        <div className="mt-4 border-l-2 border-pos pl-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-pos-dark mb-1">
            Sent{sent.created ? " · account created" : ""}
          </p>
          <p className="font-mono text-[11px] leading-[1.6] text-gray-warm break-all">
            {sent.url}
          </p>
        </div>
      )}
    </div>
  );
}
