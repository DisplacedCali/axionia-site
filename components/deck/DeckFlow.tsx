"use client";

import { useState } from "react";

/**
 * The setup-to-report walkthrough.
 *
 * ── Why this renders twice ──
 *
 * A click-through is the right thing in a live meeting and the wrong thing in
 * a PDF: /deck is printed and mailed as often as it's presented, and an
 * interactive shell prints as one frozen screen with the other three
 * unreachable. So the same four steps are rendered as a shell (screen only)
 * and as a storyboard (print only), from ONE array.
 *
 * One array is the load-bearing part. Two hand-maintained copies of the same
 * four screens drift, and the copy that drifts silently is the printed one,
 * because nobody reads the PDF as carefully as the slide they just clicked.
 *
 * Everything asserted here is behaviour the pipeline actually has — the wave
 * runner, the identity gate, the edit overlay. The deck this replaced (the
 * pre-port axionia_buyer_deck.html) demoed Monte Carlo and sensitivity
 * analysis, which the product does not do. Those screens are deliberately not
 * restored.
 */

type Step = {
  n: string;
  tab: string;
  /** Fake address bar. Real routes, so nothing here promises a screen we don't have. */
  url: string;
  title: string;
  sub: string;
  rows: readonly (readonly [string, string])[];
  note?: string;
};

const STEPS: readonly Step[] = [
  {
    n: "01",
    tab: "Set up",
    url: "axionia.com / request-report",
    title: "Tell us what you already run.",
    sub: "Company, covered lives, the states you employ in, and the programs in place today. Built on documents you already own — no census, no claims feed, no data project.",
    rows: [
      ["Covered lives", "820 — three states"],
      ["Programs in place", "MSK · navigation · EAP · diabetes"],
      ["Who works here", "Production 62% · Maintenance 18% · Admin 20%"],
      ["Optimising for", "Cost 65 · Absence 20 · Experience 10 · Talent 5"],
    ],
    note: "Only the company is required. A thinner profile scores your sector's average; a fuller one scores you.",
  },
  {
    n: "02",
    tab: "Confirm",
    url: "axionia.com / requests / meridian",
    title: "We check we have the right company before spending the analysis.",
    sub: "The first pass identifies the employer and then stops. A wrong premise at call two is inherited by the eight that follow and stays perfectly consistent about a fiction, so a person ratifies it before anything else runs.",
    rows: [
      ["Identified as", "Meridian Manufacturing — light manufacturing, Midwest"],
      ["Ownership", "Not established — withheld rather than guessed"],
      ["Status", "Awaiting confirmation · Confirm or correct"],
    ],
    note: "A correction is written alongside the model's original answer, never over it.",
  },
  {
    n: "03",
    tab: "Analyse",
    url: "axionia.com / requests / meridian / run",
    title: "Ten passes over the portfolio.",
    sub: "Workforce shape, fit against a curated benefit library, state mandate exposure, each vendor claim taken apart, and eight scored dimensions. Sixty to ninety seconds, and resumable — a failure costs one wave rather than the job.",
    rows: [
      ["Wave 3 of 7", "Benefit design · running"],
      ["Vendor claim", "$180 PMPM claimed → $54 expected"],
      ["Overlap separated", "11 PMPM was being counted twice"],
      ["Overall score", "Recomputed from the eight axes, never model-supplied"],
    ],
  },
  {
    n: "04",
    tab: "What lands",
    url: "axionia.com / reports / meridian",
    title: "A report you can argue with.",
    sub: "The portfolio score and where it is dented, the mix we would design instead, and every adjustment that produced the numbers. Comment on a section and it is rewritten in front of you.",
    rows: [
      ["Portfolio score", "56 / 100 — eight axes, weights on the page"],
      ["Designed mix", "Three picks, including what nobody sells you"],
      ["Every adjustment", "Sourced, and yours to move"],
      ["Every correction", "Recorded with a reason, and reversible"],
    ],
    note: "This page is the deliverable. There is no export step and no second document.",
  },
];

export default function DeckFlow() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = STEPS.length - 1;

  return (
    <>
      {/*
        data-deck-keys="local" tells DeckShell's key handler to leave the
        arrows and the space bar alone while focus is in here. Without it,
        clicking Next and then pressing space advances the SLIDE — which is
        exactly the failure you'd discover in front of a room.
      */}
      <div className="dk-flow" data-deck-keys="local">
        <div className="dk-flow-chrome">
          <span className="dk-flow-tl" />
          <span className="dk-flow-tl" />
          <span className="dk-flow-tl" />
          <span className="dk-flow-url">{s.url}</span>
        </div>

        <div className="dk-flow-tabs" role="tablist" aria-label="Walkthrough">
          {STEPS.map((t, n) => (
            <button
              key={t.n}
              role="tab"
              aria-selected={n === i}
              className={`dk-flow-tab ${n === i ? "is-on" : ""}`}
              onClick={() => setI(n)}
            >
              <span className="dk-flow-tab-n">{t.n}</span>
              {t.tab}
            </button>
          ))}
        </div>

        <div className="dk-flow-body">
          <div className="dk-flow-t">{s.title}</div>
          <div className="dk-flow-s">{s.sub}</div>
          <div className="dk-flow-rows">
            {s.rows.map(([k, v]) => (
              <div className="dk-flow-row" key={k}>
                <span className="dk-flow-k">{k}</span>
                <span className="dk-flow-v">{v}</span>
              </div>
            ))}
          </div>
          {s.note && <div className="dk-flow-note">{s.note}</div>}
        </div>

        <div className="dk-flow-nav">
          <button
            className="dk-flow-btn"
            onClick={() => setI((c) => Math.max(0, c - 1))}
            disabled={i === 0}
          >
            ← Back
          </button>
          <span className="dk-flow-count">
            {s.n} / {STEPS[last].n}
          </span>
          <button
            className="dk-flow-btn is-primary"
            onClick={() => setI((c) => Math.min(last, c + 1))}
            disabled={i === last}
          >
            {i === last ? "End of walkthrough" : `${STEPS[i + 1].tab} →`}
          </button>
        </div>
      </div>

      {/* The printed copy. Same four steps, all visible, no chrome. */}
      <div className="dk-board" aria-hidden="true">
        {STEPS.map((t) => (
          <div className="dk-board-c" key={t.n}>
            <div className="dk-board-n">
              {t.n} — {t.tab}
            </div>
            <div className="dk-board-t">{t.title}</div>
            <div className="dk-board-s">{t.sub}</div>
            {t.rows.map(([k, v]) => (
              <div className="dk-board-row" key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
