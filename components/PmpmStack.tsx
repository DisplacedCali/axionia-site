"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "./CountUp";

/**
 * The accumulation problem, made concrete.
 *
 * Every point solution is individually cheap — a dollar here, six dollars
 * there — which is exactly why the stack is never summed. Each was approved
 * in a different year, by a different person, against a different vendor
 * study. The visitor almost certainly hasn't added theirs up.
 *
 * PMPM figures are typical market ranges, shown as ranges, per the house rule
 * that dollar impacts are never single points.
 */
const STACK = [
  { name: "Telehealth / virtual primary care", lo: 1, hi: 4 },
  { name: "Employee assistance program", lo: 1, hi: 3 },
  { name: "Care navigation & advocacy", lo: 3, hi: 9 },
  { name: "Musculoskeletal / digital PT", lo: 3, hi: 12 },
  { name: "Diabetes management", lo: 3, hi: 9 },
  { name: "Behavioral & mental health", lo: 4, hi: 14 },
  { name: "Weight management & GLP-1 support", lo: 6, hi: 30 },
  { name: "Fertility & family building", lo: 5, hi: 18 },
  { name: "Cancer support & centers of excellence", lo: 2, hi: 8 },
  { name: "Second opinion services", lo: 1, hi: 3 },
  { name: "Diabetes prevention", lo: 1, hi: 4 },
  { name: "Sleep, tobacco, misc. point solutions", lo: 1, hi: 5 },
];

const SIZES = [500, 820, 2000, 4500];

export default function PmpmStack() {
  const [lives, setLives] = useState(820);

  const totalLo = STACK.reduce((s, x) => s + x.lo, 0);
  const totalHi = STACK.reduce((s, x) => s + x.hi, 0);
  const mid = (totalLo + totalHi) / 2;
  const annualMid = Math.round((mid * lives * 12) / 1000) * 1000;

  const money = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

  const maxHi = Math.max(...STACK.map((s) => s.hi));

  return (
    <div>
      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16 items-start">
        {/* ── the stack ── */}
        <div className="border border-border bg-base">
          <div className="flex items-baseline justify-between gap-4 px-5 sm:px-6 py-3.5 bg-base-2 border-b border-border">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
              A fairly ordinary point-solution stack
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
              $ PMPM
            </span>
          </div>

          {STACK.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-4 px-5 sm:px-6 py-2.5 border-b border-border last:border-b-0"
            >
              <span className="text-[13px] sm:text-[14px] text-navy flex-1 min-w-0 leading-snug">
                {s.name}
              </span>
              <span className="hidden sm:block w-28 shrink-0">
                <span className="block h-1.5 bg-base-2 rounded-full overflow-hidden">
                  <motion.span
                    className="block h-full bg-axionia-gradient"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.hi / maxHi) * 100}%` }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.7,
                      delay: 0.04 * i,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </span>
              </span>
              <span className="font-mono text-[12px] text-gray-warm tabular-nums shrink-0 w-16 text-right">
                {s.lo}–{s.hi}
              </span>
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-4 px-5 sm:px-6 py-4 bg-navy text-base">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              Stacked
            </span>
            <span className="font-mono text-[15px] tabular-nums">
              ${totalLo}–${totalHi} PMPM
            </span>
          </div>
        </div>

        {/* ── what that costs ── */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
            At your headcount, that&rsquo;s
          </div>

          <div className="font-serif font-light text-5xl md:text-6xl leading-none tabular-nums">
            <CountUp to={annualMid} prefix="$" />
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
            per year · {lives.toLocaleString("en-US")} covered lives · midpoint
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {SIZES.map((n) => (
              <button
                key={n}
                onClick={() => setLives(n)}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                  lives === n
                    ? "border-navy bg-navy text-base"
                    : "border-border text-gray-warm hover:border-navy"
                }`}
              >
                {n.toLocaleString("en-US")}
              </button>
            ))}
          </div>

          <p className="mt-7 text-[15px] leading-[1.75] text-gray-warm max-w-measure">
            Not one of these looked expensive on the day it was approved. Six dollars
            a month is a rounding error. They were signed in different years, by
            different people, each against a vendor study nobody had reason to doubt.
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm max-w-measure">
            Stacked, they run{" "}
            <strong className="text-navy">
              {money(annualMid)} a year
            </strong>{" "}
            — real money, sitting alongside your medical spend, and largely unexamined
            since purchase.
          </p>

          <div className="mt-7 border-l-2 border-blue pl-6 py-1">
            <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
              Some of these are creating durable value. Some are paying for outcomes
              you&rsquo;d have gotten anyway. Almost nobody knows which is which.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Ranges are illustrative and vary widely by vendor, contract structure and
        covered population — larger employers typically negotiate lower per-member
        rates and carry more programs, which moves the total in both directions.
        Yours will differ. The point is the arithmetic, not the specific figures.
      </p>
    </div>
  );
}
