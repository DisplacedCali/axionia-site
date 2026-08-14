"use client";

import { useState } from "react";

/**
 * Return on capital, for the person putting the capital in.
 *
 * ── What is derived and what is assumed ──
 *
 * Everything except the exit multiple is arithmetic on numbers the deck already
 * states. $1.0M on a $7.0M post-money is 14.286% at seed. The Series A at $29M
 * pre on $37M post retains 29/37 of that, giving 11.197% — which is the figure
 * the model's cap table produces independently, so the derivation is checkable
 * and it agrees. Bull retains 29/37 then 90/120 through the illustrative Series
 * B, landing at 8.398%, and that agrees too.
 *
 * The exit multiple is the one input the model does not contain, so it is not
 * asserted. It defaults to 5× and the reader moves it.
 *
 * ── Founder ownership now carries the pool and the partner grant ──
 *
 * This used to compute the founder's stake as 85.714% diluted only by the
 * priced rounds, which printed 85.7% / 67.2% / 50.4%. The model's authoritative
 * table is lower — 72.9% / 57.1% / 42.8% — because a 10% employee pool and a 5%
 * partner grant are carved pre-money, and pre-money carves dilute the founder
 * rather than the incoming investor. Overstating it was flattering in the wrong
 * direction: the honest number is the one that shows the founder absorbing the
 * cost of the pool, which is the thing an investor wants to be true. The seed
 * stake is unaffected, which is why only the founder line moves.
 *
 * ── Why 5× is the default ──
 *
 * Capstone Partners put the average disclosed purchase multiple across
 * healthcare IT M&A at 5.3× EV/revenue for 2023 through mid-2025, and the
 * general HealthTech band running into 2026 is 4–6×, with premium analytics
 * carrying proprietary data at 6–8×. Five sits at the transacted average and
 * below the premium band — the conservative read of a business whose Phase 3 is
 * software but whose early revenue is services, which trades lower.
 *
 * The range stops at 8× deliberately. It would be easy to allow 12× and let an
 * enthusiastic reader arrive at a number nobody can defend in a partner
 * meeting, and a model that can be pushed to a fantasy is a model that gets
 * discounted entirely.
 *
 * ── Founder ownership is here, demoted ──
 *
 * It used to be a headline row and the investor's own position wasn't on the
 * slide at all. It stays because 62% at Year 7 says the founder is still
 * carrying the risk and there is no dead equity on the cap table — but it is
 * one line under the investor's numbers rather than beside them.
 */

const SEED_INVESTED = 1.0; // $M
const SEED_POST = 7.0; // $M — $1.0M on $6.0M pre
const SEED_STAKE = SEED_INVESTED / SEED_POST; // 14.286%

/** 10% employee pool + 5% partner grant, both carved pre-money at seed.
 *  Investors are untouched by a pre-money carve; the founder absorbs all of it. */
const CARVE = 0.85;
const FOUNDER_AT_SEED = (1 - SEED_STAKE) * CARVE; // 72.857%

type Scenario = {
  tag: string;
  name: string;
  cond: string;
  /** Fraction of the seed stake surviving later rounds. 1 = no further raise. */
  retention: number;
  revenue: number; // Year 7, $M
  netIncome: number; // Year 7, $M
  raised: string;
  /** The one being underwritten. Marked, and distinct from being selected. */
  plan?: boolean;
  note: string;
};

/**
 * Year-7 revenue and net income are read from the model with the Control toggle
 * set to each scenario in turn, not scaled off one another. The previous figures
 * ($24.0M / $48.0M / $85.0M with $11.4M / $15.6M / $33.5M of net income, and a
 * $15M Series A at $40M pre) came from an earlier cut of the model and every one
 * of them has moved. Bear in particular fell from $24.0M to $11.8M of revenue,
 * which is the correction that matters most: it is the number the floor argument
 * rests on, and the floor argument is the strongest thing on the slide.
 */
const SCENARIOS: readonly Scenario[] = [
  {
    tag: "Bear",
    name: "The floor",
    cond: "Benchmark data doesn't sell · no further raise",
    retention: 1,
    revenue: 11.8,
    netIncome: 4.8,
    raised: "None",
    note: "Nothing dilutes you, because nothing is raised. This is not the failure case — it is EBIT-positive from Year 2 like the other two, and it is the case that makes the Series A a choice rather than a requirement.",
  },
  {
    tag: "Base",
    name: "The plan",
    cond: "Benchmark data sells · $8M Series A at $29M pre",
    retention: 29 / 37,
    revenue: 60.6,
    netIncome: 25.7,
    raised: "$8.0M at $29M pre",
    plan: true,
    note: "The Series A costs you a fifth of your stake and multiplies the company roughly fivefold against Bear. Unlike the round it replaces — $15M at $40M pre — the trade is now clearly worth taking on both exit value and your share of net income, because the round is smaller and fully deployed rather than parked.",
  },
  {
    tag: "Bull",
    name: "The optionality",
    cond: "Benchmark data sells strongly · illustrative $30M Series B",
    retention: (29 / 37) * (90 / 120),
    revenue: 91.3,
    netIncome: 38.2,
    raised: "Series A, then a $30M Series B",
    note: "More capital, more dilution, a materially larger company. The Series B is illustrative of a shape — a new product line or market, most likely acquisition-shaped — rather than a committed raise, and it is not what the valuation being asked for today assumes.",
  },
];

const MULTIPLES = [3, 4, 5, 6, 7, 8];
const DEFAULT_MULTIPLE = 5;

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const money = (n: number) =>
  n >= 10 ? `$${n.toFixed(1)}M` : `$${n.toFixed(2)}M`;

