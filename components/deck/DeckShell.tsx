"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { logDeckView, logDeckPrint } from "@/app/deck/actions";

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
};

export default function DeckShell({ slides, signedIn }: Props) {
  const [i, setI] = useState(0);
  const [gate, setGate] = useState(false);
  const total = slides.length;

  // Fires once per load. StrictMode double-invokes effects in dev, so the ref
  // is what stops every local page load logging two views.
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    logDeckView();
  }, []);

  const go = useCallback(
    (n: number) => setI((c) => Math.max(0, Math.min(total - 1, n))),
    [total]
  );

  const print = useCallback(() => {
    // Give the print stylesheet a frame to lay all the slides out.
    requestAnimationFrame(() => window.print());
  }, []);

  const onPrintClick = useCallback(() => {
    if (signedIn) {
      logDeckPrint();
      print();
      return;
    }
    setGate(true);
  }, [signedIn, print]);

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

      {gate && (
        <PrintGate
          onClose={() => setGate(false)}
          onDone={() => {
            setGate(false);
            print();
          }}
        />
      )}
    </div>
  );
}

function PrintGate({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await logDeckPrint({ name, email, org });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    onDone();
  }

  return (
    <div className="dk-modal" role="dialog" aria-modal="true" aria-label="Download the deck">
      <div className="dk-modal-box">
        <div className="dk-eyebrow">Download the PDF</div>
        <h2 className="dk-modal-h">Who should we say has it?</h2>
        <p className="dk-modal-p">
          We don&rsquo;t verify this and there&rsquo;s no follow-up sequence
          attached to it. We ask because a deck that travels is worth knowing
          about, and because we&rsquo;d rather ask than track you.
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
