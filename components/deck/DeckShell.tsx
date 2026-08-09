"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { logDeckView, logDeckPrint, requestDeckDownload } from "@/app/deck/actions";

/**
 * Presentation shell.
 *
 * The deck behaves like slideware on screen and like a document in print, and
 * the trick that makes both work is that EVERY slide stays mounted. Only one is
 * visible at a time on screen; `@media print` reveals all of them and puts a
 * page break after each. Unmounting inactive slides would have been the obvious
 * implementation and would have printed a one-page PDF.
 *
 * The previous deck scrolled between slides, which meant a half-scrolled state
 * existed and a projector could show two half-slides at once. There is no
 * scroll position here — the active slide is state.
 */

type Props = {
  slides: ReactNode[];
  /** Resolved from the session server-side. Never trusted from the client. */
  signedIn: boolean;
  deck?: "buyer" | "founders";
  /**
   * Set only after a share-link signature has verified on the server. A
   * recipient who arrived by signed link is already identified, so the print
   * gate doesn't ask them to type a name we'd trust less than the one we have.
   */
  linkLabel?: string | null;
  /**
   * Verified on the server from a signed download grant. Non-null means this
   * viewer's address was proven by clicking a link we emailed, so printing is
   * allowed and every page carries their name.
   *
   * A string, not an identity object, on purpose — the client renders it and
   * never composes one, so there is no path where a query parameter becomes a
   * watermark.
   */
  watermark?: string | null;
  /** Identity inside a verified download grant — prefills the print confirm. */
  grantName?: string | null;
  grantEmail?: string | null;
};