function derive(s: Scenario, multiple: number) {
  const stake = SEED_STAKE * s.retention;
  const attributableRevenue = stake * s.revenue;
  const attributableIncome = stake * s.netIncome;
  const value = attributableRevenue * multiple;
  return {
    stake,
    founder: FOUNDER_AT_SEED * s.retention,
    attributableRevenue,
    attributableIncome,
    value,
    moic: value / SEED_INVESTED,
  };
}

export default function InvestorReturn() {
  const [i, setI] = useState(1); // Base
  const [multiple, setMultiple] = useState(DEFAULT_MULTIPLE);
  const s = SCENARIOS[i];
  const d = derive(s, multiple);

  return (
    <>
      {/*
        The scenario cards ARE the control.

        They used to be a static grid on the slide with a second Bear/Base/Bull
        tab strip inside this block, which is two controls for one choice and no
        indication that the top one did anything. Clicking the thing you are
        reading is the obvious gesture; a tab row below it is the one you have
        to be told about.

        Selection and "the plan" are deliberately different marks. Base is what
        is being underwritten whether or not it is the card currently open, and
        collapsing the two would mean clicking Bull silently reassigns which
        scenario the round is priced off.
      */}
      <div className="dk-grid-3 dk-scn-pick" data-deck-keys="local" role="group" aria-label="Scenario">
        {SCENARIOS.map((x, n) => (
          <button
            key={x.tag}
            className={`dk-scn ${n === i ? "is-on" : ""}`}
            onClick={() => setI(n)}
            aria-pressed={n === i}
          >
            <span className="dk-scn-h">
              <span className="dk-scn-tag">
                {x.tag}
                {x.plan && <em className="dk-scn-plan">Underwritten</em>}
              </span>
              <span className="dk-scn-n">{x.name}</span>
              <span className="dk-scn-c">{x.cond}</span>
            </span>
            <span className="dk-scn-b">
              <span className="dk-scn-r">
                <span>Year 7 revenue</span>
                <span>${x.revenue.toFixed(1)}M</span>
              </span>
              <span className="dk-scn-r">
                <span>Year 7 net income</span>
                <span>${x.netIncome.toFixed(1)}M</span>
              </span>
              <span className="dk-scn-r">
                <span>Capital raised after this</span>
                <span>{x.raised}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="dk-roc" data-deck-keys="local">
        <div className="dk-roc-bar">
          <div className="dk-roc-sel">
            What <strong>{s.tag}</strong> means for your $1.0M
          </div>
          <div className="dk-roc-mult">
            <span className="dk-roc-mult-l">Exit multiple</span>
            {MULTIPLES.map((m) => (
              <button
                key={m}
                className={`dk-roc-m ${m === multiple ? "is-on" : ""}`}
                onClick={() => setMultiple(m)}
                aria-pressed={m === multiple}
              >
                {m}×
              </button>
            ))}
          </div>
        </div>

        <div className="dk-roc-grid">
          <div className="dk-roc-c">
            <div className="dk-roc-k">Your stake at exit</div>
            <div className="dk-roc-v">{pct(d.stake)}</div>
            <div className="dk-roc-d">
              From {pct(SEED_STAKE)} at seed
              {s.retention < 1 ? ", after the Series A" : ", never diluted"}
            </div>
          </div>
          <div className="dk-roc-c">
            <div className="dk-roc-k">Attributable Year 7 revenue</div>
            <div className="dk-roc-v">{money(d.attributableRevenue)}</div>
            <div className="dk-roc-d">
              Your share of {money(s.revenue)} total
            </div>
          </div>
          <div className="dk-roc-c is-lead">
            <div className="dk-roc-k">Implied value of your $1.0M</div>
            <div className="dk-roc-v">{money(d.value)}</div>
            <div className="dk-roc-d">
              At {multiple}× revenue, undiscounted
            </div>
          </div>
          <div className="dk-roc-c is-lead">
            <div className="dk-roc-k">Multiple on invested capital</div>
            <div className="dk-roc-v">{d.moic.toFixed(1)}×</div>
            <div className="dk-roc-d">
              Gross, before fees, carry and time value
            </div>
          </div>
        </div>

        <div className="dk-roc-second">
          <span>
            <strong>{money(d.attributableIncome)}</strong> — your share of Year 7
            net income, which needs no exit assumption at all
          </span>
          <span>
            <strong>{pct(d.founder)}</strong> — founder ownership at the same
            point, after the employee pool and partner grant. No dead equity, and
            the risk stays with the person taking it
          </span>
        </div>

        <div className="dk-roc-note">{s.note}</div>
      </div>

      {/* Printed copy: the default multiple, all three scenarios, no controls.
          Only reachable on a deck that prints at all — the investor deck
          replaces its print output entirely — but the block is shared, so it
          degrades correctly wherever it ends up. */}
      <div className="dk-roc-board" aria-hidden="true">
        <div className="dk-roc-board-k">
          Return on $1.0M at {DEFAULT_MULTIPLE}× revenue
        </div>
        <div className="dk-roc-board-r is-head">
          <span>Scenario</span>
          <span>Stake</span>
          <span>Attributable rev.</span>
          <span>Implied value</span>
          <span>MOIC</span>
          <span>Founder</span>
        </div>
        {SCENARIOS.map((x) => {
          const b = derive(x, DEFAULT_MULTIPLE);
          return (
            <div className="dk-roc-board-r" key={x.tag}>
              <span>{x.tag}</span>
              <span>{pct(b.stake)}</span>
              <span>{money(b.attributableRevenue)}</span>
              <span>{money(b.value)}</span>
              <span>{b.moic.toFixed(1)}×</span>
              <span>{pct(b.founder)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
