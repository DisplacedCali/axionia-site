"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import RadarChart, { type RadarAxis } from "./RadarChart";
import { GradientButton, GhostButton } from "./ui";

/* ────────────────────────── model ──────────────────────────
   Deliberately simple and fully exposed — every constant below
   is surfaced to the visitor in the Assumptions tab. The default
   configuration reproduces the Meridian MSK case used elsewhere
   on the site ($54 PMPM expected against a $180 PMPM claim).
   ─────────────────────────────────────────────────────────── */

const VENDOR_CLAIM = 180; // $ PMPM, as published by the vendor
const OVERLAP = 0.2; // share duplicated by programs already in place
const SELECTION_BIAS = 0.35; // haircut for study-population selection effects
const BASELINE_ENGAGEMENT = 15; // engagement rate in the vendor's own study

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

export default function ReportDemo() {
  const [employees, setEmployees] = useState(820);
  const [industry, setIndustry] = useState<IndustryId>("manufacturing");
  const [engagement, setEngagement] = useState(15);
  const [tab, setTab] = useState<Tab>("Benchmark");

  const industryDef =
    INDUSTRIES.find((i) => i.id === industry) ?? INDUSTRIES[0];

  const model = useMemo(() => {
    const transfer = industryDef.transfer;
    const expected =
      VENDOR_CLAIM *
      transfer *
      (1 - OVERLAP) *
      (1 - SELECTION_BIAS) *
      (engagement / BASELINE_ENGAGEMENT);
    const low = expected * 0.55;
    const high = expected * 1.45;

    // treat low..high as roughly a 90% interval to place the vendor's claim
    const sd = (high - low) / 3.29 || 1;
    const pct = normalCdf((VENDOR_CLAIM - expected) / sd) * 100;

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
  }, [industryDef, engagement, employees]);

  const axes: RadarAxis[] = useMemo(() => {
    const deltas = INDUSTRY_DELTAS[industry];
    // larger employers carry more contracting leverage and attract stabler vendors
    const sizeBonus = clamp(Math.round((employees - 800) / 300), -6, 10);
    return BASE_AXES.map((a, i) => {
      let v = a.base + deltas[i];
      if (a.label === "CONTRACT TERMS" || a.label === "VENDOR STABILITY") {
        v += sizeBonus;
      }
      return { label: a.label, value: clamp(v), peer: a.peer, hue: a.hue };
    });
  }, [industry, employees]);

  const composite = Math.round(
    axes.reduce((s, a) => s + a.value, 0) / axes.length
  );

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
    VENDOR_CLAIM > model.high
      ? {
          text: "Their claim sits above the modeled range. Reaching it would require engagement and population conditions your workforce doesn't currently support.",
          tone: "text-caution",
        }
      : VENDOR_CLAIM > model.expected
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

  const assumptions = [
    {
      k: "Vendor claimed savings",
      v: `$${VENDOR_CLAIM} PMPM`,
      src: "Vendor outcomes study, as published",
      you: false,
    },
    {
      k: "Evidence transfer rate",
      v: `${Math.round(model.transfer * 100)}%`,
      src: "Axionia population-match model, by industry",
      you: false,
    },
    {
      k: "Overlap with existing programs",
      v: `${Math.round(OVERLAP * 100)}%`,
      src: "Client program inventory",
      you: false,
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
      <div className="px-6 md:px-8 py-6 border-b border-border">
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
            <input
              type="range"
              min={200}
              max={5000}
              step={20}
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
              className="w-full accent-blue cursor-pointer"
              aria-label="Covered subscribers"
            />
            <div className="flex justify-between mt-1 font-mono text-[9px] text-gray-cool">
              <span>200</span>
              <span>5,000</span>
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
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
              tab === t ? "text-navy" : "text-gray-cool hover:text-gray-warm"
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
      <div className="px-6 md:px-8 py-8 min-h-[440px]">
        {tab === "Benchmark" && (
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <RadarChart
              key={`${industry}-${employees}`}
              axes={axes}
              gradientId="reportRadarFill"
              compact
            />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
                Composite portfolio score
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-serif font-light text-6xl leading-none tabular-nums">
                  {composite}
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.14em] ${band.color}`}
                >
                  {band.name}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                {band.note}
              </div>

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
                Eight dimensions scored independently, plotted against the peer median
                for {industryDef.label.toLowerCase()} employers of comparable size
                (dashed outline). Your weakest axes are where recoverable dollars
                usually sit.
              </p>

              <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                <span className="inline-block w-5 border-t-[1.5px] border-dashed border-slate" />
                Peer median overlay
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
                    style={{ left: pos(VENDOR_CLAIM) }}
                  />
                </div>

                <div className="relative h-12 mt-3">
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
                    style={{ left: pos(VENDOR_CLAIM), transform: "translateX(-50%)" }}
                  >
                    ${VENDOR_CLAIM}
                    <div>claim</div>
                  </div>
                </div>

                <div className="mt-6 p-5 bg-amber-light border-l-2 border-caution">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-caution mb-2">
                    Vendor claim — unadjusted
                  </div>
                  <p className="text-[13px] leading-[1.65] text-navy">
                    The ${VENDOR_CLAIM} PMPM claim sits at roughly the{" "}
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
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-6">
              Prioritized actions — {employees.toLocaleString("en-US")} subscribers,{" "}
              {industryDef.label}
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
      <div className="border-t border-border bg-base-2 px-6 md:px-8 py-8">
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
            <GradientButton href="/request-report">Get your free report</GradientButton>
            <GhostButton href="/contact">Book a call</GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}
