"use client";

import { useState } from "react";
import { GhostButton } from "@/components/ui";

type Tone = "caution" | "neutral" | "blue" | "pos";

const toneClasses: Record<Tone, { bg: string; text: string; label: string }> = {
  caution: { bg: "bg-amber-light", text: "text-caution", label: "Vendor claim" },
  neutral: { bg: "bg-base-2", text: "text-navy", label: "Independent review" },
  blue: { bg: "bg-blue-light", text: "text-blue", label: "Expected case" },
  pos: { bg: "bg-green-light", text: "text-pos", label: "Recommendation" },
};

const steps: {
  num: string;
  title: string;
  tone: Tone;
  body: string;
  bullets?: string[];
}[] = [
  {
    num: "01",
    title: "The vendor claim",
    tone: "caution",
    body: "Meridian Manufacturing — 820 employees, light manufacturing, Midwest. Their broker recommends SpineWell's virtual MSK program, claiming $180 PMPM in savings.",
  },
  {
    num: "02",
    title: "What Axionia found",
    tone: "neutral",
    body: "The Research Agent reviews the vendor's study population and Meridian's actual claims and workforce data — independently, before anyone signs anything.",
    bullets: [
      "35–40% of the claimed savings reflects selection bias in SpineWell's study population",
      "A further 20% overlaps with PBM and care-management programs Meridian already runs",
      "Only 58% of SpineWell's published outcomes are estimated to transfer to Meridian's actual workforce",
      "Neither adjustment was disclosed in the vendor's materials",
    ],
  },
  {
    num: "03",
    title: "Where it actually lands",
    tone: "blue",
    body: "Scenario modeling shows the range, not a single number — and where the vendor's claim falls within it.",
  },
  {
    num: "04",
    title: "The recommendation",
    tone: "pos",
    body: "Structure the SpineWell contract with a base fee tied to enrollment and a shared-savings component unlocked at verified 15%+ engagement — aligning the vendor's incentive with Meridian's actual outcomes, not its claimed ones.",
  },
];

function RangeChart() {
  // Scale: 0–$200 PMPM
  const scaleMax = 200;
  const marks = [
    { value: 54, label: "Axionia expected", sub: "58th percentile vs. peers", tone: "blue" as const },
    { value: 78, label: "Peer top quartile", sub: "engagement-driven upside", tone: "cool" as const },
    { value: 180, label: "Vendor claimed", sub: "97th percentile — 3% of scenarios reach this", tone: "caution" as const },
  ];

  const dotClass: Record<string, string> = {
    blue: "bg-blue border-blue",
    cool: "bg-base border-gray-cool",
    caution: "bg-caution border-caution",
  };
  const textClass: Record<string, string> = {
    blue: "text-blue",
    cool: "text-gray-warm",
    caution: "text-caution",
  };

  return (
    <div className="mt-2">
      <div className="relative h-2 rounded-full bg-base-2">
        <div className="absolute inset-y-0 left-0 bg-axionia-gradient rounded-full" style={{ width: "45%" }} />
        {marks.map((m) => (
          <div
            key={m.label}
            className={`absolute -top-1.5 w-4 h-4 rounded-full border-2 ${dotClass[m.tone]}`}
            style={{ left: `calc(${(m.value / scaleMax) * 100}% - 8px)` }}
            title={`${m.label}: $${m.value} PMPM`}
          />
        ))}
      </div>
      <div className="mt-6 grid sm:grid-cols-3 gap-6">
        {marks.map((m) => (
          <div key={m.label}>
            <div className={`font-mono text-[11px] uppercase tracking-[0.1em] ${textClass[m.tone]}`}>
              {m.label}
            </div>
            <div className="font-serif text-2xl mt-1">${m.value} <span className="text-sm text-gray-warm">PMPM</span></div>
            <div className="text-[12px] text-gray-warm mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkflowDemo() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  const tone = toneClasses[step.tone];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {steps.map((s, i) => (
          <button
            key={s.num}
            onClick={() => setActive(i)}
            className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] border transition-colors ${
              i === active
                ? "border-navy bg-navy text-base"
                : "border-border text-gray-warm hover:border-navy"
            }`}
          >
            {s.num} {s.title}
          </button>
        ))}
      </div>

      <div className="border border-border p-8 md:p-10">
        <span
          className={`inline-block mb-4 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${tone.bg} ${tone.text}`}
        >
          {tone.label}
        </span>
        <h3 className="font-serif text-2xl md:text-3xl leading-tight mb-4">{step.title}</h3>
        <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">{step.body}</p>

        {step.bullets && (
          <ul className="mt-6 space-y-3">
            {step.bullets.map((b) => (
              <li key={b} className="text-[14px] leading-[1.6] text-gray-warm pl-4 border-l-2 border-border">
                {b}
              </li>
            ))}
          </ul>
        )}

        {step.num === "03" && <RangeChart />}

        <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => setActive((a) => Math.min(a + 1, steps.length - 1))}
            disabled={active === steps.length - 1}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-navy hover:opacity-70 disabled:opacity-30 disabled:cursor-default"
          >
            {active === steps.length - 1 ? "End of walkthrough" : "Next step →"}
          </button>
          {active === steps.length - 1 && (
            <GhostButton href="/contact?interest=research-agent">
              Get a report like this
            </GhostButton>
          )}
        </div>
      </div>

      <p className="mt-4 text-[12px] text-gray-cool">
        Illustrative example built from a composite employer profile — not a real client engagement.
      </p>
    </div>
  );
}
