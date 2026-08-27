"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * Double-counted value, made arithmetic.
 *
 * `REVIEW_GAPS` on the homepage states this in words — "nobody is asked
 * whether the fourth one is claiming the same result as the first three, so
 * the same result gets counted twice and nobody owns the arithmetic" — and
 * until now nothing showed it.
 * The stack visual (PmpmStack) shows cost accumulating. This shows the
 * *savings* side failing to accumulate, which is the harder and more
 * useful half.
 *
 * ── Vocabulary: this is attribution, not care ──
 *
 * Renamed from `BenefitOverlap` on 2026-08-27. The old name and its labels
 * said the *programs* overlap, which is a claim about care delivery that we
 * have no data to make and that CLAUDE.md's never-invent-library-data rule
 * should have caught. What the model below actually computes is the union of
 * competing *attribution* claims against one pool. Nobody is double-charging;
 * the same result is being counted more than once. Do not reintroduce
 * "overlap" as a synonym in any user-facing string — it is used below only in
 * its statistical sense, describing the union, never as a claim about
 * programs.
 *
 * Framing rule, same as everywhere else on the site: nobody here is lying.
 * Each vendor is correctly reporting what its own program did in its own
 * study. The defect is that no one owns the union. A program can be worth
 * buying and still deliver half its headline number once the other four
 * are already in place — that is a portfolio fact, not an accusation.
 *
 * ── The math ──
 * Each domain is a pool of avoidable spend. Programs claim against it.
 * De-duplicated value is the *union* of the claims, not the sum:
 *
 *     dedup = pool × (1 − Π(1 − claimᵢ / pool))
 *
 * This is the standard independent-overlap union. It is deliberately
 * conservative in the employer's favour — it assumes claims collide only
 * as much as chance would predict, where in practice vendors target the
 * same high-cost members on purpose, so real duplication runs higher. Stating
 * the floor rather than the worst case is the honest version, and it means
 * the number survives a vendor pushing back on it.
 *
 * Figures are illustrative, in the manner of PmpmStack — the point is the
 * arithmetic, not the specific values. No library data is used here.
 */

type Domain = {
  k: string;
  label: string;
  /** avoidable spend available in this domain, $ PMPM across the whole population */
  pool: number;
};

const DOMAINS: Domain[] = [
  { k: "img", label: "Specialist & imaging", pool: 14 },
  { k: "surg", label: "Surgery & procedures", pool: 22 },
  { k: "ed", label: "ED & urgent care", pool: 9 },
  { k: "ip", label: "Inpatient & readmits", pool: 18 },
  { k: "rx", label: "Pharmacy", pool: 26 },
  { k: "abs", label: "Absence & productivity", pool: 12 },
];

type Program = {
  k: string;
  name: string;
  short: string;
  /** what this vendor claims, by domain, $ PMPM */
  claims: Record<string, number>;
};

const PROGRAMS: Program[] = [
  {
    k: "msk",
    name: "Musculoskeletal / digital PT",
    short: "MSK",
    claims: { img: 4, surg: 8, abs: 3 },
  },
  {
    k: "bh",
    name: "Behavioral & mental health",
    short: "Behavioral",
    claims: { ed: 2, ip: 4, abs: 4, rx: 1 },
  },
  {
    k: "nav",
    name: "Care navigation & advocacy",
    short: "Navigation",
    claims: { img: 3, surg: 4, ed: 3, ip: 4 },
  },
  {
    k: "dm",
    name: "Diabetes management",
    short: "Diabetes",
    claims: { rx: 5, ip: 3, ed: 1 },
  },
  {
    k: "wm",
    name: "Weight management / GLP-1 support",
    short: "Weight mgmt",
    claims: { surg: 3, rx: 2, ip: 2, abs: 2 },
  },
];

/** Union of claims made against one pool. Always ≤ the sum. */
function unionValue(pool: number, claims: number[]): number {
  const remaining = claims.reduce((acc, c) => acc * (1 - c / pool), 1);
  return pool * (1 - remaining);
}

