/**
 * The pipeline as a ring, running.
 *
 * Circular rather than a left-to-right flow for two reasons. The radar is the
 * brand's signature chart, so a ring echoes geometry the product already owns
 * instead of importing a new visual language. And a wave of parallel steps
 * reads better as arc segments igniting together than as a column of rows
 * ticking over — which is what the pipeline actually does, four at once in
 * wave 2.
 *
 * Presentational only. It takes step states and draws them; it knows nothing
 * about jobs, polling or the admin. That's deliberate — the client-facing
 * "watch it work" moment on the backlog wants the same component.
 *
 * All motion is CSS (see globals.css). No JS animation loop, no
 * getTotalLength(), so Safari renders it identically and
 * prefers-reduced-motion collapses it to a clean static diagram — the same
 * approach as ResearchPipeline on /methodology.
 */

export type OrbitStep = {
  id: string;
  label: string;
  status: string;
  degraded?: boolean;
  ms?: number | null;
};

const SIZE = 300;
const C = SIZE / 2;
const R = 108; // node ring
const TRACK = 128; // progress arc, outside the nodes

const CIRC = 2 * Math.PI * TRACK;

/** Start at twelve o'clock and run clockwise, the direction people read a dial. */
function pointAt(index: number, total: number, radius = R) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
}

const COLOR: Record<string, string> = {
  done: "#3CBF6C",
  running: "#2463EB",
  skipped: "#9C6B1A",
  failed: "#B03A2E",
  pending: "#AEB4BC",
};

export default function PipelineOrbit({
  steps,
  percent,
  label,
}: {
  steps: OrbitStep[];
  /** 0–100. Drives the arc. */
  percent: number;
  /** Centre caption — usually the running step, or a final state. */
  label?: string;
}) {
  const total = steps.length || 1;
  const running = steps.filter((s) => s.status === "running");
  const settled = steps.filter((s) =>
    ["done", "skipped", "failed"].includes(s.status),
  ).length;

  const active = running[0] ?? null;
  const caption = label ?? active?.label ?? (settled === total ? "Complete" : "Waiting");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[300px] h-auto"
        role="img"
        aria-label={`Research pipeline: ${settled} of ${total} steps complete. ${caption}.`}
      >
        <defs>
          <linearGradient id="axOrbitGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4AC9DC" />
            <stop offset="70%" stopColor="#2463EB" />
            <stop offset="100%" stopColor="#3CBF6C" />
          </linearGradient>
        </defs>

        {/* Track. Stone hairline, same weight as the radar's rings. */}
        <circle cx={C} cy={C} r={TRACK} fill="none" stroke="#DDD9D0" strokeWidth="1" />

        {/*
          Progress arc. dashoffset is a plain inline style with a transition,
          so it eases between waves without a JS tween — and lands exactly on
          the real number rather than an animated approximation of it.
        */}
        <circle
          cx={C}
          cy={C}
          r={TRACK}
          fill="none"
          stroke="url(#axOrbitGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - Math.min(100, Math.max(0, percent)) / 100)}
          transform={`rotate(-90 ${C} ${C})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />

        {/*
          The orbit. One dot per step currently running — so wave 2 shows four
          chasing each other and wave 1 shows one. The count is the animation:
          it tells you the pipeline is parallel without a word of explanation.
        */}
        {running.length > 0 && (
          <g className="ax-orbit" style={{ transformOrigin: `${C}px ${C}px` }}>
            {running.map((s, i) => {
              const p = pointAt(i, Math.max(running.length, 1), TRACK);
              return (
                <circle
                  key={`orbit-${s.id}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#2463EB"
                  opacity="0.9"
                />
              );
            })}
          </g>
        )}

        {/* Nodes, in wave order around the dial. */}
        {steps.map((s, i) => {
          const p = pointAt(i, total);
          const color = COLOR[s.status] ?? COLOR.pending;
          const isRunning = s.status === "running";
          const isSettled = ["done", "skipped", "failed"].includes(s.status);

          return (
            <g key={s.id}>
              {isRunning && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill={color}
                  opacity="0.3"
                  className="ax-node-halo"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isRunning ? 6 : 5}
                fill={isSettled || isRunning ? color : "#F8F6F1"}
                stroke={color}
                strokeWidth="1.5"
                style={{ transition: "fill 400ms ease, r 400ms ease" }}
              />
              {/* Degraded is amber and reserved — a vendor-style watch-out, not
                  a failure. Marked with a ring rather than a colour swap so the
                  node still reads as done, which it is. */}
              {s.degraded && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="9"
                  fill="none"
                  stroke="#9C6B1A"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              )}
            </g>
          );
        })}

        {/* Centre: the number, then what it's doing. */}
        <text
          x={C}
          y={C - 4}
          textAnchor="middle"
          className="font-mono"
          fontSize="30"
          fill="#1C2431"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(percent)}
          <tspan fontSize="15" fill="#AEB4BC">
            %
          </tspan>
        </text>
        <text
          x={C}
          y={C + 18}
          textAnchor="middle"
          className="font-mono"
          fontSize="9"
          letterSpacing="1.6"
          fill="#706C63"
        >
          {caption.toUpperCase()}
        </text>
        <text
          x={C}
          y={C + 34}
          textAnchor="middle"
          className="font-mono"
          fontSize="9"
          letterSpacing="1.2"
          fill="#AEB4BC"
        >
          {settled}/{total} STEPS
        </text>
      </svg>
    </div>
  );
}
