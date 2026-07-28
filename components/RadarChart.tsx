"use client";

import { motion } from "framer-motion";

export type RadarAxis = {
  label: string;
  value: number;
  peer: number;
  hue: string;
};

const RINGS = [0.25, 0.5, 0.75, 1];

/**
 * Signature 8-axis radar, built to the brand dataviz spec:
 * hairline stone rings, blue/teal gradient fill at low opacity, 2px blue
 * stroke with vertex dots, DM Mono axis labels, dashed slate peer overlay
 * sitting behind the company shape.
 *
 * Presentational only — pass `axes`. Change the React `key` to replay the
 * entrance animation (used when the report config changes).
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
  const CX = 170;
  const CY = 140;
  const MAX_R = compact ? 84 : 92;
  const LABEL_R = compact ? 102 : 110;

  const pointAt = (index: number, value: number) => {
    const angle = (-90 + index * (360 / axes.length)) * (Math.PI / 180);
    const r = (value / 100) * MAX_R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const polygonFor = (key: "value" | "peer") =>
    axes
      .map((a, i) => {
        const p = pointAt(i, a[key]);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg viewBox="0 0 340 300" className="w-full h-auto">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4AC9DC" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#2463EB" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* concentric hairline rings */}
      {RINGS.map((ring, i) => (
        <motion.polygon
          key={`ring-${ring}`}
          points={axes
            .map((_, idx) => {
              const p = pointAt(idx, ring * 100);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="#DDD9D0"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.05 * i }}
        />
      ))}

      {/* spokes */}
      {axes.map((a, i) => {
        const p = pointAt(i, 100);
        return (
          <motion.line
            key={`spoke-${a.label}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="#DDD9D0"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.03 }}
          />
        );
      })}

      {/* peer benchmark overlay — dashed, behind company shape */}
      {showPeer && (
        <motion.polygon
          points={polygonFor("peer")}
          fill="none"
          stroke="#5B7095"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.75 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.5 }}
        />
      )}

      {/* company shape — fill */}
      <motion.polygon
        points={polygonFor("value")}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.9, delay: 0.85 }}
      />

      {/* company shape — stroke draws in */}
      <motion.polygon
        points={polygonFor("value")}
        fill="none"
        stroke="#2463EB"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          pathLength: { duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.55 },
          opacity: { duration: 0.2, delay: 0.55 },
        }}
      />

      {/* vertex dots */}
      {axes.map((a, i) => {
        const p = pointAt(i, a.value);
        return (
          <motion.circle
            key={`dot-${a.label}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#2463EB"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: 1.0 + i * 0.05 }}
          />
        );
      })}

      <circle cx={CX} cy={CY} r="2" fill="#1C2431" />

      {/* axis labels with categorical hue dot */}
      {axes.map((a, i) => {
        const angle = (-90 + i * (360 / axes.length)) * (Math.PI / 180);
        const x = CX + LABEL_R * Math.cos(angle);
        const y = CY + LABEL_R * Math.sin(angle);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
        const dy = sin > 0.3 ? 10 : sin < -0.3 ? -4 : 3;
        const dotX = anchor === "start" ? x - 7 : anchor === "end" ? x + 7 : x;
        const dotY = y + dy - 3;

        return (
          <motion.g
            key={`label-${a.label}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 1.1 + i * 0.05 }}
          >
            <circle cx={dotX} cy={dotY} r="2" fill={a.hue} />
            <text
              x={x}
              y={y + dy}
              textAnchor={anchor}
              fontFamily="'DM Mono', ui-monospace, monospace"
              fontSize="8"
              letterSpacing="0.08em"
              fill="#706C63"
            >
              {a.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