export default function DeckShell({
  slides,
  signedIn,
  deck = "buyer",
  linkLabel = null,
  watermark = null,
  grantName = null,
  grantEmail = null,
}: Props) {
  const [i, setI] = useState(0);
  const [gate, setGate] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const total = slides.length;

  /**
   * Presentation mode.
   *
   * `presenting` tracks the browser, never our own intent — the user can leave
   * fullscreen by pressing Escape or F11, or by switching spaces, and none of
   * those routes through our handler. Listening to `fullscreenchange` is what
   * keeps the chrome from staying hidden after the browser has already exited.
   *
   * Fullscreen must be requested inside a user gesture, so this is only ever
   * called from the key handler or the button. Safari still wants the webkit
   * prefix; the cast is the price of that and stays local to these two calls.
   */
  const shell = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const el = shell.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      const req =
        el.requestFullscreen ??
        (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen;
      req?.call(el);
    } else {
      const exit =
        document.exitFullscreen ??
        (
          document as unknown as {
            webkitExitFullscreen?: () => Promise<void>;
          }
        ).webkitExitFullscreen;
      exit?.call(document);
    }
  }, []);

  useEffect(() => {
    const sync = () => setPresenting(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  // Fires once per load. StrictMode double-invokes effects in dev, so the ref
  // is what stops every local page load logging two views.
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    logDeckView(deck, linkLabel);
  }, [deck, linkLabel]);

  const go = useCallback(
    (n: number) => setI((c) => Math.max(0, Math.min(total - 1, n))),
    [total]
  );

  const print = useCallback(() => {
    // Give the print stylesheet a frame to lay all the slides out.
    requestAnimationFrame(() => window.print());
  }, []);

  const onPrintClick = useCallback(() => {
    /*
      A signed-in viewer prints straight through: the session is real proof of
      identity, re-derived server-side, and asking them to type an address we
      already hold would be theatre.

      Everyone else gets a gate — including holders of a valid grant or share
      link, which is a change. Those URLs are bearer tokens: whoever a
      recipient forwards one to inherits the same watermark and, before this,
      printed silently under the original recipient's name. The gate confirms
      rather than interrogates — the grant's own name and email are prefilled,
      so the intended recipient clicks once — and what it buys is the gap
      between who a link was issued to and who actually printed. That gap is
      the forwarding signal, and it was previously invisible.
    */
    if (signedIn) {
      logDeckPrint(undefined, deck, linkLabel);
      print();
      return;
    }
    setGate(true);
  }, [signedIn, linkLabel, deck, print]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack keys while someone is typing in the contact form.
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          setI((c) => Math.min(total - 1, c + 1));
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          setI((c) => Math.max(0, c - 1));
          break;
        case "Home":
          e.preventDefault();
          setI(0);
          break;
        case "End":
          e.preventDefault();
          setI(total - 1);
          break;
        case "f":
        case "F":
          // Not preventDefault'd for F11 — that's the browser's own fullscreen
          // and hijacking it would surprise someone who already knows it.
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          // The browser exits fullscreen on Escape by itself; fullscreenchange
          // updates `presenting`. All this needs to do is close the gate.
          setGate(false);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, toggleFullscreen]);

  return (
    <div ref={shell} className={`dk${presenting ? " dk-presenting" : ""}`}>
      <header className="dk-bar">
        <div className="dk-brand">
          <svg width="21" height="21" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="dk_g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4AC9DC" />
                <stop offset="100%" stopColor="#2463EB" />
              </linearGradient>
              <linearGradient id="dk_g2" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#3CBF6C" />
                <stop offset="60%" stopColor="#2463EB" />
              </linearGradient>
            </defs>
            <polygon points="20,2 36,36 26,36 20,18 14,36 4,36" fill="url(#dk_g1)" />
            <polygon points="20,18 30,36 20,30 10,36" fill="url(#dk_g2)" opacity="0.9" />
          </svg>
          <span className="dk-wordmark">AXIONIA</span>
        </div>

        <div className="dk-bar-r">
          <button
            onClick={toggleFullscreen}
            className="dk-btn"
            aria-pressed={presenting}
          >
            {presenting ? "Exit full screen" : "Present"}
          </button>
          <button onClick={onPrintClick} className="dk-btn">
            Download PDF
          </button>
          {/* The way out. `dk` covers the viewport and replaces the site nav,
              so without this the only exit is the browser back button — and a
              deck opened from a signed link has no history to go back to. */}
          <a href="/" className="dk-exit" aria-label="Leave the deck">
            Close
          </a>
          <span className="dk-count">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </header>

      <main className="dk-stage">
        {slides.map((s, n) => (
          <section
            key={n}
            className={`dk-slide ${n === i ? "is-on" : ""}`}
            aria-hidden={n === i ? undefined : true}
          >
            <div className="dk-inner">{s}</div>
          </section>
        ))}
      </main>

      <nav className="dk-nav" aria-label="Slides">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className="dk-arrow"
          aria-label="Previous slide"
        >
          ←
        </button>
        <div className="dk-dots">
          {slides.map((_, n) => (
            <button
              key={n}
              onClick={() => go(n)}
              className={`dk-dot ${n === i ? "is-on" : ""}`}
              aria-label={`Slide ${n + 1}`}
              aria-current={n === i ? "true" : undefined}
            />
          ))}
        </div>
        <button
          onClick={() => go(i + 1)}
          disabled={i === total - 1}
          className="dk-arrow"
          aria-label="Next slide"
        >
          →
        </button>
      </nav>

      {/*
        The stamp. print-only, on every page, because the screen copy isn't the
        one that travels — the PDF is.

        Phrased as "prepared for" rather than a legal notice. It reads as
        ordinary personalisation and is exactly as traceable, and a document
        that visibly distrusts its reader is a worse document.
      */}
      {watermark && <div className="dk-watermark">{watermark}</div>}

      {/* No onDone: the gate no longer hands over the file. It emails a link,
          and printing happens on the next visit with ?dl= — which is the
          point, since that visit is the one that proved the address. */}
      {gate && (
        <PrintGate
          deck={deck}
          linkLabel={linkLabel}
          grantName={grantName}
          grantEmail={grantEmail}
          onPrinted={print}
          onClose={() => setGate(false)}
        />
      )}
    </div>
  );
}