const LIVES = 820;

export default function DoubleCountedValue() {
  const [on, setOn] = useState<string[]>(PROGRAMS.map((p) => p.k));

  const active = PROGRAMS.filter((p) => on.includes(p.k));

  const rows = useMemo(
    () =>
      DOMAINS.map((d) => {
        const claims = active
          .map((p) => p.claims[d.k] ?? 0)
          .filter((c) => c > 0);
        const claimed = claims.reduce((s, c) => s + c, 0);
        const real = unionValue(d.pool, claims);
        return { ...d, claimed, real, twice: claimed - real };
      }),
    [active],
  );

  const claimedTotal = rows.reduce((s, r) => s + r.claimed, 0);
  const realTotal = rows.reduce((s, r) => s + r.real, 0);
  const twiceTotal = claimedTotal - realTotal;
  const pctTwice = claimedTotal > 0 ? (twiceTotal / claimedTotal) * 100 : 0;

  /** Marginal contribution of one program given everything else already on. */
  const marginal = (p: Program) => {
    const others = active.filter((a) => a.k !== p.k);
    let withOthers = 0;
    let withAll = 0;
    for (const d of DOMAINS) {
      const oc = others.map((o) => o.claims[d.k] ?? 0).filter((c) => c > 0);
      const ac = [...oc, p.claims[d.k] ?? 0].filter((c) => c > 0);
      withOthers += unionValue(d.pool, oc);
      withAll += unionValue(d.pool, ac);
    }
    const claimed = Object.values(p.claims).reduce((s, c) => s + c, 0);
    return { claimed, delivered: withAll - withOthers };
  };

  /** House rule: dollar impacts are ranges, never point figures. */
  const annualRange = (pmpm: number) => {
    const mid = pmpm * LIVES * 12;
    const lo = Math.round((mid * 0.85) / 1000);
    const hi = Math.round((mid * 1.15) / 1000);
    const fmt = (k: number) =>
      k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}K`;
    return `${fmt(lo)}–${fmt(hi)}`;
  };

  const maxScale = Math.max(...rows.map((r) => Math.max(r.claimed, r.pool)), 1);

  return (
    <div>
      {/* ── program toggles ── */}
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
          Programs in place — switch one off to see what it was really adding
        </div>
        <div className="flex flex-wrap gap-2">
          {PROGRAMS.map((p) => {
            const isOn = on.includes(p.k);
            return (
              <button
                key={p.k}
                aria-pressed={isOn}
                onClick={() =>
                  setOn((s) =>
                    s.includes(p.k) ? s.filter((x) => x !== p.k) : [...s, p.k],
                  )
                }
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                  isOn
                    ? "border-navy bg-navy text-base"
                    : "border-border text-gray-cool hover:border-navy hover:text-gray-warm"
                }`}
              >
                {p.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-start">
        {/* ── domain bars ── */}
        <div className="border border-border bg-base">
          <div className="flex items-baseline justify-between gap-4 px-5 sm:px-6 py-3.5 bg-base-2 border-b border-border">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
              Where the savings are claimed
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
              $ PMPM
            </span>
          </div>

          {rows.map((r, i) => (
            <div
              key={r.k}
              className="px-5 sm:px-6 py-3.5 border-b border-border last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="text-[13px] sm:text-[14px] text-navy leading-snug">
                  {r.label}
                </span>
                <span className="font-mono text-[11px] text-gray-cool tabular-nums shrink-0">
                  pool {r.pool}
                </span>
              </div>

              {/* claimed (green, defensible) + double-counted (amber) */}
              <div className="relative h-2.5 bg-base-2 overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-pos"
                  animate={{ width: `${(r.real / maxScale) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.span
                  className="absolute inset-y-0 bg-caution"
                  animate={{
                    left: `${(r.real / maxScale) * 100}%`,
                    width: `${(r.twice / maxScale) * 100}%`,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.03 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>

              <div className="mt-1.5 flex items-baseline gap-4 font-mono text-[10px] tabular-nums text-gray-cool">
                <span>
                  claimed{" "}
                  <span className="text-gray-warm">{r.claimed.toFixed(1)}</span>
                </span>
                <span>
                  counted once{" "}
                  <span className="text-pos-dark">{r.real.toFixed(1)}</span>
                </span>
                {r.twice > 0.05 && (
                  <span>
                    counted twice{" "}
                    <span className="text-caution-dark">
                      {r.twice.toFixed(1)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* legend — dot + word, never colour alone */}
          <div className="flex flex-wrap items-center gap-5 px-5 sm:px-6 py-3 bg-base-2 border-t border-border">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pos shrink-0" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm">
                Defensible
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-caution shrink-0" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm">
                Claimed by more than one program
              </span>
            </span>
          </div>
        </div>

        {/* ── the arithmetic ── */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
            Added up across {active.length} program
            {active.length === 1 ? "" : "s"}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-serif font-light text-5xl md:text-6xl leading-none tabular-nums text-navy">
              {claimedTotal.toFixed(0)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-cool">
              $ PMPM claimed
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-serif font-light text-5xl md:text-6xl leading-none tabular-nums text-pos-dark">
              {realTotal.toFixed(0)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-cool">
              $ PMPM once double-counting is removed
            </span>
          </div>

          {active.length === 0 ? (
            <div className="mt-6 border border-border bg-base-2 px-5 py-4">
              <p className="text-[14px] leading-[1.65] text-gray-warm">
                Nothing selected. Switch a program back on — the first one keeps
                its full claim, and every one after that is claiming against
                results the others have already claimed.
              </p>
            </div>
          ) : (
            <div className="mt-6 border border-caution/30 bg-amber-light px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-caution-dark mb-1.5">
                Counted twice
              </div>
              <p className="text-[14px] leading-[1.65] text-navy">
                <strong className="tabular-nums">
                  {twiceTotal.toFixed(1)} PMPM
                </strong>{" "}
                — about{" "}
                <strong className="tabular-nums">{pctTwice.toFixed(0)}%</strong>{" "}
                of everything claimed, or{" "}
                <strong className="tabular-nums">
                  {annualRange(twiceTotal)}
                </strong>{" "}
                a year at {LIVES.toLocaleString("en-US")} covered lives.
              </p>
            </div>
          )}

          {/* marginal contribution — the actual insight */}
          {active.length > 1 && (
            <div className="mt-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                What each program adds, given the others
              </div>
              <div className="border border-border">
                {active.map((p) => {
                  const m = marginal(p);
                  const pct = m.claimed > 0 ? (m.delivered / m.claimed) * 100 : 0;
                  return (
                    <div
                      key={p.k}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0"
                    >
                      <span className="text-[13px] text-navy flex-1 min-w-0 leading-snug">
                        {p.short}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-gray-cool shrink-0">
                        claims {m.claimed.toFixed(0)}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-navy shrink-0 w-14 text-right">
                        adds {m.delivered.toFixed(1)}
                      </span>
                      <span
                        className={`font-mono text-[10px] tabular-nums shrink-0 w-10 text-right ${
                          pct < 60 ? "text-caution-dark" : "text-gray-warm"
                        }`}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 border-l-2 border-blue pl-6 py-1">
            <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
              Every one of these vendors is reporting its own results correctly.
              The double-count only exists once you own all five.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Illustrative figures for a self-funded employer of about{" "}
        {LIVES.toLocaleString("en-US")}. Double-counting is modelled as the
        union of independent claims against each pool — a deliberately
        conservative floor, since vendors target the same high-cost members on
        purpose and real duplication typically runs higher. Yours will differ.
        The point is the arithmetic, not the specific figures.
      </p>
    </div>
  );
}
