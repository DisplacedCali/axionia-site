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

const W = 860;
const H = 460;
// Right padding is a LABEL COLUMN, not margin — the highlighted picks are
// named there rather than beside their dots, which is what stopped them
// overflowing the frame and colliding with each other.
const PAD = { t: 34, r: 210, b: 56, l: 64 };

/*
  Compact gets its own CANVAS, not the same canvas with bigger text.

  The first attempt kept viewBox 860x460 and scaled the quadrant labels from
  9px to 13px. That made it worse: the thumbnail renders into roughly a
  350px-wide grid cell, so everything is scaled by ~0.4 and 13px arrived on the
  page at about 5px — smaller than the 9px it replaced. In an SVG the viewBox
  is the unit of measurement, so the fix is a smaller box, not larger type
  inside a big one.
*/
const CW = 420;
const CH = 300;
const CPAD = { t: 16, r: 16, b: 16, l: 16 };

export default function MixMap({
  points,
  compact = false,
}: {
  points: MixPoint[];
  /**
   * Thumbnail for the cover page. Same geometry, no label column, no legend,
   * no axis text — at that size the shape is the message and everything else
   * is noise the reader will meet properly two pages later.
   */
  compact?: boolean;
}) {
  if (!points.length) return null;

  // Compact swaps the whole canvas — see the note above.
  const w = compact ? CW : W;
  const h = compact ? CH : H;
  const pad = compact ? CPAD : PAD;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  /*
    INSET the scale. A 1–5 axis mapped edge to edge puts every 5 exactly on the
    boundary — and since almost every benefit in a segment's list scores 4 or 5
    on perceived value, the top row sat ON the frame and the jitter pushed it
    outside. The first render leaked a dozen dots above the plot.

    The inset costs a little dynamic range and buys points that are always
    inside the box they belong to.
  */
  const INSET = compact ? 14 : 26;
  const x = (leverage: number) =>
    pad.l + INSET + ((5 - leverage) / 4) * (iw - INSET * 2);
  const y = (perceived: number) =>
    pad.t + INSET + ((5 - perceived) / 4) * (ih - INSET * 2);

  const midX = pad.l + iw / 2;
  const midY = pad.t + ih / 2;

  const edge = compact ? 4 : 6;
  const clampX = (v: number) => Math.min(pad.l + iw - edge, Math.max(pad.l + edge, v));
  const clampY = (v: number) => Math.min(pad.t + ih - edge, Math.max(pad.t + edge, v));

  // Jitter identical coordinates apart deterministically — a 1–5 grid collides
  // constantly, and overlapping dots read as one benefit rather than six.
  // Clamped, because a spiral near an edge would otherwise walk straight off it.
  const seen = new Map<string, number>();
  const placed = points.map((p) => {
    const key = `${p.employerLeverage}:${p.perceived}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    const angle = n * 2.4;
    const r = n === 0 ? 0 : 7 + n * 3.5;
    return {
      ...p,
      cx: clampX(x(p.employerLeverage) + Math.cos(angle) * r),
      cy: clampY(y(p.perceived) + Math.sin(angle) * r),
    };
  });

  /*
    Labels only on the highlighted three, and stacked rather than placed at
    their dots.

    Anchoring each label to its own point produced the two failures in the
    first render: labels ran off the right edge, and the highlighted points
    cluster (that is the finding) so their labels overlapped each other. A
    leader line to a stacked list is legible at any density and cannot
    overflow, because the list is laid out rather than positioned.
  */
  const labelled = placed.filter((p) => p.highlighted);
  const labelX = pad.l + iw + 10;
  // Same on-page size in both, because the viewBox now differs rather than the type.
  const q = compact ? 8 : 9;
  const dot = compact ? 3 : 4.5;
  const dotHi = compact ? 5 : 7;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        role="img"
        aria-label="Benefits plotted by employer cost against the value employees attribute to them"
      >
        <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="#F0EDE6" />

        {/* quadrant dividers */}
        <line x1={midX} y1={pad.t} x2={midX} y2={pad.t + ih} stroke="#DDD9D0" strokeWidth="1" />
        <line x1={pad.l} y1={midY} x2={pad.l + iw} y2={midY} stroke="#DDD9D0" strokeWidth="1" />

        {/* quadrant labels — set quietly; they orient, they don't decorate */}
        <text x={pad.l + 12} y={pad.t + 20} className="mm-q" fill="#1E5B38">
          CHEAP · VALUED
        </text>
        <text x={pad.l + iw - 12} y={pad.t + 20} textAnchor="end" className="mm-q" fill="#5C3F10">
          COSTLY · VALUED
        </text>
        <text x={pad.l + 12} y={pad.t + ih - 10} className="mm-q" fill="#706C63">
          CHEAP · UNNOTICED
        </text>
        <text x={pad.l + iw - 12} y={pad.t + ih - 10} textAnchor="end" className="mm-q" fill="#7A1F18">
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
                r={p.highlighted ? dotHi : dot}
                fill={fill}
                fillOpacity={p.highlighted ? 1 : stakes ? 0.5 : 0.75}
                stroke={p.highlighted ? "#1C2431" : "none"}
                strokeWidth={p.highlighted ? 1.5 : 0}
              />

            </g>
          );
        })}

        {/* leader lines to a stacked list — see the note above */}
        {!compact && labelled.map((p, i) => {
          const ly = pad.t + 18 + i * 20;
          return (
            <g key={`lab-${p.benefit}`}>
              <path
                d={`M ${p.cx + 8} ${p.cy} L ${labelX - 8} ${ly - 4}`}
                stroke="#AEB4BC"
                strokeWidth="0.75"
                fill="none"
              />
              <text x={labelX} y={ly} className="mm-l" fill="#1C2431">
                {p.benefit.length > 26 ? p.benefit.slice(0, 24) + "…" : p.benefit}
              </text>
            </g>
          );
        })}

        {/* axes */}
        {!compact && (
          <>
            <text x={pad.l + iw / 2} y={h - 18} textAnchor="middle" className="mm-a">
              COST TO THE EMPLOYER →
            </text>
            <text
              x={-(pad.t + ih / 2)}
              y={18}
              textAnchor="middle"
              transform="rotate(-90)"
              className="mm-a"
            >
              VALUE EMPLOYEES ATTRIBUTE →
            </text>
          </>
        )}

        <style>{`
          .mm-q { font-family: 'DM Mono', ui-monospace, monospace; font-size: ${q}px; letter-spacing: 0.12em; }
          .mm-l { font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; }
          .mm-a { font-family: 'DM Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.14em; fill: #706C63; }
        `}</style>
      </svg>

      {!compact && (
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

      )}

      {!compact && (
      <p className="mt-3 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Positions come from our library&rsquo;s scoring of each benefit, not from
        your spend — we don&rsquo;t know your costs yet. Read it as where these
        options sit in general, and the gap between that and your own portfolio
        as the thing worth an hour.
      </p>
      )}
    </figure>
  );
}
