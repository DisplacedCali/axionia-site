/**
 * The research pipeline, drawn as what it actually is.
 *
 * This is deliberately NOT an ambient "neural network" flourish. Every node
 * is a real stage the Research Agent runs, the two fans are the genuine
 * parallel waves, and the pipeline ends on human review — which is the point
 * of difference worth illustrating, since reports are edited before release
 * rather than auto-published.
 *
 * Animation is pure CSS dash-offset (see globals.css). No JS, no
 * getTotalLength(), so it renders identically in Safari and degrades to a
 * clean static diagram under prefers-reduced-motion.
 */

const WAVE_ONE = [
  "Company profile",
  "Benefits scan",
  "Financial signals",
  "Workforce data",
];

const WAVE_TWO = ["Regulatory check", "Workforce economics"];

// x positions across the 940-unit viewBox
const X = { intake: 68, w1: 268, w2: 500, model: 676, review: 812, report: 916 };
const CY = 170;
const W1_Y = [62, 134, 206, 278];
const W2_Y = [122, 218];

function edge(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export default function ResearchPipeline() {
  return (
    <div>
      {/* ── desktop / tablet: the graph ── */}
      <div className="hidden sm:block">
        <svg viewBox="0 0 940 340" className="w-full h-auto" role="img" aria-label="Research pipeline: intake feeds four parallel research agents, then two more, then an attribution model, human review, and the released report">
          <defs>
            <linearGradient id="axPipeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4AC9DC" />
              <stop offset="55%" stopColor="#2463EB" />
              <stop offset="100%" stopColor="#3CBF6C" />
            </linearGradient>
          </defs>

          {/* edges: intake → wave 1 */}
          {W1_Y.map((y, i) => (
            <path
              key={`e1-${i}`}
              d={edge(X.intake + 14, CY, X.w1 - 60, y)}
              fill="none"
              stroke="url(#axPipeGrad)"
              strokeWidth="1.25"
              opacity="0.55"
              className="ax-edge"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}

          {/* edges: wave 1 → wave 2 */}
          {W1_Y.map((y1, i) =>
            W2_Y.map((y2, j) => (
              <path
                key={`e2-${i}-${j}`}
                d={edge(X.w1 + 62, y1, X.w2 - 66, y2)}
                fill="none"
                stroke="url(#axPipeGrad)"
                strokeWidth="1"
                opacity="0.3"
                className="ax-edge"
                style={{ animationDelay: `${0.2 + i * 0.08 + j * 0.1}s` }}
              />
            ))
          )}

          {/* edges: wave 2 → model → review → report */}
          {W2_Y.map((y, i) => (
            <path
              key={`e3-${i}`}
              d={edge(X.w2 + 68, y, X.model - 18, CY)}
              fill="none"
              stroke="url(#axPipeGrad)"
              strokeWidth="1.25"
              opacity="0.55"
              className="ax-edge"
              style={{ animationDelay: `${0.4 + i * 0.14}s` }}
            />
          ))}
          <path
            d={edge(X.model + 18, CY, X.review - 16, CY)}
            fill="none"
            stroke="url(#axPipeGrad)"
            strokeWidth="1.5"
            opacity="0.7"
            className="ax-edge"
            style={{ animationDelay: "0.6s" }}
          />
          <path
            d={edge(X.review + 16, CY, X.report - 14, CY)}
            fill="none"
            stroke="#3CBF6C"
            strokeWidth="1.5"
            opacity="0.7"
            className="ax-edge"
            style={{ animationDelay: "0.75s" }}
          />

          {/* intake */}
          <circle cx={X.intake} cy={CY} r="10" fill="none" stroke="#4AC9DC" strokeWidth="1.5" opacity="0.35" className="ax-node-halo" />
          <circle cx={X.intake} cy={CY} r="5" fill="#4AC9DC" />
          <text x={X.intake} y={CY + 34} textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="10" letterSpacing="0.1em" fill="#AEB4BC">
            INTAKE
          </text>
          <text x={X.intake} y={CY + 50} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill="#706C63">
            your data
          </text>

          {/* wave 1 */}
          <text x={X.w1} y="24" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="9" letterSpacing="0.14em" fill="#5B7095">
            WAVE 1 — PARALLEL
          </text>
          {WAVE_ONE.map((label, i) => (
            <g key={label}>
              <rect x={X.w1 - 62} y={W1_Y[i] - 13} width="124" height="26" rx="2" fill="#2463EB" fillOpacity="0.10" stroke="#2463EB" strokeOpacity="0.35" strokeWidth="1" />
              <text x={X.w1} y={W1_Y[i] + 4} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#F8F6F1">
                {label}
              </text>
            </g>
          ))}

          {/* wave 2 */}
          <text x={X.w2} y="24" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="9" letterSpacing="0.14em" fill="#5B7095">
            WAVE 2
          </text>
          {WAVE_TWO.map((label, i) => (
            <g key={label}>
              <rect x={X.w2 - 68} y={W2_Y[i] - 13} width="136" height="26" rx="2" fill="#4AC9DC" fillOpacity="0.10" stroke="#4AC9DC" strokeOpacity="0.35" strokeWidth="1" />
              <text x={X.w2} y={W2_Y[i] + 4} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="#F8F6F1">
                {label}
              </text>
            </g>
          ))}

          {/* attribution model */}
          <circle cx={X.model} cy={CY} r="10" fill="none" stroke="#2463EB" strokeWidth="1.5" opacity="0.35" className="ax-node-halo" style={{ animationDelay: "0.5s" }} />
          <circle cx={X.model} cy={CY} r="6" fill="#2463EB" />
          <text x={X.model} y={CY + 34} textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="10" letterSpacing="0.1em" fill="#AEB4BC">
            ATTRIBUTION
          </text>
          <text x={X.model} y={CY + 50} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill="#706C63">
            bias · overlap · fit
          </text>

          {/* human review — the differentiator */}
          <circle cx={X.review} cy={CY} r="10" fill="none" stroke="#9C6B1A" strokeWidth="1.5" opacity="0.4" className="ax-node-halo" style={{ animationDelay: "1s" }} />
          <circle cx={X.review} cy={CY} r="6" fill="#9C6B1A" />
          <text x={X.review} y={CY + 34} textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="10" letterSpacing="0.1em" fill="#9C6B1A">
            HUMAN REVIEW
          </text>
          <text x={X.review} y={CY + 50} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill="#706C63">
            every time
          </text>

          {/* report */}
          <circle cx={X.report} cy={CY} r="6" fill="#3CBF6C" />
          <text x={X.report} y={CY + 34} textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="10" letterSpacing="0.1em" fill="#3CBF6C">
            REPORT
          </text>
        </svg>
      </div>

      {/* ── mobile: same stages, read vertically ── */}
      <div className="sm:hidden">
        <ol className="relative">
          {[
            { k: "INTAKE", v: "Your programs, workforce and the vendor's claim", tone: "text-teal", dot: "#4AC9DC" },
            { k: "WAVE 1 — 4 IN PARALLEL", v: WAVE_ONE.join(" · "), tone: "text-base", dot: "#2463EB" },
            { k: "WAVE 2", v: WAVE_TWO.join(" · "), tone: "text-base", dot: "#4AC9DC" },
            { k: "ATTRIBUTION MODEL", v: "Selection bias, double-counted value, evidence transfer", tone: "text-base", dot: "#2463EB" },
            { k: "HUMAN REVIEW", v: "Read and edited by a person before release — every time", tone: "text-caution", dot: "#9C6B1A" },
            { k: "YOUR REPORT", v: "Ranges, not point figures, with every assumption shown", tone: "text-pos", dot: "#3CBF6C" },
          ].map((s, i, arr) => (
            <li key={s.k} className="relative pl-7 pb-6 last:pb-0">
              {i < arr.length - 1 && (
                <svg className="absolute left-[5px] top-4 w-px" height="100%" style={{ height: "calc(100% - 8px)" }}>
                  <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="url(#axPipeGradV)" strokeWidth="1.5" className="ax-edge" opacity="0.6" />
                  <defs>
                    <linearGradient id="axPipeGradV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4AC9DC" />
                      <stop offset="100%" stopColor="#3CBF6C" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
              <span
                className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full"
                style={{ backgroundColor: s.dot }}
              />
              <div className={`font-mono text-[9px] uppercase tracking-[0.14em] ${s.tone}`}>
                {s.k}
              </div>
              <div className="text-[13px] leading-[1.6] text-gray-cool mt-1">{s.v}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
