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
};

export default function DeckShell({
  slides,
  signedIn,
  deck = "buyer",
  linkLabel = null,
  watermark = null,
}: Props) {
  const [i, setI] = useState(0);
  const [gate, setGate] = useState(false);
  const total = slides.length;

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
    // A verified download grant is as good as a session here — the address was
    // proven by clicking a link we sent to it.
    if (signedIn || linkLabel || watermark) {
      logDeckPrint(undefined, deck, linkLabel);
      print();
      return;
    }
    setGate(true);
  }, [signedIn, linkLabel, deck, print, watermark]);

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
        case "Escape":
          setGate(false);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <div className="dk">
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
          <button onClick={onPrintClick} className="dk-btn">
            Download PDF
          </button>
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
      {gate && <PrintGate deck={deck} onClose={() => setGate(false)} />}
    </div>
  );
}

function PrintGate({
  deck,
  onClose,
}: {
  deck: "buyer" | "founders";
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
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
        <div className="dk-eyebrow">Download the PDF</div>
        <h2 className="dk-modal-h">Where should we send it?</h2>
        <p className="dk-modal-p">
          We&rsquo;ll email you a link rather than hand the file over here.
          There&rsquo;s no follow-up sequence attached — the deck is a document,
          not a funnel. Your copy carries your name on each page, so if it
          travels we know which one it was.
        </p>

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
              {busy ? "One moment…" : "Open the PDF"}
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