function PrintGate({
  deck,
  linkLabel,
  grantName,
  grantEmail,
  onPrinted,
  onClose,
}: {
  deck: "buyer" | "founders";
  linkLabel: string | null;
  grantName: string | null;
  grantEmail: string | null;
  onPrinted: () => void;
  onClose: () => void;
}) {
  /*
    Two modes, and which one you get depends on whether we already proved who
    you are.

    CONFIRM — you hold a verified download grant or a signed share link. We
    know who the link was issued to, so the fields are prefilled and printing
    is one click. "Not you?" clears them and requires a real address, which is
    the forwarded case and the only one this mode exists to catch. Nothing is
    emailed; you already have access.

    REQUEST — you have neither, so nothing about you has been established.
    Unchanged from before: we email a signed link rather than believing a typed
    name, because that round trip is what makes the watermark mean anything.
  */
  const verified = Boolean(grantEmail || linkLabel);

  const [name, setName] = useState(grantName ?? "");
  const [email, setEmail] = useState(grantEmail ?? "");
  const [org, setOrg] = useState("");
  const [mine, setMine] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"yes" | "held" | null>(null);

  /*
    Emails a signed link instead of believing what was typed.

    The old gate took a name on trust and handed over the PDF, so the copy left
    with no proof of who took it and the resulting lead was self-reported.
    Clicking a link we sent proves control of the address — the same proof an
    OTP gives, without the ceremony — and it's what makes the watermark on
    every page worth anything.
  */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    // Confirm mode: log who is actually printing, then print. The address is
    // recorded alongside the link's own label, so a mismatch between the two
    // is legible afterwards as a forward.
    if (verified) {
      const res = await logDeckPrint({ name, email, org }, deck, linkLabel);
      setBusy(false);
      if (!res.ok) return setErr(res.error);
      onClose();
      onPrinted();
      return;
    }

    const res = await requestDeckDownload({ deck, name, email, org });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    // `sent: false` means the mailer is unconfigured. Say so rather than
    // claiming to have sent something — a gate that swallows the request looks
    // identical to a broken site.
    setSent(res.sent ? "yes" : "held");
  }

  if (sent) {
    return (
      <div className="dk-modal" role="dialog" aria-modal="true" aria-label="Check your email">
        <div className="dk-modal-box">
          <div className="dk-eyebrow">
            {sent === "yes" ? "On its way" : "We have your request"}
          </div>
          <h2 className="dk-modal-h">
            {sent === "yes" ? "Check your email." : "We'll send it by hand."}
          </h2>
          <p className="dk-modal-p">
            {sent === "yes" ? (
              <>
                We&rsquo;ve sent a link to <strong>{email}</strong>. It opens the
                deck and lets you save the PDF, and it works for seven days.
              </>
            ) : (
              <>
                Our automated mail isn&rsquo;t switched on yet, so this
                won&rsquo;t arrive automatically — but your request is recorded
                and we&rsquo;ll email the deck to <strong>{email}</strong>{" "}
                ourselves.
              </>
            )}
          </p>
          <button type="button" className="dk-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dk-modal" role="dialog" aria-modal="true" aria-label="Download the deck">
      <div className="dk-modal-box">
        <div className="dk-eyebrow">
          {verified ? "Before you print" : "Download the PDF"}
        </div>
        <h2 className="dk-modal-h">
          {verified ? "Who’s taking this copy?" : "Where should we send it?"}
        </h2>
        <p className="dk-modal-p">
          {verified ? (
            <>
              This copy is registered to{" "}
              <strong>{grantName || linkLabel || "the original recipient"}</strong>
              , and every page carries that name. If you&rsquo;re someone else,
              say so — we&rsquo;d rather know who has it than guess.
            </>
          ) : (
            <>
              We&rsquo;ll email you a link rather than hand the file over here.
              There&rsquo;s no follow-up sequence attached — the deck is a
              document, not a funnel. Your copy carries your name on each page,
              so if it travels we know which one it was.
            </>
          )}
        </p>

        {verified && mine && (
          <button
            type="button"
            className="dk-notme"
            onClick={() => {
              setMine(false);
              setName("");
              setEmail("");
            }}
          >
            Not {grantName || linkLabel}? Tell us who you are
          </button>
        )}

        <form onSubmit={submit}>
          <label className="dk-label" htmlFor="dk-name">Name</label>
          <input
            id="dk-name"
            className="dk-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoFocus
          />

          <label className="dk-label" htmlFor="dk-email">Work email</label>
          <input
            id="dk-email"
            className="dk-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="dk-label" htmlFor="dk-org">Organisation</label>
          <input
            id="dk-org"
            className="dk-input"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            autoComplete="organization"
          />

          {err && <p className="dk-err">{err}</p>}

          <div className="dk-modal-actions">
            <button type="submit" className="dk-btn dk-btn-solid" disabled={busy}>
              {busy ? "One moment…" : verified ? "Confirm and print" : "Open the PDF"}
            </button>
            <button type="button" onClick={onClose} className="dk-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
