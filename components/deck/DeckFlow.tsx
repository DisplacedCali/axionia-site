"use client";

import { useState, type ReactNode } from "react";

/**
 * The Axionia Insight walkthrough.
 *
 * ── What this is ──
 *
 * One vendor taken apart in nine screens, then the pivot — that was one
 * vendor, Meridian has eight — then the portfolio, then what happens between
 * renewals. It is the flow the pre-port axionia_buyer_deck.html carried and
 * the port to /deck dropped, rebuilt in the deck's own visual language.
 *
 * ── Illustrative, and it says so once ──
 *
 * Monte Carlo, sensitivity, peer benchmarking, the vendor landscape and
 * continuous monitoring are not built. The screens present them as though
 * they are, because that is what a product walkthrough is for, and the slide
 * carries ONE line saying the whole thing is illustrative and some views are
 * in build. One line rather than a badge on every screen: twelve badges make
 * the demo read as a roadmap, and a roadmap doesn't sell anything. One line
 * still means nobody can later say the deck claimed a benchmark cohort that
 * doesn't exist.
 *
 * For that reason no screen here cites a specific dataset size. The old deck's
 * benchmark screen said "n=47 light manufacturing employers", which is a
 * fabricated citation rather than an illustrative number — the same failure
 * CLAUDE.md bans in the benefit library.
 *
 * ── Why it renders twice ──
 *
 * A click-through is right in a meeting and wrong in a PDF: /deck is mailed as
 * often as it is presented, and an interactive shell prints as one frozen
 * screen with the other twelve unreachable. So SCREENS renders as a shell on
 * screen and as a storyboard in print, from one array. Two hand-maintained
 * copies would drift, and the printed one drifts first because nobody reads
 * the PDF as carefully as the slide they just clicked.
 *
 * Charts are inline SVG rather than a charting library — the stack is
 * deliberately thin, and these are four fixed illustrative shapes, not data
 * binding. They are screen-only; the storyboard carries the numbers as text.
 */

const SECTIONS = [
  { k: "One vendor, in depth", n: "01–09" },
  { k: "The whole portfolio", n: "10–11" },
  { k: "Between renewals", n: "12–13" },
] as const;

type Screen = {
  n: string;
  section: 0 | 1 | 2;
  tab: string;
  url: string;
  eyebrow: string;
  title: string;
  sub: string;
  /** Text pairs. The storyboard renders these; the shell falls back to them. */
  rows: readonly (readonly [string, string])[];
  /** Rich screen body. Screen only — never printed. */
  body?: ReactNode;
  note?: string;
};

/* ── chart primitives ───────────────────────────────────────────────────────
   viewBox units are the unit of measure, not pixels. Type sizes below are in
   viewBox units chosen so they stay legible when the SVG is laid out at the
   ~640px the slide gives it. */

function Histogram() {
  // Right-skewed distribution of simulated PMPM outcomes, 0–200.
  const bars = [2, 5, 11, 19, 28, 34, 33, 29, 24, 19, 15, 11, 8, 6, 4, 3, 2, 1, 1, 1];
  const max = Math.max(...bars);
  return (
    <svg viewBox="0 0 640 170" className="dk-i-svg" role="img" aria-label="Distribution of simulated savings outcomes, with the vendor claim at the 97th percentile">
      {bars.map((b, i) => {
        const h = (b / max) * 120;
        const x = 20 + i * 30;
        // The expected case sits in bin 5 ($50–60).
        const on = i === 5;
        return (
          <rect
            key={i}
            x={x}
            y={140 - h}
            width={24}
            height={h}
            fill={on ? "#2463EB" : "#C9D6F2"}
          />
        );
      })}
      <line x1="20" y1="140" x2="620" y2="140" stroke="#E6E2D9" strokeWidth="1" />
      {/* Vendor claim marker at $180 — bin 18 of 20. */}
      <line x1="560" y1="14" x2="560" y2="140" stroke="#9C6B1A" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="554" y="26" textAnchor="end" fontSize="11" fill="#9C6B1A" fontFamily="'DM Mono', monospace">
        $180 claimed — 97th pct
      </text>
      <text x="170" y="26" fontSize="11" fill="#2463EB" fontFamily="'DM Mono', monospace">
        $54 expected — median
      </text>
      <text x="20" y="158" fontSize="10" fill="#AEB4BC" fontFamily="'DM Mono', monospace">$0</text>
      <text x="620" y="158" textAnchor="end" fontSize="10" fill="#AEB4BC" fontFamily="'DM Mono', monospace">$200 PMPM</text>
    </svg>
  );
}

