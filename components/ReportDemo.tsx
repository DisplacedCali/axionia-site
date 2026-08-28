"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import RadarChart, { type RadarAxis } from "./RadarChart";
import { GradientButton, GhostButton } from "./ui";

/* ────────────────────────── model ──────────────────────────
   Deliberately simple and fully exposed — every constant below
   is surfaced to the visitor in the Assumptions tab. The default
   configuration reproduces the Meridian MSK case used elsewhere
   on the site ($54 PMPM expected against a $180 PMPM claim).
   ─────────────────────────────────────────────────────────── */

/* The category baseline is what a program in this category plausibly returns
   for this population, modeled independently of anything a vendor says. It is
   deliberately NOT the vendor's claim.

   Until 2026-08-27 the expected case was the vendor's claim times a constant,
   which meant this demo derived its "independent" answer from the number it
   exists to check. Worse, the percentile readout was arithmetically invariant
   to the claim: the claim term cancels between the expected case and the
   standard deviation, so a visitor could type any figure and the percentile
   would not move. Splitting the constant is what makes a claim input mean
   anything.

   One illustrative figure rather than four. Per-category baselines are real
   numbers we do not have yet, and CLAUDE.md is explicit that a plausible
   fabricated row is worse than a missing one. 180 reproduces the $54 expected
   case the rest of the site quotes, so the default view is unchanged. */
const CATEGORY_BASELINE = 180; // $ PMPM — illustrative, one category
const DEFAULT_CLAIM = 180; // $ PMPM, what the vendor says

const SELECTION_BIAS = 0.35; // haircut for study-population selection effects
const BASELINE_ENGAGEMENT = 15; // engagement rate in the vendor's own study

/* Value double-counted across a stack, from the same union as
   DoubleCountedValue: n programs each claiming share s of one pool collide in
   their attribution, so the sum overstates the union. dup = 1 - union/sum.

   At four programs this returns 20.3%, which is what the fixed 20% constant it
   replaces assumed — so the default output does not move, and the visitor now
   owns the number instead of it being applied invisibly. */
const PROGRAM_SHARE = 0.15;
function duplicationShare(n: number) {
  if (n <= 1) return 0;
  const union = 1 - Math.pow(1 - PROGRAM_SHARE, n);
  return 1 - union / (n * PROGRAM_SHARE);
}

const INDUSTRIES = [
  { id: "manufacturing", label: "Light Manufacturing", transfer: 0.58 },
  { id: "professional", label: "Professional Services", transfer: 0.46 },
  { id: "healthcare", label: "Healthcare Services", transfer: 0.63 },
  { id: "retail", label: "Retail & Hospitality", transfer: 0.55 },
] as const;

type IndustryId = (typeof INDUSTRIES)[number]["id"];

const BASE_AXES: { label: string; base: number; peer: number; hue: string }[] = [
  { label: "EVIDENCE", base: 74, peer: 61, hue: "#2463EB" },
  { label: "POPULATION FIT", base: 58, peer: 55, hue: "#4AC9DC" },
  { label: "COST EFFICIENCY", base: 66, peer: 58, hue: "#3CBF6C" },
  { label: "UTILIZATION", base: 41, peer: 49, hue: "#3D4E8F" },
  { label: "VENDOR STABILITY", base: 79, peer: 64, hue: "#2E8C9E" },
  { label: "ENGAGEMENT", base: 52, peer: 50, hue: "#5B7095" },
  { label: "CONTRACT TERMS", base: 47, peer: 54, hue: "#7FA86B" },
  { label: "TRANSPARENCY", base: 63, peer: 44, hue: "#9C6B1A" },
];

const INDUSTRY_DELTAS: Record<IndustryId, number[]> = {
  manufacturing: [0, 0, 0, 0, 0, 0, 0, 0],
  professional: [4, -9, 3, 8, 1, 6, -2, 2],
  healthcare: [2, 6, -4, -3, 2, -1, 3, -2],
  retail: [-3, -4, -6, 2, -2, -5, -4, -1],
};

