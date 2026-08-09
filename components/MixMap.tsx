import type { MixPoint } from "@/lib/modules/research/pipeline/types";

/**
 * Employer cost against employee-attributed value.
 *
 * ── Why this exists ──
 *
 * The four library scores measure VALUE, not novelty. A suggestion list built
 * on them alone recommended a 401(k) to an investment firm, because table
 * stakes score high on perceived and retention precisely because they're table
 * stakes. Position fixes that structurally rather than by filtering: the
 * obvious things cluster, and a cluster reads as a cluster.
 *
 * The quadrant worth the most and previously said nowhere is bottom-left —
 * costly and unnoticed. "You're paying for this and your people don't feel it"
 * is a sharper sentence than any recommendation.
 *
 * Plain SVG, no chart library: it has to survive `@media print` into a PDF, and
 * every charting library's answer to printing is a canvas that rasterises badly.
 *
 * Axis note — HIGH employer leverage means LOW relative cost, so the X axis
 * runs cheap-to-costly LEFT to RIGHT by inverting it. Labelling it "leverage"
 * and drawing it as cost would be the kind of quiet inversion that makes a
 * reader distrust everything else on the page.
 */

const W = 680;
const H = 460;
const PAD = { t: 34, r: 28, b: 56, l: 64 };

export default function MixMap({ points }: { points: MixPoint[] }) {
  if (!points.length) return null;

  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  // 1–5 → pixels. X inverted: leverage 5 (cheapest) sits left.
  const x = (leverage: number) => PAD.l + ((5 - leverage) / 4) * iw;
  const y = (perceived: number) => PAD.t + ((5 - perceived) / 4) * ih;

  const midX = PAD.l + iw / 2;
  const midY = PAD.t + ih / 2;

  // Jitter identical coordinates apart deterministically — a 1–5 grid collides
  // constantly, and overlapping dots read as one benefit rather than six.
  const seen = new Map<string, number>();
  const placed = points.map((p) => {
    const key = `${p.employerLeverage}:${p.perceived}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    const angle = n * 2.4;
    const r = n === 0 ? 0 : 7 + n * 3.5;
    return { ...p, cx: x(p.employerLeverage) + Math.cos(angle) * r, cy: y(p.perceived) + Math.sin(angle) * r };
  });

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Benefits plotted by employer cost against the value employees attribute to them"
      >
        <rect x={PAD.l} y={PAD.t} width={iw} height={ih} fill="#F0EDE6" />

        {/* quadrant dividers */}
        <line x1={midX} y1={PAD.t} x2={midX} y2={PAD.t + ih} stroke="#DDD9D0" strokeWidth="1" />
        <line x1={PAD.l} y1={midY} x2={PAD.l + iw} y2={midY} stroke="#DDD9D0" strokeWidth="1" />

        {/* quadrant labels — set quietly; they orient, they don't decorate */}
        <text x={PAD.l + 12} y={PAD.t + 20} className="mm-q" fill="#1E5B38">
          CHEAP · VALUED
        </text>
        <text x={PAD.l + iw - 12} y={PAD.t + 20} textAnchor="end" className="mm-q" fill="#5C3F10">
          COSTLY · VALUED
        </text>
        <text x={PAD.l + 12} y={PAD.t + ih - 10} className="mm-q" fill="#706C63">
          CHEAP · UNNOTICED
        </text>
        <text x={PAD.l + iw - 12} y={PAD.t + ih - 10} textAnchor="end" className="mm-q" fill="#7A1F18">
          COSTLY · UNNOTICED
        </text>

        {/* points */}
        {placed.map((p) => {
          const stakes = p.commonality === "table-stakes";
          const fill = p.highlighted
            ? "#2463EB"
            : stakes
              ? "#AEB4BC"
              : p.commonality === "rare"
                ? "#4AC9DC"
                : "#5B7095";
          return (
            <g key={p.benefit}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={p.highlighted ? 7 : 4.5}
                fill={fill}
                fillOpacity={p.highlighted ? 1 : stakes ? 0.5 : 0.75}
                stroke={p.highlighted ? "#1C2431" : "none"}
                strokeWidth={p.highlighted ? 1.5 : 0}
              />
              {p.highlighted && (
                <text
                  x={p.cx + 11}
                  y={p.cy + 4}
                  className="mm-l"
                  fill="#1C2431"
                >
                  {p.benefit.length > 34 ? p.benefit.slice(0, 32) + "…" : p.benefit}
                </text>
              )}
            </g>
          );
        })}

        {/* axes */}
        <text x={PAD.l + iw / 2} y={H - 18} textAnchor="middle" className="mm-a">
          COST TO THE EMPLOYER →
        </text>
        <text
          x={-(PAD.t + ih / 2)}
          y={18}
          textAnchor="middle"
          transform="rotate(-90)"
          className="mm-a"
        >
          VALUE EMPLOYEES ATTRIBUTE →
        </text>

        <style>{`
          .mm-q { font-family: 'DM Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.12em; }
          .mm-l { font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; }
          .mm-a { font-family: 'DM Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.14em; fill: #706C63; }
        `}</style>
      </svg>

      <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {[
          ["#2463EB", "Worth a conversation"],
          ["#4AC9DC", "Rarely offered"],
          ["#5B7095", "A differentiator"],
          ["#AEB4BC", "Table stakes — everyone has it"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm">
              {l}
            </span>
          </span>
        ))}
      </figcaption>

      <p className="mt-3 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Positions come from our library&rsquo;s scoring of each benefit, not from
        your spend — we don&rsquo;t know your costs yet. Read it as where these
        options sit in general, and the gap between that and your own portfolio
        as the thing worth an hour.
      </p>
    </figure>
  );
}