function Tornado() {
  const rows: [string, number, string][] = [
    ["Year 1 engagement rate", 76, "#2463EB"],
    ["Selection bias adjustment", 22, "#9C6B1A"],
    ["Attribution overlap", 14, "#5B7095"],
    ["Time to value", 7, "#AEB4BC"],
  ];
  const max = 80;
  return (
    <svg viewBox="0 0 640 150" className="dk-i-svg" role="img" aria-label="Impact of each assumption on expected savings">
      {rows.map(([label, v, colour], i) => {
        const y = 14 + i * 34;
        const w = (v / max) * 330;
        return (
          <g key={label}>
            <text x="0" y={y + 13} fontSize="12" fill="#706C63" fontFamily="'DM Sans', sans-serif">
              {label}
            </text>
            <rect x="270" y={y} width={w} height="18" fill={colour} />
            <text x={276 + w} y={y + 13} fontSize="11" fill="#706C63" fontFamily="'DM Mono', monospace">
              ±${v} PMPM
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BenchmarkBars() {
  const rows: [string, number, string][] = [
    ["Peer median", 48, "#AEB4BC"],
    ["Meridian expected", 54, "#2463EB"],
    ["Top quartile", 78, "#3CBF6C"],
  ];
  return (
    <svg viewBox="0 0 640 130" className="dk-i-svg" role="img" aria-label="Meridian expected savings against peer employers">
      {rows.map(([label, v, colour], i) => {
        const y = 8 + i * 40;
        const w = (v / 90) * 400;
        return (
          <g key={label}>
            <text x="0" y={y + 15} fontSize="12" fill="#706C63" fontFamily="'DM Sans', sans-serif">
              {label}
            </text>
            <rect x="170" y={y} width={w} height="22" fill={colour} />
            <text x={178 + w} y={y + 16} fontSize="13" fill="#1C2431" fontFamily="'Cormorant Garamond', serif">
              ${v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Landscape() {
  // x = evidence quality, y = population fit. Both 0–10.
  const pts: [string, number, number, string][] = [
    ["SpineWell (current)", 6.4, 4.2, "#9C6B1A"],
    ["Kinetic Health", 7.8, 7.4, "#3CBF6C"],
    ["Onsite PT partner", 6.9, 8.6, "#3CBF6C"],
    ["OrthoPath", 8.2, 3.1, "#93B4F7"],
    ["MoveWell", 5.2, 8.0, "#93B4F7"],
    ["Vertex MSK", 4.1, 5.6, "#93B4F7"],
  ];
  const X = (v: number) => 40 + (v / 10) * 560;
  const Y = (v: number) => 200 - (v / 10) * 175;
  return (
    <svg viewBox="0 0 640 230" className="dk-i-svg" role="img" aria-label="MSK vendors plotted by evidence quality and population fit">
      <rect x="40" y="20" width="560" height="180" fill="#FDFCF9" stroke="#E6E2D9" />
      <line x1="320" y1="20" x2="320" y2="200" stroke="#E6E2D9" strokeDasharray="3 3" />
      <line x1="40" y1="110" x2="600" y2="110" stroke="#E6E2D9" strokeDasharray="3 3" />
      {pts.map(([label, x, y, colour]) => (
        <g key={label}>
          <circle cx={X(x)} cy={Y(y)} r="6" fill={colour} />
          <text
            x={X(x) + 10}
            y={Y(y) + 4}
            fontSize="11"
            fill="#706C63"
            fontFamily="'DM Sans', sans-serif"
          >
            {label}
          </text>
        </g>
      ))}
      <text x="40" y="220" fontSize="10" fill="#AEB4BC" fontFamily="'DM Mono', monospace">
        EVIDENCE QUALITY →
      </text>
      <text x="10" y="128" fontSize="10" fill="#AEB4BC" fontFamily="'DM Mono', monospace" transform="rotate(-90 10 128)">
        POPULATION FIT →
      </text>
    </svg>
  );
}

/* ── the portfolio, used by two screens ─────────────────────────────────── */

const STACK: readonly {
  name: string;
  vendor: string;
  levers: readonly number[];
  score: number;
  cost: string;
  action: "expand" | "keep" | "reneg" | "cut";
  why: string;
}[] = [
  { name: "Fitness stipend", vendor: "Unbrokered", levers: [4.9, 8.1, 7.9, 4.0, 9.0, 8.6], score: 7.1, cost: "$170K", action: "expand", why: "Nobody sells this, so nobody proposed it. Highest fit in the stack." },
  { name: "Telehealth", vendor: "Carrier bundled", levers: [5.0, 6.6, 7.2, 3.8, 8.0, 9.1], score: 6.6, cost: "$150K", action: "keep", why: "Broad reach at low marginal cost. Nothing to fix." },
  { name: "Diabetes management", vendor: "Livonia", levers: [6.8, 7.4, 5.6, 4.2, 6.9, 4.4], score: 5.9, cost: "$300K", action: "keep", why: "Evidence holds for this workforce. Watch the 18-month attenuation." },
  { name: "Virtual MSK", vendor: "SpineWell", levers: [7.2, 7.0, 4.8, 3.5, 6.4, 5.1], score: 5.8, cost: "$290K", action: "reneg", why: "Proceed at $54 PMPM expected, not $180. Fees on verified engagement." },
  { name: "Navigation", vendor: "Guidewell", levers: [5.5, 6.2, 5.0, 3.0, 7.1, 6.8], score: 5.6, cost: "$190K", action: "reneg", why: "Overlaps MSK and diabetes. Roughly a fifth of its claim is counted twice." },
  { name: "Fertility & family building", vendor: "Nascent", levers: [4.4, 3.2, 6.1, 5.0, 7.8, 2.1], score: 4.8, cost: "$500K", action: "reneg", why: "Largest line in the stack, narrowest reach. Scope, don't cut." },
  { name: "EAP", vendor: "Legacy carrier", levers: [3.1, 4.0, 2.2, 2.0, 5.5, 8.2], score: 4.2, cost: "$142K", action: "cut", why: "2% utilisation against a 31% behavioural need. Replace, don't renew." },
  { name: "Second opinion", vendor: "Consilium", levers: [3.8, 4.6, 2.8, 2.4, 6.2, 3.0], score: 3.8, cost: "$98K", action: "cut", why: "Duplicated by the carrier's own service at no additional cost." },
];

const LEVERS = ["Economic", "Fit", "Engagement", "Attribution", "Vendor", "Breadth"] as const;

function heat(v: number) {
  if (v >= 7) return "is-hi";
  if (v >= 4) return "is-mid";
  return "is-lo";
}

const ACTION_LABEL = { expand: "Expand", keep: "Keep", reneg: "Renegotiate", cut: "Cut / replace" } as const;

/* ── screens ─────────────────────────────────────────────────────────────── */

const SCREENS: readonly Screen[] = [
  {
    n: "01",
    section: 0,
    tab: "Set up",
    url: "insight / meridian / configure",
    eyebrow: "Axionia Insight — configure the analysis",
    title: "Tell us about your organisation.",
    sub: "Company profile and the benefit mix already in place. Everything downstream is calibrated to this workforce rather than to a national benchmark population.",
    rows: [
      ["Company", "Meridian Manufacturing"],
      ["Workforce", "820 employees · average age 43 · light manufacturing · Midwest"],
      ["Programs in place", "MSK · navigation · diabetes · EAP · fertility · fitness · telehealth · second opinion"],
      ["Optimising for", "Cost 65 · Absence 20 · Experience 10 · Talent 5"],
    ],
    note: "No census and no claims feed. The analysis runs on documents you already own.",
  },
  {
    n: "02",
    section: 0,
    tab: "The claim",
    url: "insight / meridian / msk",
    eyebrow: "The decision on the table",
    title: "Meridian Manufacturing — MSK program evaluation",
    sub: "HR is ready to sign. The CFO has questions nobody in the room is positioned to answer.",
    rows: [
      ["Employees", "820"],
      ["MSK eligible", "~31%"],
      ["Current MSK spend", "$1.2M / yr"],
      ["Decision", "Renewal in 14 days"],
      ["Vendor claim", "$180 PMPM savings, 3.2× ROI in year one"],
    ],
    body: (
      <>
        <div className="dk-i-stats">
          {[
            ["Employees", "820"],
            ["MSK eligible", "~31%"],
            ["Current MSK spend", "$1.2M / yr"],
            ["Decision", "Renewal in 14 days"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="dk-i-stat-k">{k}</div>
              <div className="dk-i-stat-v">{v}</div>
            </div>
          ))}
        </div>
        <div className="dk-i-banner">
          <div className="dk-i-banner-k">Vendor claim — SpineWell Health</div>
          <div className="dk-i-banner-v">
            &ldquo;Our program delivers <strong>$180 PMPM in savings</strong> with
            a <strong>3.2× ROI</strong> in year one, based on outcomes across 47
            employer deployments.&rdquo;
          </div>
        </div>
      </>
    ),
  },
  {
    n: "03",
    section: 0,
    tab: "Scoring",
    url: "insight / meridian / msk / score",
    eyebrow: "Independent scoring",
    title: "SpineWell Health — evidence score",
    sub: "Six dimensions, scored against Meridian's covered population rather than against the population the vendor's study was run on.",
    rows: [
      ["Economic impact", "7.2"],
      ["Utilisation impact", "6.5"],
      ["Engagement realism", "4.8"],
      ["Workforce alignment", "7.0"],
      ["Vendor transparency", "4.2"],
      ["Attribution confidence", "3.5"],
      ["Composite", "5.8 / 10 — proceed on significantly adjusted expectations"],
    ],
    body: (
      <>
        <div className="dk-i-scores">
          {([
            ["Economic impact", 7.2],
            ["Utilisation impact", 6.5],
            ["Engagement realism", 4.8],
            ["Workforce alignment", 7.0],
            ["Vendor transparency", 4.2],
            ["Attribution confidence", 3.5],
          ] as const).map(([k, v]) => (
            <div className="dk-i-score" key={k}>
              <span className="dk-i-score-k">{k}</span>
              <span className="dk-i-score-t">
                <span className={`dk-i-score-b ${heat(v)}`} style={{ width: `${v * 10}%` }} />
              </span>
              <span className="dk-i-score-v">{v.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="dk-i-composite">
          <span className="dk-i-composite-n">5.8 / 10</span>
          <span className="dk-i-composite-l">
            Composite — proceed on significantly adjusted expectations
          </span>
        </div>
      </>
    ),
  },
  {
    n: "04",
    section: 0,
    tab: "Range",
    url: "insight / meridian / msk / scenarios",
    eyebrow: "Scenario modelling",
    title: "What Meridian should actually expect",
    sub: "The vendor said $180. Axionia models a range, and the vendor's number sits near the ceiling of the best case rather than in the middle of it.",
    rows: [
      ["Optimistic", "$94 PMPM — 28% engagement, 1.8× ROI"],
      ["Expected", "$54 PMPM — 16% engagement, 1.1× ROI"],
      ["Conservative", "$18 PMPM — 8% engagement, 0.4× ROI"],
      ["Attribution finding", "35–40% is selection bias; a further 20% overlaps programs Meridian already runs. Neither was disclosed."],
    ],
    body: (
      <>
        <div className="dk-i-trio">
          {([
            ["Optimistic", "$94", "28% engagement · 1.8× ROI", "opt"],
            ["Expected", "$54", "16% engagement · 1.1× ROI", "exp"],
            ["Conservative", "$18", "8% engagement · 0.4× ROI", "con"],
          ] as const).map(([k, n, d, tone]) => (
            <div className={`dk-i-tri is-${tone}`} key={k}>
              <div className="dk-i-tri-k">{k}</div>
              <div className="dk-i-tri-n">{n}</div>
              <div className="dk-i-tri-d">{d}</div>
            </div>
          ))}
        </div>
        <div className="dk-i-find">
          <div className="dk-i-find-k">Attribution finding</div>
          <div className="dk-i-find-v">
            35–40% of the claimed savings reflects selection bias in
            SpineWell&rsquo;s study population. A further 20% overlaps with the
            PBM and care management programs Meridian already runs. Neither
            adjustment appears anywhere in the vendor&rsquo;s materials.
          </div>
        </div>
      </>
    ),
  },
  {
    n: "05",
    section: 0,
    tab: "Assumptions",
    url: "insight / meridian / msk / assumptions",
    eyebrow: "Transparent assumptions",
    title: "Every number is open. Every assumption is yours to challenge.",
    sub: "Where our estimate differs from what the vendor's materials imply, both are shown. Move any of them and the model recomputes in front of you.",
    rows: [
      ["Year 1 engagement rate", "Axionia 14–18% · vendor implies ~35%"],
      ["PMPM per engaged member", "Axionia $280–420 · vendor $514"],
      ["Selection bias adjustment", "Axionia −35% · vendor not applied"],
      ["Attribution overlap", "Axionia −20% · vendor not applied"],
      ["Time to value", "Axionia 9–14 months · vendor implies under 6"],
    ],
    body: (
      <table className="dk-i-table">
        <thead>
          <tr>
            <th>Assumption</th>
            <th>Axionia estimate</th>
            <th>Vendor stated</th>
          </tr>
        </thead>
        <tbody>
          {([
            ["Year 1 engagement rate", "14–18%", "Implied ~35%"],
            ["PMPM savings per engaged member", "$280–$420", "$514"],
            ["Selection bias adjustment", "−35%", "Not applied"],
            ["Attribution overlap", "−20%", "Not applied"],
            ["Time to value", "9–14 months", "Implied under 6 months"],
          ] as const).map(([a, b, c]) => (
            <tr key={a}>
              <td>{a}</td>
              <td className="dk-i-ours">{b}</td>
              <td className="dk-i-theirs">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    n: "06",
    section: 0,
    tab: "Monte Carlo",
    url: "insight / meridian / msk / simulation",
    eyebrow: "Monte Carlo simulation — 10,000 iterations",
    title: "A distribution, not a point estimate",
    sub: "Engagement rate, savings per engaged member, selection bias and attribution overlap are varied together rather than one at a time. The output is a probability, which is what a range is for.",
    rows: [
      ["5th percentile", "$8 PMPM"],
      ["25th percentile", "$34 PMPM"],
      ["Median", "$54 PMPM"],
      ["95th percentile", "$102 PMPM"],
      ["The vendor's $180", "97th percentile — around 3% of scenarios reach it"],
    ],
    body: (
      <>
        <Histogram />
        <div className="dk-i-pct">
          {([
            ["5th", "$8", ""],
            ["25th", "$34", ""],
            ["Median", "$54", "is-on"],
            ["95th", "$102", ""],
          ] as const).map(([k, v, on]) => (
            <div className={`dk-i-pct-c ${on}`} key={k}>
              <div className="dk-i-pct-k">{k} percentile</div>
              <div className="dk-i-pct-v">{v}</div>
            </div>
          ))}
        </div>
        <div className="dk-i-find is-amber">
          <div className="dk-i-find-k">Vendor claim against the distribution</div>
          <div className="dk-i-find-v">
            SpineWell&rsquo;s $180 PMPM falls at the <strong>97th percentile</strong>{" "}
            of simulated outcomes — around 3% of modelled scenarios reach it under
            Meridian&rsquo;s actual population and program conditions.
          </div>
        </div>
      </>
    ),
  },
  {
    n: "07",
    section: 0,
    tab: "Sensitivity",
    url: "insight / meridian / msk / sensitivity",
    eyebrow: "Sensitivity analysis",
    title: "What moves the number — and by how much",
    sub: "Which assumption to argue about, in order. This is where contract negotiation should spend its attention, and where the performance benchmarks belong.",
    rows: [
      ["Year 1 engagement rate", "±$76 PMPM — the primary lever"],
      ["Selection bias adjustment", "±$22 PMPM — needs population matching from the vendor"],
      ["Attribution overlap", "±$14 PMPM"],
      ["Time to value", "±$7 PMPM"],
      ["Contract recommendation", "Base fee on enrolment; shared savings unlocked at verified 15%+ engagement"],
    ],
    body: (
      <>
        <Tornado />
        <div className="dk-i-two">
          <div className="dk-i-find">
            <div className="dk-i-find-k">Highest impact</div>
            <div className="dk-i-find-v">
              Moving engagement from 8% to 28% changes expected savings by{" "}
              <strong>±$76 PMPM</strong>. It is the only lever worth structuring
              the contract around.
            </div>
          </div>
          <div className="dk-i-find is-amber">
            <div className="dk-i-find-k">Second highest</div>
            <div className="dk-i-find-v">
              Reducing the bias adjustment from 35% to 15% adds{" "}
              <strong>$22 PMPM</strong> — but only if SpineWell produces
              independent population matching. Ask for it.
            </div>
          </div>
        </div>
        <div className="dk-i-rec">
          <span className="dk-i-find-k">Contract recommendation</span> Base fee
          tied to enrolment, shared savings unlocked at verified 15%+ engagement.
          That aligns the vendor with Meridian&rsquo;s actual outcomes rather than
          its claimed ones.
        </div>
      </>
    ),
  },
  {
    n: "08",
    section: 0,
    tab: "Benchmark",
    url: "insight / meridian / msk / benchmark",
    eyebrow: "Peer population benchmark",
    title: "How Meridian compares to similar employers",
    sub: "Same industry, comparable workforce composition, similar geography. This is the context a vendor is never in a position to provide, because it would require knowing its competitors' results.",
    rows: [
      ["Peer median", "$48 PMPM"],
      ["Meridian expected", "$54 PMPM — 58th percentile"],
      ["Top quartile", "$78 PMPM"],
      ["What explains the gap", "Engagement program design, not MSK prevalence — which means it's reachable"],
    ],
    body: (
      <>
        <BenchmarkBars />
        <div className="dk-i-find is-green">
          <div className="dk-i-find-k">Benchmark insight</div>
          <div className="dk-i-find-v">
            Meridian&rsquo;s expected $54 sits at the <strong>58th percentile</strong>{" "}
            of comparable employers. The gap to the top quartile is explained by
            engagement program design rather than by workforce MSK prevalence —
            so it is reachable with the right contract structure, and worth
            roughly $24 PMPM.
          </div>
        </div>
      </>
    ),
    note: "Benchmark cohort: light manufacturing employers, 500–1,500 covered lives, Midwest.",
  },
  {
    n: "09",
    section: 0,
    tab: "Population fit",
    url: "insight / meridian / msk / transfer",
    eyebrow: "Population fit",
    title: "How much of SpineWell's evidence transfers?",
    sub: "The vendor's outcomes came from a specific population. Six dimensions of that population compared against Meridian's actual workforce is what produces the transfer adjustment — and it is the one nobody in the chain is positioned to make.",
    rows: [
      ["Average age", "Study 38 · Meridian 43"],
      ["Industry", "Study tech and knowledge work · Meridian light manufacturing"],
      ["MSK prevalence", "Study 22% · Meridian 31% — higher need"],
      ["Engagement baseline", "Study 41% · Meridian 14% — the critical gap"],
      ["Job type", "Study sedentary · Meridian physical and standing"],
      ["Transfer validity", "58 / 100 — this is where the ×0.58 comes from"],
    ],
    body: (
      <>
        <div className="dk-i-fit">
          <div>
            <div className="dk-i-fit-h">SpineWell study population</div>
            {([
              ["Average age", "38"],
              ["Industry", "Tech / knowledge work"],
              ["MSK prevalence", "22%"],
              ["Engagement baseline", "41%"],
              ["Job type", "Sedentary / desk"],
              ["Geography", "Coastal metro"],
            ] as const).map(([k, v]) => (
              <div className="dk-i-fit-r" key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="dk-i-fit-h is-ours">Meridian actual workforce</div>
            {([
              ["Average age", "43", "warn"],
              ["Industry", "Light manufacturing", "warn"],
              ["MSK prevalence", "31% — higher need", "good"],
              ["Engagement baseline", "14% — critical gap", "bad"],
              ["Job type", "Physical / standing", "warn"],
              ["Geography", "Midwest", "warn"],
            ] as const).map(([k, v, tone]) => (
              <div className="dk-i-fit-r" key={k}>
                <span>{k}</span>
                <span className={`is-${tone}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dk-i-two">
          <div className="dk-i-find">
            <div className="dk-i-find-k">Transfer validity</div>
            <div className="dk-i-find-n">58 / 100</div>
            <div className="dk-i-find-v">
              An estimated 58% of SpineWell&rsquo;s published outcomes transfer to
              this population. That figure is the ×0.58 in the adjustment stack —
              not a judgement about the vendor.
            </div>
          </div>
          <div className="dk-i-find is-amber">
            <div className="dk-i-find-k">Biggest validity gap</div>
            <div className="dk-i-find-n">41% vs 14%</div>
            <div className="dk-i-find-v">
              Physical job demands and shift schedules structurally suppress
              digital health engagement. SpineWell publishes no outcomes for any
              population below 20% baseline engagement.
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    n: "10",
    section: 1,
    tab: "Heat map",
    url: "insight / meridian / portfolio",
    eyebrow: "That was one vendor. Meridian has eight.",
    title: "The whole stack, scored on one framework",
    sub: "The single-vendor deep dive is how a decision gets made. The portfolio view is how the strategy gets protected — and it is the view a CFO has never once been shown, because no one party can see all of it.",
    rows: STACK.map((p) => [p.name, `${p.score.toFixed(1)} — ${p.vendor}`] as const),
    body: (
      <>
        <table className="dk-i-heat">
          <thead>
            <tr>
              <th>Program</th>
              {LEVERS.map((l) => (
                <th key={l}>{l}</th>
              ))}
              <th className="is-score">Score</th>
            </tr>
          </thead>
          <tbody>
            {STACK.map((p) => (
              <tr key={p.name}>
                <td>
                  {p.name}
                  <span className="dk-i-heat-v">{p.vendor}</span>
                </td>
                {p.levers.map((v, i) => (
                  <td key={i} className={`dk-i-cell ${heat(v)}`}>
                    {v.toFixed(1)}
                  </td>
                ))}
                <td className="is-score">{p.score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dk-i-legend">
          <span><i className="is-hi" />Strong 7–10</span>
          <span><i className="is-mid" />Moderate 4–6</span>
          <span><i className="is-lo" />Weak 1–3</span>
          <span className="dk-i-legend-note">
            The unbrokered fitness stipend outranks four programs somebody sold you.
          </span>
        </div>
      </>
    ),
  },
  {
    n: "11",
    section: 1,
    tab: "Keep / cut",
    url: "insight / meridian / portfolio / actions",
    eyebrow: "Ranked detail",
    title: "What to keep, renegotiate, and cut",
    sub: "Ranked by composite score, with annual cost and one action each. Under Meridian's stated weights — this same stack reorders for an employer weighted toward talent.",
    rows: [
      ...STACK.map((p) => [p.name, `${p.cost} · ${ACTION_LABEL[p.action]}`] as const),
      ["Total portfolio cost", "$1.84M"],
      ["Defensible today", "$620K"],
      ["Under renegotiation", "$980K"],
      ["Cut or replace", "$240K"],
    ],
    body: (
      <>
        <div className="dk-i-rank">
          {STACK.map((p) => (
            <div className="dk-i-rank-r" key={p.name}>
              <span className="dk-i-rank-s">{p.score.toFixed(1)}</span>
              <span className="dk-i-rank-n">
                {p.name}
                <span className="dk-i-rank-w">{p.why}</span>
              </span>
              <span className="dk-i-rank-c">{p.cost}</span>
              <span className={`dk-i-act is-${p.action}`}>{ACTION_LABEL[p.action]}</span>
            </div>
          ))}
        </div>
        <div className="dk-i-cfo">
          <div className="dk-i-cfo-k">Portfolio summary</div>
          <div className="dk-i-cfo-g">
            {([
              ["Total cost", "$1.84M", ""],
              ["Defensible today", "$620K", "is-green"],
              ["Under renegotiation", "$980K", "is-amber"],
              ["Cut or replace", "$240K", "is-red"],
            ] as const).map(([k, v, tone]) => (
              <div key={k}>
                <div className="dk-i-cfo-l">{k}</div>
                <div className={`dk-i-cfo-v ${tone}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    n: "12",
    section: 2,
    tab: "Landscape",
    url: "insight / meridian / landscape / msk",
    eyebrow: "Vendor landscape",
    title: "How your vendors compare, by category",
    sub: "Every vendor in the category plotted on evidence quality against fit to your population, with the ones you already hold marked. Knowing a program is mediocre is useful. Knowing what you'd move to is the decision.",
    rows: [
      ["SpineWell — current", "Evidence 6.4 · fit 4.2"],
      ["Kinetic Health", "Evidence 7.8 · fit 7.4 — recommended alternative"],
      ["Onsite PT partner", "Evidence 6.9 · fit 8.6 — recommended alternative"],
      ["OrthoPath", "Evidence 8.2 · fit 3.1 — strong study, wrong workforce"],
      ["MoveWell", "Evidence 5.2 · fit 8.0"],
      ["Vertex MSK", "Evidence 4.1 · fit 5.6"],
    ],
    body: (
      <>
        <div className="dk-i-cats">
          <span className="is-on">MSK</span>
          <span>Behavioural health</span>
          <span>Fertility</span>
          <span className="dk-i-cats-key">
            <i style={{ background: "#9C6B1A" }} />Current
            <i style={{ background: "#3CBF6C" }} />Recommended
            <i style={{ background: "#93B4F7" }} />Other
          </span>
        </div>
        <Landscape />
        <div className="dk-i-find is-green">
          <div className="dk-i-find-v">
            OrthoPath has the strongest evidence in the category and the worst fit
            to this workforce. That pairing is common, it is invisible from a
            vendor deck, and it is the reason evidence quality alone is a bad way
            to choose.
          </div>
        </div>
      </>
    ),
  },
  {
    n: "13",
    section: 2,
    tab: "Monitoring",
    url: "insight / meridian / signals",
    eyebrow: "Continuous monitoring",
    title: "Your vendors, watched between renewals",
    sub: "Financial distress signals, new outcomes research, litigation, regulatory movement and competitive shifts — against the specific vendors you hold. A renewal is decided long before the renewal meeting.",
    rows: [
      ["SpineWell Health · 6 days ago", "Series D at a lower valuation than the 2023 round. Not distress — renewal leverage."],
      ["Livonia Diabetes · 3 weeks ago", "New 24-month peer-reviewed outcomes. Effect holds to 18 months, attenuates after. Score revised 5.9 → 6.3."],
      ["Consilium · 5 weeks ago", "Two employer clients not renewed, per public filings. Already ranked for cut."],
      ["Illinois · 2 months ago", "Fertility coverage mandate amended. Affects 140 of your covered lives."],
    ],
    body: (
      <>
        <div className="dk-i-feed">
          {([
            ["SpineWell Health", "6 days ago", "Series D closed at a lower valuation than the 2023 round. Not distress — but it is renewal leverage, and it expires when they raise again.", "amber"],
            ["Livonia Diabetes", "3 weeks ago", "New 24-month peer-reviewed outcomes published. The effect holds to 18 months and attenuates after. Score revised 5.9 → 6.3.", "green"],
            ["Consilium Second Opinion", "5 weeks ago", "Two employer clients did not renew, per public filings. Already ranked for cut in your portfolio.", "amber"],
            ["Illinois", "2 months ago", "Fertility coverage mandate amended. Affects 140 of your covered lives and the scope conversation with Nascent.", "blue"],
          ] as const).map(([who, when, what, tone]) => (
            <div className={`dk-i-feed-r is-${tone}`} key={who}>
              <div className="dk-i-feed-h">
                <span>{who}</span>
                <span className="dk-i-feed-t">{when}</span>
              </div>
              <div className="dk-i-feed-v">{what}</div>
            </div>
          ))}
        </div>
        <div className="dk-i-rec">
          <span className="dk-i-find-k">Why the relationship continues</span> The
          report is a moment; the portfolio is a cycle. Monitoring is part of the
          ongoing engagement and is scoped against the portfolio, not the
          headcount — as on the commercial slide.
        </div>
      </>
    ),
  },
];

export default function DeckFlow() {
  const [i, setI] = useState(0);
  const s = SCREENS[i];
  const last = SCREENS.length - 1;
  const sectionStart = (n: number) => SCREENS.findIndex((x) => x.section === n);

  return (
    <>
      {/*
        data-deck-keys="local" tells DeckShell's key handler to leave the arrows
        and the space bar alone while focus is in here. Without it, clicking
        Next and then pressing space advances the SLIDE — which is exactly the
        failure you'd discover in front of a room.
      */}
      <div className="dk-flow" data-deck-keys="local">
        <div className="dk-flow-chrome">
          <span className="dk-flow-tl" />
          <span className="dk-flow-tl" />
          <span className="dk-flow-tl" />
          <span className="dk-flow-url">axionia.com / {s.url}</span>
          <span className="dk-flow-dots">
            {SCREENS.map((x, n) => (
              <button
                key={x.n}
                onClick={() => setI(n)}
                className={`dk-flow-d ${n === i ? "is-on" : ""}`}
                aria-label={`Screen ${x.n} — ${x.tab}`}
              />
            ))}
          </span>
        </div>

        <div className="dk-flow-tabs" role="tablist" aria-label="Walkthrough sections">
          {SECTIONS.map((sec, n) => (
            <button
              key={sec.k}
              role="tab"
              aria-selected={s.section === n}
              className={`dk-flow-tab ${s.section === n ? "is-on" : ""}`}
              onClick={() => setI(sectionStart(n))}
            >
              <span className="dk-flow-tab-n">{sec.n}</span>
              {sec.k}
            </button>
          ))}
        </div>

        <div className="dk-flow-body">
          <div className="dk-flow-e">{s.eyebrow}</div>
          <div className="dk-flow-t">{s.title}</div>
          <div className="dk-flow-s">{s.sub}</div>
          {s.body ?? (
            <div className="dk-flow-rows">
              {s.rows.map(([k, v]) => (
                <div className="dk-flow-row" key={k}>
                  <span className="dk-flow-k">{k}</span>
                  <span className="dk-flow-v">{v}</span>
                </div>
              ))}
            </div>
          )}
          {s.note && <div className="dk-flow-note">{s.note}</div>}
        </div>

        <div className="dk-flow-nav">
          <button
            className="dk-flow-btn"
            onClick={() => setI((c) => Math.max(0, c - 1))}
            disabled={i === 0}
          >
            ← Back
          </button>
          <span className="dk-flow-count">
            {s.n} / {SCREENS[last].n} · {s.tab}
          </span>
          <button
            className="dk-flow-btn is-primary"
            onClick={() => setI((c) => Math.min(last, c + 1))}
            disabled={i === last}
          >
            {i === last ? "End of walkthrough" : `${SCREENS[i + 1].tab} →`}
          </button>
        </div>
      </div>

      {/* The printed copy. Thirteen screens, all visible, no chrome and no
          charts — a 640-unit viewBox at one third of a column is unreadable,
          and the numbers underneath it are the part that matters. */}
      <div className="dk-board" aria-hidden="true">
        {SCREENS.map((x) => (
          <div className="dk-board-c" key={x.n}>
            <div className="dk-board-n">
              {x.n} — {x.tab}
            </div>
            <div className="dk-board-t">{x.title}</div>
            <div className="dk-board-s">{x.sub}</div>
            {x.rows.map(([k, v]) => (
              <div className="dk-board-row" key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
