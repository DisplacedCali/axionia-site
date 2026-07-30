"use client";

import { useState, useTransition } from "react";
import { createShareLink } from "@/app/admin/decks/actions";

/**
 * Mints a per-recipient founders-deck link.
 *
 * One link per recipient rather than one shared link, because a forwarded link
 * still reports whose copy travelled — which is most of the point of logging
 * this deck at all.
 */
export default function ShareLinkForm({ enabled }: { enabled: boolean }) {
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setUrl(null);
    setCopied(false);
    start(async () => {
      const res = await createShareLink(label, days);
      if (!res.ok) setErr(res.error);
      else setUrl(res.url);
    });
  }

  if (!enabled) {
    return (
      <div className="border-l-2 border-caution bg-amber-light px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
          Share links unavailable
        </p>
        <p className="mt-1.5 text-[14px] leading-[1.7] text-gray-warm">
          Set <code className="font-mono text-[13px]">DECK_LINK_SECRET</code> to a
          random string of at least 24 characters, in Vercel and in{" "}
          <code className="font-mono text-[13px]">.env.local</code>. Until then the
          founders deck is reachable only from a staff session — which still works
          for presenting, just not for leaving behind.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label
            htmlFor="lbl"
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
          >
            Recipient
          </label>
          <input
            id="lbl"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Meridian Manufacturing — J. Alvarez"
            className="w-full border border-border bg-white/50 px-4 py-2.5 text-[14px] focus:outline-none focus:border-navy"
          />
        </div>
        <div>
          <label
            htmlFor="exp"
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
          >
            Expires
          </label>
          <select
            id="exp"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-border bg-white/50 px-3 py-2.5 text-[14px] focus:outline-none focus:border-navy"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending || !label.trim()}
          className="px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
        >
          {pending ? "Minting…" : "Create link"}
        </button>
      </form>

      {err && <p className="mt-3 text-[13px] text-risk">{err}</p>}

      {url && (
        <div className="mt-4 border border-border bg-base-2 p-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-warm">
              Link for {label}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block font-mono text-[11px] leading-relaxed text-navy break-all">
            {url}
          </code>
        </div>
      )}

      <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Links can&rsquo;t be revoked one at a time. Rotating{" "}
        <code className="font-mono">DECK_LINK_SECRET</code> invalidates every
        outstanding link at once — which is the control you want if one gets
        forwarded somewhere it shouldn&rsquo;t have gone.
      </p>
    </div>
  );
}