/* ───────────────────── the stewardship year ─────────────────────
   A portfolio is scored on a benchmark that moves, so a quarter in
   which you do nothing is not a quarter in which nothing happens.
   Both series drift below, and they drift differently.

   Company movement concentrates in the axes a stewardship cycle can
   actually act on — contract terms, transparency, engagement,
   utilization. Evidence and population fit barely move: they're
   properties of the vendor's study population, not of anything you
   did this quarter. Vendor stability goes DOWN, because it does
   sometimes — a vendor gets acquired and nobody tells you.
   ──────────────────────────────────────────────────────────────── */
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

// order matches BASE_AXES
const QUARTER_DELTAS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 3, 0, 4, 6, 5],
  [1, 0, 4, 6, -1, 7, 11, 9],
  [1, 1, 6, 9, -2, 9, 15, 12],
];

// Peers improve too — fastest on transparency, as disclosure norms tighten.
const PEER_DELTAS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 1, 0, 1, 2],
  [1, 0, 1, 1, 1, 1, 2, 3],
  [1, 1, 2, 1, 2, 1, 3, 5],
];

const QUARTER_NOTES = [
  "Baseline. The portfolio as we first scored it.",
  "Contract terms renegotiated at renewal; vendor reporting cadence tightened.",
  "Engagement campaign lands. Utilization follows it, roughly a quarter behind.",
  "Vendor stability slips — an acquisition your account team didn't flag. Everything else holds.",
];

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

/** Normal CDF (Abramowitz & Stegun 7.1.26) — used for the percentile readout. */
function normalCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function money(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
}

const TABS = ["Benchmark", "Scenario model", "Optimization", "Assumptions"] as const;
type Tab = (typeof TABS)[number];

/**
 * Categories examined that produced no recommended action. Shown deliberately:
 * the scope of what was checked is a large part of what's being bought, and a
 * findings-only view makes a thorough review look thin.
 */
const ALSO_REVIEWED = [
  "Medical plan design",
  "Network adequacy",
  "Stop-loss terms",
  "Telehealth utilization",
  "Dental & vision",
  "Wellness incentives",
  "Disease management",
  "Maternity & family",
  "Disability & leave",
  "COBRA administration",
  "HSA / FSA design",
  "Voluntary benefits",
  "Eligibility audit",
  "Dependent verification",
  "Claims administration fees",
  "Care navigation",
  "Second opinion services",
  "Employee cost-share",
];

