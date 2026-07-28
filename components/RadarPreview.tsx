"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";
import RadarChart, { type RadarAxis } from "./RadarChart";

const AXES: RadarAxis[] = [
  { label: "EVIDENCE", value: 74, peer: 61, hue: "#2463EB" },
  { label: "POPULATION FIT", value: 58, peer: 55, hue: "#4AC9DC" },
  { label: "COST EFFICIENCY", value: 66, peer: 58, hue: "#3CBF6C" },
  { label: "UTILIZATION", value: 41, peer: 49, hue: "#3D4E8F" },
  { label: "VENDOR STABILITY", value: 79, peer: 64, hue: "#2E8C9E" },
  { label: "ENGAGEMENT", value: 52, peer: 50, hue: "#5B7095" },
  { label: "CONTRACT TERMS", value: 47, peer: 54, hue: "#7FA86B" },
  { label: "TRANSPARENCY", value: 63, peer: 44, hue: "#9C6B1A" },
];

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
          (dashed). The two lowest axes — utilization breadth and contract terms — are
          where the portfolio trails comparable employers, and where the recoverable
          dollars usually sit.
        </p>

        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
          <span className="inline-block w-5 border-t-[1.5px] border-dashed border-slate" />
          Peer median overlay
        </div>
      </div>
    </div>
  );
}
