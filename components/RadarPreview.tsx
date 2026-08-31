"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";
import RadarChart, { type RadarAxis } from "./RadarChart";
import { AXES as PIPELINE_AXES } from "@/lib/modules/research/data/axes";
import { CATEGORICAL } from "@/lib/modules/research/data/tokens";

/**
 * The home page radar now shows the axes the product actually produces.
 *
 * Until 2026-08-31 this component carried its own eight — Evidence, Population
 * Fit, Cost Efficiency, Utilization, Vendor Stability, Engagement, Contract
 * Terms, Transparency — which appear nowhere in the pipeline. Somebody who saw
 * this chart and requested the free report received a different chart with
 * eight different labels. The headline above it promises "your portfolio,
 * scored on eight dimensions", and seven of those eight did not exist.
 *
 * Derived from `data/axes.ts` rather than transcribed, so it cannot drift
 * again. That file is the single source for keys, labels, weights and colour,
 * and it already documents why the eighth slot is Sky rather than amber: the
 * report surface uses amber semantically for vendor watch-outs, and a
 * categorical amber axis beside a semantic amber warning reads as meaning
 * something it doesn't. The hardcoded list this replaces used #9C6B1A for its
 * eighth axis — the reserved caution colour — so aligning the labels fixes a
 * brand violation that had been sitting under them.
 *
 * The VALUES stay illustrative and the copy says so. What was wrong was the
 * axis set, not the fact that a marketing page shows an example shape.
 */
const SCORES: Record<string, { value: number; peer: number }> = {
  spendEfficiency: { value: 66, peer: 58 },
  vendorIndependence: { value: 41, peer: 49 },
  analyticsReadiness: { value: 63, peer: 44 },
  cfoEngagement: { value: 47, peer: 54 },
  workforceAlignment: { value: 58, peer: 55 },
  decisionMaturity: { value: 52, peer: 50 },
  regulatoryReadiness: { value: 74, peer: 61 },
  appreciationValue: { value: 79, peer: 64 },
};

const AXES: RadarAxis[] = PIPELINE_AXES.map((a) => ({
  label: a.shortLabel.toUpperCase(),
  value: SCORES[a.key].value,
  peer: SCORES[a.key].peer,
  hue: CATEGORICAL[a.colorToken as keyof typeof CATEGORICAL] ?? CATEGORICAL.blue,
}));

export default function RadarPreview() {
  const composite = Math.round(
    AXES.reduce((sum, a) => sum + a.value, 0) / AXES.length
  );

  return (
    <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
      <RadarChart axes={AXES} gradientId="radarPreviewFill" />

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
          Composite portfolio score
        </div>

        <div className="flex items-baseline gap-3">
          <span className="font-serif font-light text-6xl md:text-7xl leading-none">
            <CountUp to={composite} duration={2} />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-teal">
            Solid
          </span>
        </div>

        <div className="mt-6">
          <div className="relative h-1.5 bg-base-2 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-axionia-gradient"
              initial={{ width: 0 }}
              whileInView={{ width: `${composite}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
            <span>Foundation</span>
            <span>Emerging</span>
            <span>Solid</span>
            <span>Strong</span>
          </div>
        </div>

        <p className="mt-7 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
          Eight dimensions, scored independently and plotted against the peer median
          (dashed). The two lowest axes — vendor independence and CFO engagement —
          are where this portfolio trails comparable employers, and they are the two
          that most often move together.
        </p>

        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
          <span className="inline-block w-5 border-t-[1.5px] border-dashed border-slate" />
          Peer median overlay
        </div>
      </div>
    </div>
  );
}