export default function ReportDemo() {
  const [employees, setEmployees] = useState(820);
  const [industry, setIndustry] = useState<IndustryId>("manufacturing");
  const [engagement, setEngagement] = useState(15);
  const [claim, setClaim] = useState(DEFAULT_CLAIM);
  // Four is the count the previous fixed 20% duplication haircut implied.
  const [programs, setPrograms] = useState(4);
  const [tab, setTab] = useState<Tab>("Benchmark");
  // Index into QUARTERS. Defaults to the baseline so the first render is the
  // portfolio as first scored — the movement is something you go and find.
  const [quarter, setQuarter] = useState(0);

  const industryDef =
    INDUSTRIES.find((i) => i.id === industry) ?? INDUSTRIES[0];

  const duplication = duplicationShare(programs);

  const model = useMemo(() => {
    const transfer = industryDef.transfer;
    const dup = duplicationShare(programs);
    // Nothing on this line refers to the claim. That is the point.
    const expected =
      CATEGORY_BASELINE *
      transfer *
      (1 - dup) *
      (1 - SELECTION_BIAS) *
      (engagement / BASELINE_ENGAGEMENT);
    const low = expected * 0.55;
    const high = expected * 1.45;

    // treat low..high as roughly a 90% interval to place the vendor's claim
    const sd = (high - low) / 3.29 || 1;
    const pct = normalCdf((claim - expected) / sd) * 100;

    return {
      transfer,
      expected,
      low,
      high,
      percentile: pct,
      annualLow: low * employees * 12,
      annualExpected: expected * employees * 12,
      annualHigh: high * employees * 12,
    };
  }, [industryDef, engagement, employees, claim, programs]);

  const buildAxes = useCallback(
    (q: number): RadarAxis[] => {
      const deltas = INDUSTRY_DELTAS[industry];
      // larger employers carry more contracting leverage and attract stabler vendors
      const sizeBonus = clamp(Math.round((employees - 800) / 300), -6, 10);
      return BASE_AXES.map((a, i) => {
        let v = a.base + deltas[i] + QUARTER_DELTAS[q][i];
        if (a.label === "CONTRACT TERMS" || a.label === "VENDOR STABILITY") {
          v += sizeBonus;
        }
        return {
          label: a.label,
          value: clamp(v),
          peer: clamp(a.peer + PEER_DELTAS[q][i]),
          hue: a.hue,
        };
      });
    },
    [industry, employees]
  );

  const axes = useMemo(() => buildAxes(quarter), [buildAxes, quarter]);

  const mean = (xs: number[]) =>
    Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);

  const composite = mean(axes.map((a) => a.value));
  const peerComposite = mean(axes.map((a) => a.peer));

  // Movement is only meaningful against where this portfolio started.
  const baseline = useMemo(() => buildAxes(0), [buildAxes]);
  const baselineComposite = mean(baseline.map((a) => a.value));
  const baselinePeer = mean(baseline.map((a) => a.peer));
  const move = composite - baselineComposite;
  const peerMove = peerComposite - baselinePeer;

  const band =
    composite >= 75
      ? { name: "Strong", color: "text-pos", note: "Defend & maintain" }
      : composite >= 60
      ? { name: "Solid", color: "text-teal", note: "Targeted upside" }
      : composite >= 45
      ? { name: "Emerging", color: "text-caution", note: "Clear opportunity" }
      : { name: "Foundation", color: "text-risk", note: "High opportunity" };

  const pctLabel =
    model.percentile > 99
      ? ">99"
      : model.percentile < 1
      ? "<1"
      : Math.round(model.percentile).toString();

  const claimVerdict =
    claim > model.high
      ? {
          text: "Their claim sits above the modeled range. Reaching it would require engagement and population conditions your workforce doesn't currently support.",
          tone: "text-caution",
        }
      : claim > model.expected
      ? {
          text: "Their claim is inside the modeled range, but above the expected case — plausible only if engagement holds at this level.",
          tone: "text-caution",
        }
      : {
          text: "Their claim is at or below the expected case under these assumptions — conservative relative to the model.",
          tone: "text-pos",
        };

  const scaleMax = 200;
  const pos = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;

  const actions = [
    {
      program: "Virtual MSK (SpineWell)",
      status: "Benchmark contract",
      dot: "bg-caution",
      text: "text-caution",
      note: "Vendor claim materially above modeled outcome. Restructure to shared savings gated on verified engagement.",
      lo: model.annualExpected * 0.25,
      hi: model.annualExpected * 0.6,
    },
    {
      program: "Diabetes management",
      status: "Performing",
      dot: "bg-pos",
      text: "text-pos",
      note: "Outcomes consistent with the evidence base and peer set. No action indicated this cycle.",
      lo: 0,
      hi: 0,
    },
    {
      program: "Fertility benefit",
      status: "Requires attention",
      dot: "bg-risk",
      text: "text-risk",
      note: "Narrow utilization breadth against full-population cost. Vendor financial signals also weakening.",
      lo: model.annualExpected * 0.12,
      hi: model.annualExpected * 0.34,
    },
    {
      program: "PBM contract",
      status: "Benchmark contract",
      dot: "bg-caution",
      text: "text-caution",
      note: "Terms trail market on rebate pass-through and specialty definitions. Renegotiation window open.",
      lo: model.annualExpected * 0.3,
      hi: model.annualExpected * 0.85,
    },
    {
      program: "Behavioral health / EAP",
      status: "Monitor",
      dot: "bg-gray-cool",
      text: "text-gray-warm",
      note: "Engagement below peer median but contract economics are sound. Revisit at renewal.",
      lo: 0,
      hi: 0,
    },
  ];

  const totalOpportunity = actions.reduce(
    (acc, a) => ({ lo: acc.lo + a.lo, hi: acc.hi + a.hi }),
    { lo: 0, hi: 0 }
  );

  /*
    The demo's own CTA carries the visitor's configuration into the intake.
    Somebody who has set five controls has already answered most of the form
    and, until now, arrived at it blank.

    Industry is deliberately absent: the four workforce profiles here are a
    different taxonomy from the intake's industry list and are scheduled for
    deletion under Track F, so mapping between them would be a bridge to
    something already marked for demolition.
  */
  const requestHref =
    "/request-report?" +
    new URLSearchParams({
      from: "demo",
      employees: String(employees),
      programs: String(programs),
      claim: String(claim),
      engagement: String(engagement),
    }).toString();

  const assumptions = [
    {
      k: "Vendor claimed savings",
      v: `$${claim} PMPM`,
      src: "Your input",
      you: true,
    },
    {
      k: "Category baseline",
      v: `$${CATEGORY_BASELINE} PMPM`,
      src: "Axionia category model — independent of the claim",
      you: false,
    },
    {
      k: "Evidence transfer rate",
      v: `${Math.round(model.transfer * 100)}%`,
      src: "Axionia population-match model, by industry",
      you: false,
    },
    {
      k: "Double-counted across programs",
      v: `${Math.round(duplication * 100)}%`,
      src: "Axionia attribution model, from your program count",
      you: false,
    },
    {
      k: "Point solutions in place",
      v: programs.toString(),
      src: "Your input",
      you: true,
    },
    {
      k: "Selection-bias haircut",
      v: `${Math.round(SELECTION_BIAS * 100)}%`,
      src: "Axionia attribution framework",
      you: false,
    },
    {
      k: "Assumed engagement rate",
      v: `${engagement}%`,
      src: "Your input",
      you: true,
    },
    {
      k: "Covered subscribers",
      v: employees.toLocaleString("en-US"),
      src: "Your input",
      you: true,
    },
    {
      k: "Industry profile",
      v: industryDef.label,
      src: "Your input",
      you: true,
    },
    // The quarter control moves the benchmark radar and nothing else. Listing
    // it here rather than letting a visitor notice the score changed and
    // wonder what else did.
    {
      k: "Benchmark quarter",
      v: `${QUARTERS[quarter]} — benchmark tab only`,
      src: "Your input",
      you: true,
    },
  ];

  return (
    <div className="border border-border bg-base">
      {/* ── window chrome ── */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-base-2">
        <span className="w-2.5 h-2.5 rounded-full bg-risk/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-caution/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-pos/50" />
        <span className="ml-3 font-mono text-[10px] tracking-[0.1em] text-gray-warm truncate">
          axionia.com / insight / your-company
        </span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-gray-cool hidden sm:block">
          Interactive preview
        </span>
      </div>

      {/* ── configure your own ── */}
      <div className="px-4 sm:px-6 md:px-8 py-6 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-5">
          Set it to your organization
        </div>

        <div className="grid md:grid-cols-2 gap-7">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                Covered subscribers
              </label>
              <span className="font-mono text-[13px] text-navy tabular-nums">
                {employees.toLocaleString("en-US")}
              </span>
            </div>
            {/*
              Ceiling raised from 5,000. The old bound quietly told a large
              employer the product wasn't for them, which was never true — the
              analysis is identical at scale, only the deployment differs.
            */}
            <input
              type="range"
              min={200}
              max={50000}
              step={100}
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
              className="w-full accent-blue cursor-pointer"
              aria-label="Covered subscribers"
            />
            <div className="flex justify-between mt-1 font-mono text-[9px] text-gray-cool">
              <span>200</span>
              <span>50,000</span>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2">
              Workforce profile
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                    industry === ind.id
                      ? "border-navy bg-navy text-base"
                      : "border-border text-gray-warm hover:border-navy"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </div>

          {/*
            The one control nothing else in the category offers. Every other
            tool on the market evaluates one program at a time, so none of them
            can tell you what owning eight does to the arithmetic. The maths is
            the union from DoubleCountedValue.
          */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                Point solutions in place
              </label>
              <span className="font-mono text-[13px] text-navy tabular-nums">
                {programs}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setPrograms(n)}
                  aria-pressed={programs === n}
                  aria-label={`${n} point solution${n === 1 ? "" : "s"} in place`}
                  className={`flex-1 py-2 font-mono text-[11px] tabular-nums border transition-colors ${
                    programs === n
                      ? "border-navy bg-navy text-base"
                      : "border-border text-gray-warm hover:border-navy"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
              {Math.round(duplication * 100)}% of claimed value double-counted
            </p>
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      {/* 2x2 on phones — a horizontal scroller hides the last two tabs
          with no affordance that they exist. */}
      <div className="grid grid-cols-2 sm:flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 sm:px-5 py-3.5 sm:py-4 font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap transition-colors border-b border-r border-border sm:border-0 last:border-r-0 sm:last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r-0 [&:nth-child(n+3)]:border-b-0 ${
              tab === t
                ? "text-navy bg-base-2 sm:bg-transparent"
                : "text-gray-cool hover:text-gray-warm"
            }`}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="reportTabUnderline"
                className="absolute bottom-0 inset-x-0 h-[2px] bg-axionia-gradient"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── panels ── */}
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 min-h-[420px]">
        {tab === "Benchmark" && (
          <div>
            {/* ── the stewardship year ── */}
            <div className="mb-7 pb-6 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
                  Re-scored each quarter
                </div>
                <div className="flex" role="group" aria-label="Engagement quarter">
                  {QUARTERS.map((q, i) => (
                    <button
                      key={q}
                      onClick={() => setQuarter(i)}
                      aria-pressed={quarter === i}
                      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] border -ml-px first:ml-0 transition-colors ${
                        quarter === i
                          ? "border-navy bg-navy text-base relative z-10"
                          : "border-border text-gray-warm hover:border-navy"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-[1.6] text-gray-warm max-w-measure">
                {QUARTER_NOTES[quarter]}
              </p>
            </div>

            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
              <RadarChart
                key={`${industry}-${employees}-${quarter}`}
                axes={axes}
                gradientId="reportRadarFill"
                compact
              />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
                  Composite portfolio score
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-serif font-light text-6xl leading-none tabular-nums">
                    {composite}
                  </span>
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] ${band.color}`}
                  >
                    {band.name}
                  </span>
                  {quarter > 0 && (
                    <span className="font-mono text-[11px] tracking-[0.1em] text-blue tabular-nums">
                      {move >= 0 ? "+" : ""}
                      {move} vs Q1
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                  {band.note}
                </div>

                {/*
                  The point of the whole quarter control: peers move too, so a
                  gain against yourself is not automatically a gain in position.
                */}
                {quarter > 0 && (
                  <div className="mt-4 pl-3 border-l-2 border-blue text-[13px] leading-[1.6] text-gray-warm max-w-measure">
                    Peer median moved {peerMove >= 0 ? "+" : ""}
                    {peerMove} over the same period. You gained{" "}
                    {move - peerMove >= 0 ? "+" : ""}
                    {move - peerMove} in{" "}
                    <em className="italic">relative position</em> — which is the
                    number that decides whether a renewal is defensible.
                  </div>
                )}

                <div className="mt-6">
                  <div className="relative h-1.5 bg-base-2 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-axionia-gradient"
                      animate={{ width: `${composite}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
                    <span>Foundation</span>
                    <span>Emerging</span>
                    <span>Solid</span>
                    <span>Strong</span>
                  </div>
                </div>

                <p className="mt-6 text-[14px] leading-[1.7] text-gray-warm">
                  Eight dimensions scored independently, plotted against the peer
                  median for {industryDef.label.toLowerCase()} employers of
                  comparable size (dashed outline). Your weakest axes are where
                  recoverable dollars usually sit.
                </p>

                <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                  <span className="inline-block w-5 border-t-[1.5px] border-dashed border-slate" />
                  Peer median overlay — moves with the market, not with you
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Scenario model" && (
          <div>
            <div className="grid lg:grid-cols-[1fr_1.25fr] gap-10">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
                  Turn the dial
                </div>

                {/*
                  The visitor's own number, not ours. Everything else on this
                  page changes Axionia's answer; this is the only control that
                  puts their vendor's claim on the table and leaves the model
                  where it is.
                */}
                <label
                  htmlFor="vendor-claim"
                  className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2"
                >
                  What is your vendor telling you it saves?
                </label>
                <div className="flex items-center border border-border focus-within:border-navy transition-colors mb-7">
                  <span className="pl-3 font-mono text-[13px] text-gray-cool">$</span>
                  <input
                    id="vendor-claim"
                    type="number"
                    min={0}
                    max={500}
                    step={5}
                    value={claim}
                    onChange={(e) =>
                      setClaim(clamp(Number(e.target.value) || 0, 0, 500))
                    }
                    className="w-full px-2 py-2.5 bg-transparent font-mono text-[15px] text-navy tabular-nums outline-none"
                  />
                  <span className="pr-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool whitespace-nowrap">
                    PMPM
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                    Assumed engagement rate
                  </label>
                  <span className="font-mono text-[13px] text-navy tabular-nums">
                    {engagement}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={1}
                  value={engagement}
                  onChange={(e) => setEngagement(Number(e.target.value))}
                  className="w-full accent-blue cursor-pointer"
                  aria-label="Assumed engagement rate"
                />
                <div className="flex justify-between mt-1 font-mono text-[9px] text-gray-cool">
                  <span>5%</span>
                  <span>35%</span>
                </div>

                <p className="mt-6 text-[14px] leading-[1.7] text-gray-warm">
                  Engagement is the assumption vendors are least specific about and
                  which moves the answer most. Drag it and watch the vendor&rsquo;s
                  claim move from implausible to reachable — that gap is the
                  negotiation.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border-t border-border pt-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                      Expected PMPM
                    </div>
                    <div className="font-serif text-3xl text-blue tabular-nums">
                      ${model.expected.toFixed(0)}
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                      Annual, expected
                    </div>
                    <div className="font-serif text-3xl tabular-nums">
                      {money(model.annualExpected)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-8">
                  Modeled savings range — $ PMPM
                </div>

                {/* range track */}
                <div className="relative h-2 bg-base-2 rounded-full">
                  <motion.div
                    className="absolute inset-y-0 bg-blue/25 rounded-full"
                    animate={{ left: pos(model.low), right: `${100 - Math.min(100, (model.high / scaleMax) * 100)}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {/* expected marker */}
                  <motion.div
                    className="absolute -top-1.5 w-4 h-4 rounded-full bg-blue border-2 border-base"
                    animate={{ left: `calc(${pos(model.expected)} - 8px)` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {/* vendor claim marker */}
                  <div
                    className="absolute -top-4 h-9 border-l-[1.5px] border-dashed border-caution"
                    style={{ left: pos(claim) }}
                  />
                </div>

                {/* Positioned labels only where there's room — below sm they
                    collide, so fall back to a plain four-up row. */}
                <div className="hidden sm:block relative h-12 mt-3">
                  <motion.div
                    className="absolute font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool"
                    animate={{ left: pos(model.low) }}
                    transition={{ duration: 0.5 }}
                    style={{ transform: "translateX(-50%)" }}
                  >
                    ${model.low.toFixed(0)}
                    <div className="text-gray-cool">low</div>
                  </motion.div>
                  <motion.div
                    className="absolute font-mono text-[9px] uppercase tracking-[0.1em] text-blue"
                    animate={{ left: pos(model.expected) }}
                    transition={{ duration: 0.5 }}
                    style={{ transform: "translateX(-50%)" }}
                  >
                    ${model.expected.toFixed(0)}
                    <div>expected</div>
                  </motion.div>
                  <motion.div
                    className="absolute font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool"
                    animate={{ left: pos(model.high) }}
                    transition={{ duration: 0.5 }}
                    style={{ transform: "translateX(-50%)" }}
                  >
                    ${model.high.toFixed(0)}
                    <div>high</div>
                  </motion.div>
                  <div
                    className="absolute font-mono text-[9px] uppercase tracking-[0.1em] text-caution text-right"
                    style={{ left: pos(claim), transform: "translateX(-50%)" }}
                  >
                    ${claim}
                    <div>claim</div>
                  </div>
                </div>

                <div className="sm:hidden grid grid-cols-4 gap-2 mt-5">
                  {[
                    { v: `$${model.low.toFixed(0)}`, l: "low", c: "text-gray-warm" },
                    { v: `$${model.expected.toFixed(0)}`, l: "expected", c: "text-blue" },
                    { v: `$${model.high.toFixed(0)}`, l: "high", c: "text-gray-warm" },
                    { v: `$${claim}`, l: "claim", c: "text-caution" },
                  ].map((m) => (
                    <div key={m.l} className="border-t border-border pt-2">
                      <div className={`font-mono text-[14px] tabular-nums ${m.c}`}>
                        {m.v}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-gray-cool">
                        {m.l}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-5 bg-amber-light border-l-2 border-caution">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-caution mb-2">
                    Vendor claim — unadjusted
                  </div>
                  <p className="text-[13px] leading-[1.65] text-navy">
                    The ${claim} PMPM claim sits at roughly the{" "}
                    <strong>{pctLabel}th percentile</strong> of modeled outcomes at a{" "}
                    {engagement}% engagement rate.
                  </p>
                  <p className={`mt-2 text-[13px] leading-[1.65] ${claimVerdict.tone}`}>
                    {claimVerdict.text}
                  </p>
                </div>

                <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                  Annual impact — {money(model.annualLow)} to {money(model.annualHigh)}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Optimization" && (
          <div>
            {/* ── headline value: what this is worth ── */}
            <div className="border border-border bg-base-2 p-5 sm:p-6 mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-2">
                Identified opportunity — annual
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-serif font-light text-4xl sm:text-5xl leading-none tabular-nums">
                  {money(totalOpportunity.lo)}
                </span>
                <span className="font-serif font-light text-2xl text-gray-cool">to</span>
                <span className="font-serif font-light text-4xl sm:text-5xl leading-none tabular-nums">
                  {money(totalOpportunity.hi)}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                across {actions.filter((a) => a.hi > 0).length} of{" "}
                {actions.length} programs · {employees.toLocaleString("en-US")}{" "}
                subscribers · {industryDef.label}
              </div>

              {/* contribution bar */}
              <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-base">
                {actions
                  .filter((a) => a.hi > 0)
                  .map((a) => (
                    <motion.div
                      key={`bar-${a.program}`}
                      className={a.dot}
                      animate={{
                        width: `${((a.hi - a.lo) === 0 ? 0 : (a.lo + a.hi) / 2 / ((totalOpportunity.lo + totalOpportunity.hi) / 2)) * 100}%`,
                      }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      title={a.program}
                    />
                  ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {actions
                  .filter((a) => a.hi > 0)
                  .map((a) => (
                    <span
                      key={`key-${a.program}`}
                      className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                      {a.program}
                    </span>
                  ))}
              </div>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
              Prioritized actions
            </div>
            <div className="space-y-px bg-border">
              <div className="hidden md:grid grid-cols-[1.3fr_1fr_2.4fr_1fr] gap-4 bg-base-2 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
                <span>Program</span>
                <span>Action</span>
                <span>Rationale</span>
                <span className="text-right">Annual range</span>
              </div>
              {actions.map((a) => (
                <div
                  key={a.program}
                  className="grid md:grid-cols-[1.3fr_1fr_2.4fr_1fr] gap-2 md:gap-4 bg-base px-4 py-4"
                >
                  <span className="text-[14px] text-navy">{a.program}</span>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] ${a.text}`}
                    >
                      {a.status}
                    </span>
                  </span>
                  <span className="text-[13px] leading-[1.6] text-gray-warm">
                    {a.note}
                  </span>
                  <span className="font-mono text-[12px] text-navy md:text-right tabular-nums">
                    <span className="md:hidden text-gray-cool text-[9px] uppercase tracking-[0.1em] mr-2">
                      Annual
                    </span>
                    {a.hi > 0 ? `${money(a.lo)} – ${money(a.hi)}` : "—"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
              Action labels are deliberately non-prescriptive. Dollar impacts are always
              expressed as ranges — a single figure would imply a precision the
              underlying data doesn&rsquo;t support.
            </p>

            {/* ── breadth: everything else that was examined ── */}
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
                  Also reviewed — no action indicated
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                  {ALSO_REVIEWED.length + actions.length} areas examined in total
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALSO_REVIEWED.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1.5 border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-gray-warm"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
                A finding of &ldquo;nothing to change here&rdquo; is worth as much as a
                finding of savings — it&rsquo;s the part that stops you renegotiating
                something that&rsquo;s already working.
              </p>
            </div>
          </div>
        )}

        {tab === "Assumptions" && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-2">
              Every input behind the numbers
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm max-w-measure mb-7">
              This is the part most analyses don&rsquo;t show you. Each figure above
              traces back to one of these — and each one is yours to question or
              override.
            </p>
            <div className="space-y-px bg-border">
              <div className="hidden md:grid grid-cols-[1.4fr_0.8fr_1.6fr] gap-4 bg-base-2 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
                <span>Assumption</span>
                <span>Value</span>
                <span>Source</span>
              </div>
              {assumptions.map((a) => (
                <div
                  key={a.k}
                  className="grid md:grid-cols-[1.4fr_0.8fr_1.6fr] gap-1 md:gap-4 bg-base px-4 py-3.5"
                >
                  <span className="text-[14px] text-navy">{a.k}</span>
                  <span className="font-mono text-[12px] text-navy tabular-nums">
                    {a.v}
                  </span>
                  <span className="flex items-center gap-2 text-[13px] text-gray-warm">
                    {a.src}
                    {a.you && (
                      <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-blue border border-blue/40 px-1.5 py-0.5">
                        yours
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── conversion ── */}
      <div className="border-t border-border bg-base-2 px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl leading-snug">
              This one is a composite. Yours wouldn&rsquo;t be.
            </h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-gray-warm max-w-measure">
              The free report runs this same analysis on your actual programs and
              workforce — reviewed by a human before it reaches you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <GradientButton href={requestHref}>Get your free report</GradientButton>
            <GhostButton href="/contact">Book a call</GhostButton>
          </div>
        </div>
      </div>

      {/*
        One line, in the manner of DeckFlow. A badge on every panel would make
        the demo read as a roadmap, and a roadmap does not sell anything — but
        nobody should be able to say later that this page presented an
        illustrative model as a measured result.
      */}
      <div className="px-4 sm:px-6 md:px-8 py-4 border-t border-border">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool leading-[1.7]">
          Everything above responds to your inputs, and the arithmetic is the
          arithmetic we use. The category baseline, peer set and program
          benchmarks behind it are illustrative — your report is modeled on your
          own programs and workforce.
        </p>
      </div>
    </div>
  );
}
