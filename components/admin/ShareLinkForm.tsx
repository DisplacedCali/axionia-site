"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  createShareLink,
  searchEntities,
  createEntity,
} from "@/app/admin/decks/actions";
import type { LinkedDeck, Entity } from "@/lib/deckLinks";

/**
 * Mints a per-recipient link for one deck.
 *
 * One link per recipient rather than one shared link, because a forwarded link
 * still reports whose copy travelled — which is most of the point of logging
 * these decks at all.
 *
 * The `deck` prop also namespaces the field ids. Three of these render on
 * /admin/decks, and duplicate ids would point every <label htmlFor> at
 * whichever input the browser found first — so clicking "Recipient" under the
 * investor form would focus the buyer one.
 *
 * ── ATTACHING A COMPANY OR FIRM ──
 *
 * The recipient field is still free text, because it is what the log shows and
 * a person's name belongs in it. What changed is the second field: picking a
 * company or firm signs that row's id into the link, so every open attributes
 * to an entity rather than to a string somebody will later try to match.
 *
 * Optional, and it stays optional. Being unable to mint a link because a firm
 * isn't in the database yet would be a worse failure than an unattributed
 * open — you'd be stuck mid-conversation. So the picker offers to create the
 * row inline instead of refusing.
 */
export default function ShareLinkForm({
  enabled,
  deck = "founders",
}: {
  enabled: boolean;
  deck?: LinkedDeck;
}) {
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Entity[]>([]);
  const [picked, setPicked] = useState<Entity | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newKind, setNewKind] = useState<"company" | "firm">("firm");
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  /*
    Debounced, and every in-flight search is invalidated by the next keystroke.
    Without the guard the results are whichever request happened to return
    last, which on a slow connection means typing "inv" then "invidia" can
    leave you looking at the matches for "inv".
  */
  const seq = useRef(0);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      const res = await searchEntities(term);
      if (mine === seq.current) setHits(res);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  async function addEntity() {
    setErr(null);
    const res = await createEntity({
      kind: newKind,
      name: q.trim(),
      domain: newDomain,
      firmKind: "investor",
    });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setPicked(res.entity);
    setCreating(false);
    setOpen(false);
    setNewDomain("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setUrl(null);
    setCopied(false);
    start(async () => {
      const res = await createShareLink(
        label,
        days,
        deck,
        picked ? { kind: picked.kind, id: picked.id } : null
      );
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
          <code className="font-mono text-[13px]">.env.local</code>.{" "}
          {deck === "buyer" ? (
            <>
              Until then <code className="font-mono text-[13px]">/deck</code>{" "}
              works exactly as it does today — you just can&rsquo;t attach a name
              to a view, so opens stay anonymous until someone asks for the PDF.
            </>
          ) : (
            <>
              Until then the {deck} deck is reachable only from a staff session —
              which still works for presenting, just not for leaving behind.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label
            htmlFor={`lbl-${deck}`}
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
          >
            Recipient
          </label>
          <input
            id={`lbl-${deck}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Meridian Manufacturing — J. Alvarez"
            className="w-full border border-border bg-white/50 px-4 py-2.5 text-[14px] focus:outline-none focus:border-navy"
          />
        </div>
        {/*
          Attribution, and it says out loud that it's optional. A required
          field here would be the thing that stops you minting a link while
          somebody is waiting for it.
        */}
        <div className="flex-1 min-w-[220px] relative">
          <label
            htmlFor={`ent-${deck}`}
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
          >
            Company or firm <span className="text-gray-cool">· optional</span>
          </label>

          {picked ? (
            <div className="flex items-center justify-between gap-3 border border-navy bg-blue-light px-4 py-2.5">
              <span className="min-w-0">
                <span className="block text-[14px] text-navy truncate">{picked.name}</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-gray-warm">
                  {picked.kind}
                  {picked.firmKind ? ` · ${picked.firmKind}` : ""}
                  {picked.domain ? ` · ${picked.domain}` : ""}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setQ("");
                }}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline shrink-0"
              >
                Clear
              </button>
            </div>
          ) : (
            <input
              id={`ent-${deck}`}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setCreating(false);
              }}
              onFocus={() => setOpen(true)}
              /* A blur that fires before the click would close the list out
                 from under the pointer, so this waits a frame. */
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Invidia Capital"
              autoComplete="off"
              className="w-full border border-border bg-white/50 px-4 py-2.5 text-[14px] focus:outline-none focus:border-navy"
            />
          )}

          {open && !picked && q.trim().length >= 2 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 border border-border bg-base shadow-sm max-h-64 overflow-auto">
              {hits.map((h) => (
                <button
                  key={`${h.kind}-${h.id}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setPicked(h);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
                >
                  <span className="block text-[14px] text-navy truncate">{h.name}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool">
                    {h.kind}
                    {h.firmKind ? ` · ${h.firmKind}` : ""}
                    {h.domain ? ` · ${h.domain}` : ""}
                  </span>
                </button>
              ))}

              {creating ? (
                <div className="px-4 py-3 bg-base-2 space-y-2">
                  <div className="flex gap-2">
                    {(["firm", "company"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setNewKind(k)}
                        className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 border ${
                          newKind === k
                            ? "border-navy bg-navy text-base"
                            : "border-border text-gray-warm"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={
                      newKind === "company" ? "domain, required" : "domain, optional"
                    }
                    className="w-full border border-border bg-white/50 px-3 py-2 text-[13px] focus:outline-none focus:border-navy"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addEntity}
                    className="w-full px-3 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
                  >
                    Create &ldquo;{q.trim()}&rdquo;
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCreating(true)}
                  className="w-full text-left px-4 py-2.5 bg-base-2 font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
                >
                  {hits.length === 0 ? "Nothing matches — add it" : "Not here? Add it"}
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor={`exp-${deck}`}
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
          >
            Expires
          </label>
          <select
            id={`exp-${deck}`}
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
              {picked ? ` · ${picked.name}` : ""}
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
        {" "}Attaching a company or firm signs its id into the link, so every
        open attributes to that row even if the deck is forwarded on. Without
        one the open still logs, just under the recipient name you typed.
      </p>
    </div>
  );
}
