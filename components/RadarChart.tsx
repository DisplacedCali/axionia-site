"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export type RadarAxis = {
  label: string;
  value: number;
  peer: number;
  hue: string;
};

const RINGS = [0.25, 0.5, 0.75, 1];

// Wider than the plot area on purpose: axis labels anchor outward from the
// outer ring, and a tight viewBox clips them.
const VB_W = 400;
const VB_H = 320;
const CX = 200;
const CY = 150;

/**
 * Signature 8-axis radar, per the brand dataviz spec.
 *
 * Two correctness notes, both learned the hard way:
 *
 * 1. Shapes are <path>, not <polygon>. Framer Motion animates `pathLength`
 *    via getTotalLength(), which Safari implements only on SVGPathElement —
 *    on <polygon> the stroke silently never draws, so the chart was blank on
 *    iOS while fine in Chrome.
 *
 * 2. Animation is ADDITIVE. The chart renders fully visible by default and
 *    animation is an enhancement layered on top. Previously every element
 *    started at opacity 0 and depended on whileInView firing, which meant any
 *    failure in the animation layer produced an invisible chart rather than a
 *    static one. Also respects prefers-reduced-motion.
 */
export default function RadarChart({
  axes,
  gradientId = "radarFill",
  showPeer = true,
  compact = false,
}: {
  axes: RadarAxis[];
  gradientId?: string;
  showPeer?: boolean;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  // Safety net: if the observer never fires for any reason, reveal anyway.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const animate = !reduceMotion;
  const show = inView || fallback || !animate;

  const MAX_R = compact ? 88 : 96;
  const LABEL_R = compact ? 104 : 112;

  const pointAt = (index: number, value: number) => {
    const angle = (-90 + index * (360 / axes.length)) * (Math.PI / 180);
    const r = (value / 100) * MAX_R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  /** Closed <path> data — universally supported by getTotalLength(). */
  const pathFor = (key: "value" | "peer") =>
    axes
      .map((a, i) => {
        const p = pointAt(i, a[key]);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const ringPath = (ring: number) =>
    axes
      .map((_, i) => {
        const p = pointAt(i, ring * 100);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  return (
    <div ref={containerRef}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Portfolio score across eight dimensions, plotted against the peer median"
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4AC9DC" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#2463EB" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        {/* rings — static, always visible */}
        {RINGS.map((ring) => (
          <path
            key={`ring-${ring}`}
            d={ringPath(ring)}
            fill="none"
            stroke="#DDD9D0"
            strokeWidth="1"
          />
        ))}

        {/* spokes — static */}
        {axes.map((a, i) => {
          const p = pointAt(i, 100);
          return (
            <line
              key={`spoke-${a.label}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="#DDD9D0"
              strokeWidth="1"
            />
          );
        })}

        {/* peer benchmark — dashed, behind the company shape */}
        {showPeer && (
          <path
            d={pathFor("peer")}
            fill="none"
            stroke="#5B7095"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.75"
          />
        )}

        {/* company shape — fill */}
        <motion.path
          d={pathFor("value")}
          fill={`url(#${gradientId})`}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* company shape — stroke. Drawn as a path so Safari can measure it. */}
        <motion.path
          d={pathFor("value")}
          fill="none"
          stroke="#2463EB"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: show ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* vertex dots */}
        {axes.map((a, i) => {
          const p = pointAt(i, a.value);
          return (
            <motion.circle
              key={`dot-${a.label}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#2463EB"
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: show ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
            />
          );
        })}

        <circle cx={CX} cy={CY} r="2" fill="#1C2431" />

        {/* axis labels — suppressed on phones, where they'd render ~6px */}
        <g className="hidden sm:block">
          {axes.map((a, i) => {
            const angle = (-90 + i * (360 / axes.length)) * (Math.PI / 180);
            const x = CX + LABEL_R * Math.cos(angle);
            const y = CY + LABEL_R * Math.sin(angle);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
            const dy = sin > 0.3 ? 11 : sin < -0.3 ? -5 : 3;
            const dotX = anchor === "start" ? x - 7 : anchor === "end" ? x + 7 : x;
            const dotY = y + dy - 3;

            return (
              <g key={`label-${a.label}`}>
                <circle cx={dotX} cy={dotY} r="2" fill={a.hue} />
                <text
                  x={x}
                  y={y + dy}
                  textAnchor={anchor}
                  fontFamily="'DM Mono', ui-monospace, monospace"
                  fontSize="9"
                  letterSpacing="0.06em"
                  fill="#706C63"
                >
                  {a.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* mobile legend — carries the numbers the labels can't at this scale */}
      <div className="sm:hidden mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {axes.map((a) => (
          <div key={`legend-${a.label}`} className="flex items-baseline gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px]"
              style={{ backgroundColor: a.hue }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-gray-warm leading-tight flex-1 min-w-0">
              {a.label}
            </span>
            <span className="font-mono text-[11px] text-navy tabular-nums shrink-0">
              {a.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
