import DeckFlow from "./DeckFlow";
import InvestorReturn from "./InvestorReturn";

/**
 * The investor deck. Pre-seed, $1.0M at $6.0M pre-money.
 *
 * ── Why this is a port and not an import ──
 *
 * It arrived as a standalone HTML file carrying its own colour variables, its
 * own type scale and its own chrome. That file drifts the moment either it or
 * the site changes, and a deck that disagrees with axionia.com about what blue
 * is has already told an investor something. It now renders through deck.css
 * like the other two, so the brand tokens are canonical here as everywhere.
 *
 * ── One deck, one demo ──
 *
 * The original slide 6 carried its own five-screen walkthrough, a shorter and
 * older cut of the one the buyer deck shows. Two demos of one product is two
 * things to keep true. This renders the same DeckFlow component, so an investor
 * sees exactly what a buyer sees — which is also the honest answer to "what
 * does it actually do."
 *
 * ── Sourcing ──
 *
 * The $967B anchor is verified: private businesses' health spending was $967.4B
 * in 2024, 18% of national health expenditure (Health Affairs, NHE Accounts).
 * The growth figure for that specific series is 6.3%, not the 6.7% the original
 * carried — 7.2% is total NHE and 8.8% is all private health insurance, and
 * quoting the wrong one of three published numbers is the kind of thing a
 * diligence process finds.
 *
 * The "3–5× ROI inflation" stat is gone. Its source was "Axionia methodology",
 * which is a self-citation dressed as a market fact, and it was the one number
 * on the problem slide nobody could stand behind. What replaced it is stronger
 * and it is somebody else's: the Illinois Workplace Wellness Study, a
 * randomised trial whose confidence intervals rule out 84% of the effects
 * reported across 112 prior studies of the same kind of program.
 */

const FIVE = [
  ["01", "Independent value assessment", "Evaluated against market benchmarks and published evidence — not vendor case studies."],
  ["02", "Transparent assumption modelling", "Every PMPM estimate, engagement assumption and attribution adjustment is visible and adjustable. We tell you what we think, and we expose the entire model."],
  ["03", "Scenario and tail-risk planning", "Optimistic, expected and conservative outcomes modelled explicitly. A point estimate with no range around it is a guess wearing a suit."],
  ["04", "Value attribution framework", "Overlapping vendor claims de-duplicated, selection bias adjusted for, ROI grounded in evidence rather than sales materials."],
  ["05", "Workforce-aligned economics", "Benefit ROI modelled against actual workforce composition, replacement cost and talent retention economics."],
];

const FOCUS = [
  ["01", "Scoring framework v1", "The defensible spine. Ten dimensions, transparent weights. It becomes the product logic, the AI reasoning structure and the long-term moat."],
  ["02", "Two or three example reports", "Composite employers, real market assumptions, real vendor categories, transparent assumptions. Forces structure, clarity and an output standard. You just saw one."],
  ["03", "Customer discovery", "Employers, progressive brokers, consultants. Not pitching software — validating decision workflows and where the pain actually sits."],
  ["04", "Benchmark and intelligence library", "Vendor benchmarks, published studies, PMPM and utilisation assumptions, outcomes literature. The long-term proprietary foundation."],
  ["05", "Lightweight brand and web presence", "Clarity and credibility rather than polished SaaS. Explain the problem, publish the methodology, invite the conversation."],
];

const PHASES = [
  {
    n: "Phase 1 — 0–12 months",
    t: "High-ticket intelligence",
    d: "Consulting-heavy. Software assists delivery.",
    target: "Target: ~$1.2M revenue",
    items: [
      "10 intelligence reports @ $50K avg",
      "3 enterprise projects @ $125K avg",
      "10 SaaS subscriptions @ $12K ARR",
      "4 advisory retainers @ $5K/mo",
    ],
    goal: "Cash flow, methodology, reference clients",
  },
  {
    n: "Phase 2 — 12–24 months",
    t: "Platform-enabled consulting",
    d: "Models standardise. Margins expand.",
    target: "Target: $2M–$5M",
    items: [
      "Standardised ingestion and benchmarking",
      "Scoring and scenario engine productised",
      "Channel partners: brokers and PE firms",
      "2–4 analysts hired",
    ],
    goal: "Flywheel, channel, margin expansion",
  },
  {
    n: "Phase 3 — 24–48 months",
    t: "Decision intelligence platform",
    d: "Software becomes the product.",
    target: "Target: $10M–$30M+ ARR",
    items: [
      "Benchmark data becomes the moat",
      "Vendor scoring network effects",
      "Longitudinal outcomes as proprietary IP",
      "Consulting becomes optional and premium",
    ],
    goal: "Valuation multiple expansion",
  },
];

/**
 * What the $1.0M buys — the slide the deck doesn't have yet.
 *
 * The word "$1.0M" appears fourteen times across these thirteen slides and not
 * once does anything say what it purchases or how long it lasts. That is the
 * first question after "how much", and it currently has no answer.
 *
 * ── Why this is a function returning null rather than a table of guesses ──
 *
 * The allocation is Tom's model and nobody else's. A plausible-looking split
 * invented here would be indistinguishable from a real one on the page and
 * would be read aloud to somebody writing a cheque — the same failure the
 * benefit library bans, with worse consequences. So the gap is recorded rather
 * than filled, and the slide is CONDITIONAL: while this returns null the deck
 * renders thirteen slides exactly as before. It cannot half-ship, and there is
 * no placeholder to forget.
 *
 * To turn it on, return the object. Five things are needed:
 *
 *   months     — how long $1.0M lasts, alone, at planned burn
 *   allocation — three or four rows of [area, amount, what it buys]
 *   proves     — what is demonstrably true when the money is spent
 *   floor      — what happens if Phase 1 revenue misses (it funds itself, or
 *                the runway shortens to N months)
 *   ownership  — whether any of it is earmarked for a hire, since "2–4 analysts"
 *                currently first appears in Phase 2 with no funding attached
 */
type UseOfFunds = {
  months: number;
  allocation: { area: string; amount: string; buys: string }[];
  proves: string[];
  floor: string;
};

function useOfFunds(): UseOfFunds | null {
  return null;
}

const CAREER = [
  ["2025–now", "SVP Analytics", "WIN · Greenwich, CT"],
  ["2022–2025", "SVP Analytics, Health Economics & Data Science", "Quartet Health · New York"],
  ["2017–2019", "VP Payer Strategy", "Genoa Healthcare / Optum"],
  ["2014–2017", "Director, Healthcare Advisory Services", "PwC"],
  ["2007–2011", "Sr. Fraud Detection Statistician → Principal Analytics", "OptumInsight"],
];

const FUNDS = useOfFunds();

export const INVESTOR_SLIDES = [
  /* ── 00 · cover ── */
  <div className="dk-navy dk-cover" key="i0">
    <span className="dk-orb dk-orb-a" />
    <span className="dk-orb dk-orb-b" />
    <div className="dk-cover-in">
      <div className="dk-eyebrow dk-eyebrow-l">
        Axionia — Healthcare Decision Intelligence · Confidential
      </div>
      <h1 className="dk-h1">
        The independent intelligence layer
        <br />
        <em>that has never existed.</em>
      </h1>
      <p className="dk-sub dk-sub-l">
        Employers spend $967B a year on healthcare benefits. The decisions
        driving that spend flow through a broker channel with structural
        conflicts of interest — and almost no independent evaluation.
      </p>
      <blockquote className="dk-quote dk-quote-l">
        Your broker has a model. Now you have one too.
      </blockquote>
    </div>
  </div>,

  /* ── 01 · the problem ──
     The fourth stat used to be "3–5× typical ROI inflation", sourced to
     "Axionia methodology". A headline market claim citing its own author is
     the weakest thing that can sit on a problem slide, and it was the number
     an investor would have picked first. The Illinois trial is stronger
     precisely because it is not ours. */
  <div key="i1">
    <div className="dk-eyebrow">The problem</div>
    <h2 className="dk-h2">
      $967B a year, spent on programs
      <br />
      nobody can <em>independently evaluate.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Vendors write the studies. Brokers earn commissions on what they
      recommend. Nobody in the chain is doing the independent math, and the
      people accountable for the spend are usually not the people making the
      decision.
    </p>
    <div className="dk-grid-2">
      <div className="dk-stat">
        <div className="dk-stat-n">84%</div>
        <div className="dk-stat-l">
          Of the effects reported across 112 prior workplace-health studies were
          ruled out by a randomised trial of the same kind of program.
          Participants were simply healthier and spending less before they
          enrolled — which is what the observational studies were measuring.
        </div>
        <div className="dk-stat-s">
          Jones, Molitor &amp; Reif, Quarterly Journal of Economics, 2019 —
          Illinois Workplace Wellness Study
        </div>
      </div>
      <div className="dk-stat">
        <div className="dk-stat-n">$0</div>
        <div className="dk-stat-l">
          Independent analysis most mid-market employers receive before a major
          benefit decision
        </div>
        <div className="dk-stat-s">Axionia customer discovery, 2025–26</div>
      </div>
      <div className="dk-stat">
        <div className="dk-stat-n">Majority</div>
        <div className="dk-stat-l">
          Of CFOs cannot confirm their long-term cost management strategies are
          saving money
        </div>
        <div className="dk-stat-s">Mercer, CFO Perspective on Health, 2024</div>
      </div>
      <div className="dk-stat">
        <div className="dk-stat-n">19% → 33%</div>
        <div className="dk-stat-l">
          CFOs ranking healthcare a top-three operating expense — nearly doubled
          in two years
        </div>
        <div className="dk-stat-s">Mercer, CFO Perspective on Health, 2024 &amp; 2026</div>
      </div>
    </div>
    <div className="dk-callout">
      <strong>The core tension.</strong> The people making benefit decisions are
      often not the people accountable for the spend. Brokers have a structural
      conflict of interest. CFOs can&rsquo;t get in the room. And the cost
      pressure that used to make this tolerable is gone.
    </div>
  </div>,

  /* ── 02 · market ── */
  <div key="i2">
    <div className="dk-eyebrow">Market opportunity</div>
    <h2 className="dk-h2">
      A $495B decision market
      <br />
      with <em>no independent intelligence layer.</em>
    </h2>

    <div className="dk-tam">
      <div className="dk-tam-r">
        <div className="dk-tam-k">
          <span className="dk-tam-lbl">Total addressable</span>
          <span className="dk-tam-n">$967B</span>
          <span className="dk-tam-g">+6.3%</span>
        </div>
        <div className="dk-tam-v">
          <strong>Core health plan premiums.</strong> Medical, Rx, dental,
          vision. Non-discretionary, dominated by national carriers, growing at
          the highest rate in fifteen years. Axionia can inform plan design, but
          this is the foundation layer rather than the target.
          <span className="dk-tam-s">
            US private business health spending, 2024 · 154M covered lives ·
            Health Affairs NHE Accounts, KFF 2025
          </span>
        </div>
      </div>
      <div className="dk-tam-r">
        <div className="dk-tam-k">
          <span className="dk-tam-lbl">Serviceable</span>
          <span className="dk-tam-n">$61–85B</span>
          <span className="dk-tam-g">+7%</span>
        </div>
        <div className="dk-tam-v">
          <strong>Point solutions and supplemental programs.</strong> Fully
          discretionary, vendor-sold, heavily brokered. MSK, mental health,
          navigation, chronic disease, fertility, GLP-1. The average employer
          evaluates three to six new programs a year, almost entirely on
          vendor-supplied evidence.
          <span className="dk-tam-s">
            Broker research activity up 74% · Wellable 2024, Shortlister 2026
          </span>
        </div>
      </div>
      <div className="dk-tam-r is-core">
        <div className="dk-tam-k">
          <span className="dk-tam-lbl">Axionia target</span>
          <span className="dk-tam-n">$495B</span>
          <span className="dk-tam-g">~140,000</span>
        </div>
        <div className="dk-tam-v">
          <strong>Mid-market employers, 100–4,999 employees.</strong> Large
          enough to need sophisticated analysis, small enough to lack the
          internal capacity for it, advised by a $15B channel compensated by
          vendor commissions. Zero independent evaluation today.
          <span className="dk-tam-s">
            $3,500 average value · 1% penetration = $490M · Census SUSB, KFF,
            Precedence Research 2025
          </span>
        </div>
      </div>
    </div>

    <p className="dk-fine">
      Health Affairs NHE Accounts 2024. KFF Employer Health Benefits Survey 2025
      — $26,993 family premium, blended across single and family enrolment.
      Mercer 2025. Wellable 2024. Shortlister 2026. Precedence Research and
      Verified Market Research 2025. Census SUSB.
    </p>
  </div>,

  /* ── 03 · why now ── */
  <div className="dk-navy dk-pad" key="i3">
    <div className="dk-eyebrow dk-eyebrow-l">Why now</div>
    <h2 className="dk-h2 dk-h2-l">
      $15B advising on $495B —
      <br />
      with a <em>structural conflict of interest.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      The broker and consultant channel is not the enemy. It is the channel.
      Axionia doesn&rsquo;t replace it — we give it, and the employers it serves,
      independent intelligence to act on.
    </p>

    <div className="dk-chain">
      <div className="dk-chain-c">
        <div className="dk-chain-n">$495B</div>
        <div className="dk-chain-k">Employer</div>
        <div className="dk-chain-v">
          ~140,000 mid-market employers making annual benefit decisions with no
          independent analysis.
        </div>
      </div>
      <div className="dk-chain-a">→</div>
      <div className="dk-chain-c">
        <div className="dk-chain-n">$15B</div>
        <div className="dk-chain-k">Broker / consultant channel</div>
        <div className="dk-chain-v">
          Annual revenue advising on those decisions, compensated largely by
          commissions on the products recommended. Provides introductions, RFP
          management, plan design, compliance and relationships. Does not
          provide independent economic analysis, bias-adjusted ROI modelling,
          transparent scenarios or de-duplicated attribution.
        </div>
      </div>
      <div className="dk-chain-a">→</div>
      <div className="dk-chain-c is-new">
        <div className="dk-chain-n">~$0</div>
        <div className="dk-chain-k">Independent intelligence</div>
        <div className="dk-chain-v">
          The market for this is essentially zero today. It is the layer that has
          never existed — transparent, economically grounded, conflict-free.
        </div>
      </div>
    </div>

    <div className="dk-partner">
      <div className="dk-gap-k">Why the moment is now</div>
      <div className="dk-gap-v">
        Cost growth at <strong>6–7% annually</strong>, the highest in fifteen
        years. GLP-1 drugs reshaping pharmacy budgets overnight.{" "}
        <strong>59% of employers making cost-cutting changes in 2026</strong>, up
        from 44% in 2024. Every employer is being forced to scrutinise spend they
        previously rubber-stamped.
        <br />
        <span className="dk-fine">
          Precedence Research 2025. Verified Market Research 2025. Shortlister
          2026. Mercer National Survey 2025.
        </span>
      </div>
    </div>
  </div>,

  /* ── 04 · workforce ── */
  <div key="i4">
    <div className="dk-eyebrow">The workforce dimension</div>
    <h2 className="dk-h2">
      The ROI of a benefit depends on
      <br />
      <em>who you&rsquo;re trying to keep.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Replacing an entry-level worker costs about 50% of salary. Replacing a
      specialised engineer costs 213%. Most employers apply the same benefit
      logic to both, because the same logic is what gets sold to them.
    </p>

    <div className="dk-grid-2">
      <div className="dk-wf">
        <div className="dk-wf-h">Knowledge / talent-retention workforce</div>
        <div className="dk-wf-s">Benefits are a competitive weapon</div>
        {[
          ["Replacement cost", "150–213% of salary"],
          ["Benefit ROI driver", "Retention and attraction"],
          ["Portability risk", "High — remote-capable"],
          ["Investment case", "Strong, with a high multiplier"],
        ].map(([k, v]) => (
          <div className="dk-wf-r" key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <div className="dk-wf">
        <div className="dk-wf-h">Manual / high-volume workforce</div>
        <div className="dk-wf-s">Benefits are a utilisation and cost story</div>
        {[
          ["Replacement cost", "50–75% of salary"],
          ["Benefit ROI driver", "Utilisation, MSK, absenteeism"],
          ["Portability risk", "Lower — location-bound"],
          ["Investment case", "Targeted and category-specific"],
        ].map(([k, v]) => (
          <div className="dk-wf-r" key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="dk-callout">
      <strong>No vendor pitch ever does this</strong> — because a vendor wants
      universal adoption, not segmented logic. As AI reshapes which roles are
      genuinely scarce, as demographics tighten skilled-trade supply, and as
      remote work makes knowledge workers portable, the benefit ROI calculus is
      shifting for almost every employer. Axionia models investment by workforce
      segment, predicts how the need changes as composition shifts, and aligns
      benefit strategy to actual talent economics.
    </div>

    <p className="dk-fine">
      Replacement cost ranges: CAP, Gallup, SHRM. Workforce portability: Korn
      Ferry 2025. Knowledge-worker scarcity: Deloitte 2024 Gen Z &amp;
      Millennial Survey.
    </p>
  </div>,

  /* ── 05 · the solution ── */
  <div className="dk-navy dk-pad" key="i5">
    <div className="dk-eyebrow dk-eyebrow-l">The solution</div>
    <h2 className="dk-h2 dk-h2-l">
      Not a broker. Not a consultant.
      <br />
      <em>A transparent decision layer.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      An AI-native decision intelligence platform for healthcare benefit
      evaluation. Five things it does that nothing currently in the chain does.
    </p>
    <div className="dk-grid-2 dk-tight">
      {FIVE.map(([n, k, v]) => (
        <div className="dk-gap" key={n}>
          <div className="dk-gap-k">
            {n} — {k}
          </div>
          <div className="dk-gap-v">{v}</div>
        </div>
      ))}
    </div>
    <div className="dk-partner">
      <div className="dk-gap-k">Current focus</div>
      <div className="dk-gap-v">
        Not building a massive SaaS platform. Building{" "}
        <strong>repeatable intelligence workflows</strong>, producing{" "}
        <strong>outstanding decision reports</strong>, and{" "}
        <strong>validating demand with real customers</strong>. The methodology
        is the company.
      </div>
    </div>
  </div>,

  /* ── 06 · the demo ──
     The same component the buyer deck renders. The original investor deck
     carried its own five-screen cut, which was an older and shorter version of
     this — two demos of one product, drifting apart, and the investor seeing
     less than the customer does. */
  <div key="i6">
    <div className="dk-eyebrow">Live demo — Axionia Insight</div>
    <h2 className="dk-h2">
      One vendor, taken apart.
      <br />
      <em>Then all eight at once.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Meridian Manufacturing evaluates a virtual MSK program its broker wants
      signed in fourteen days. This is the same walkthrough a prospective
      customer sees — there isn&rsquo;t an investor version.
    </p>

    <DeckFlow />

    <p className="dk-fine">
      Illustrative throughout. Meridian is a composite employer and every figure
      on these screens is an example rather than a client result. Simulation,
      sensitivity, peer benchmarking, the vendor landscape and continuous
      monitoring are in build.
    </p>
  </div>,

  /* ── 07 · the founder ── */
  <div key="i7">
    <div className="dk-eyebrow">The founder</div>
    <h2 className="dk-h2">
      Twenty years doing this work
      <br />
      <em>from inside the industry.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      The methodology isn&rsquo;t theoretical. It comes from two decades of
      building and selling analytical models across payer, provider, pharma and
      consulting — and from five exits watched from the inside, none of them as
      the founder, which is a different and more useful vantage point for a
      company whose product is analytical judgment.
    </p>

    <div className="dk-exits">
      <div className="dk-exits-k">Exits participated in</div>
      {[
        ["Enclarity", "LexisNexis Risk Solutions", "2013"],
        ["MMS", "Genoa Healthcare", "—"],
        ["Genoa Healthcare", "Optum", "2018"],
        ["Quartet Health", "NeuroFlow", "2025"],
        ["ETS", "Employee number two", "—"],
      ].map(([who, to, when]) => (
        <div className="dk-exits-r" key={who}>
          <span className="dk-exits-n">{who}</span>
          <span className="dk-exits-a">{to}</span>
          <span className="dk-exits-y">{when}</span>
        </div>
      ))}
    </div>

    <div className="dk-bio">
      <div className="dk-bio-who">
        <div className="dk-bio-av">TD</div>
        <div className="dk-bio-n">Thomas Dow</div>
        <div className="dk-bio-sub">
          Founder, Axionia · SVP Analytics, WIN · Principal, CareVisory
        </div>
        <div className="dk-bio-ed">
          Yale MBA · UCLA M.S. Biostatistics · St. Olaf B.A. Math, Economics,
          Statistics
        </div>
        <div className="dk-bio-tags">
          {[
            "Health economics",
            "Actuarial modelling",
            "Fraud detection",
            "Value-based care design",
            "$500M deals underwritten",
            "Peer-reviewed research",
          ].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      <div className="dk-bio-career">
        {CAREER.map(([when, role, where]) => (
          <div className="dk-bio-job" key={when}>
            <div className="dk-bio-when">{when}</div>
            <div>
              <div className="dk-bio-role">{role}</div>
              <div className="dk-bio-where">{where}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>,

  /* ── 08 · current focus ── */
  <div key="i8">
    <div className="dk-eyebrow">Current focus</div>
    <h2 className="dk-h2">
      Five priorities. No giant SaaS build.
      <br />
      <em>The methodology is the company.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Pre-seed. The immediate objective is demonstrating the methodology, not
      shipping software.
    </p>
    <div className="dk-grid-2">
      {FOCUS.map(([n, k, v]) => (
        <div className="dk-foc" key={n}>
          <div className="dk-foc-n">{n}</div>
          <div>
            <div className="dk-foc-k">{k}</div>
            <div className="dk-foc-v">{v}</div>
          </div>
        </div>
      ))}
    </div>
  </div>,

  /* ── 09 · business model ── */
  <div key="i9">
    <div className="dk-eyebrow">Business model</div>
    <h2 className="dk-h2">
      Services-funded. Capital-efficient.
      <br />
      <em>The moat compounds.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Not venture-dependent. Phase 1 generates real revenue while building the
      methodology, data assets and reference clients that fund the platform.
    </p>

    <div className="dk-grid-3">
      {PHASES.map((p) => (
        <div className="dk-phase" key={p.n}>
          <div className="dk-phase-n">{p.n}</div>
          <div className="dk-phase-t">{p.t}</div>
          <div className="dk-ph-d">{p.d}</div>
          <div className="dk-ph-t">{p.target}</div>
          {p.items.map((it) => (
            <div className="dk-ph-i" key={it}>
              {it}
            </div>
          ))}
          <div className="dk-ph-g">{p.goal}</div>
        </div>
      ))}
    </div>

    <div className="dk-callout">
      <strong>The key insight.</strong> We are not selling analytics, AI or
      dashboards. We are selling <strong>confidence in high-cost healthcare
      decisions</strong>. A large employer can make $5M–$50M mistakes on
      fertility, oncology, MSK, mental health, PBMs and plan design. If Axionia
      helps avoid even one of them, $100K pricing feels cheap.
    </div>
  </div>,

  /* ── 09b · use of funds (only once the numbers exist) ──
     Sits here on purpose: after the business model has said what the company
     does with revenue, before the financial slide asks the reader to value it.
     The money question gets answered before the return question is asked. */
  ...(FUNDS
    ? [
        <div key="i9b">
          <div className="dk-eyebrow">Use of funds</div>
          <h2 className="dk-h2">
            What the $1.0M buys,
            <br />
            and <em>how long it lasts.</em>
          </h2>
          <p className="dk-sub dk-sub-tight">
            {FUNDS.months} months on this raise alone, against a Phase 1 that is
            already generating revenue. The point of the money is not survival —
            it is reaching the evidence that prices the next round, or reaching
            profitability without one.
          </p>

          <div className="dk-tam">
            {FUNDS.allocation.map((a) => (
              <div className="dk-tam-r" key={a.area}>
                <div className="dk-tam-k">
                  <span className="dk-tam-lbl">{a.area}</span>
                  <span className="dk-tam-n">{a.amount}</span>
                </div>
                <div className="dk-tam-v">{a.buys}</div>
              </div>
            ))}
          </div>

          <div className="dk-grid-2 dk-tight">
            <div className="dk-note-blue">
              <div className="dk-led-h dk-blue">What&rsquo;s true when it&rsquo;s spent</div>
              {FUNDS.proves.map((p) => (
                <div key={p}>{p}</div>
              ))}
            </div>
            <div className="dk-note-gray">
              <div className="dk-led-h">If Phase 1 revenue misses</div>
              {FUNDS.floor}
            </div>
          </div>
        </div>,
      ]
    : []),

  /* ── 10 · financial backup ──
     The Year 3 and Year 4 revenue strip is new. The valuation slide computes
     multiples off $4.4M and $11.2M, and neither number appeared anywhere in
     the deck — so the arithmetic on the next slide rested on figures the reader
     had never been shown. Both come from the same model, nothing is invented
     here; they were simply never displayed. */
  <div key="i10">
    <div className="dk-eyebrow">Financial backup — the base case</div>
    <h2 className="dk-h2">
      Three scenarios. We&rsquo;re underwriting
      <br />
      the <em>disciplined one.</em>
    </h2>
    {/* "Divergence starts only after a single falsifiable milestone" was the
        academic register creeping in. The idea is the best one in the deck and
        it survives; what changed is that it now names the event in the language
        someone would use out loud. */}
    <p className="dk-sub dk-sub-tight">
      All three share an identical Year 1–3 build, funded entirely by the $1M
      raised now. Nothing in this ask assumes channel or data revenue before it
      is proven. The three only separate after one thing happens or doesn&rsquo;t:
      somebody outside this company pays for the benchmark data.
    </p>

    {/* Scenario cards AND return on capital, from one component.

        Two things were wrong before. The slide showed founder ownership under
        all three scenarios and never once showed the investor's — the number
        the person reading it is actually solving for. And the cards were static
        markup here while a second Bear/Base/Bull tab strip lived inside the
        block below, so one choice had two controls and the visible one did
        nothing.

        The cards now own the selection, which also means the scenario data
        lives in exactly one place. Everything derived from it is arithmetic on
        figures the deck already states, except the exit multiple, which the
        reader sets — see the header in InvestorReturn.tsx for why 5× is the
        default and why the range stops at 8×. */}
    <InvestorReturn />

    {/* The Series A reframed as optional.

        The deck presented it as a milestone-triggered necessity while the model
        underneath said every scenario is EBIT-positive from Year 2 — including
        Bear, which raises nothing further. Those two statements were in the
        same deck and quietly contradicted each other, which is what made the
        gate read as arbitrary: a hurdle to clear rather than a choice to make.

        Stated as a choice it does more work. It is the thing that makes Bear
        credible instead of sad, and "we don't have to raise again" is a
        stronger sentence at pre-seed than any use of proceeds. */}
    <div className="dk-callout">
      <strong>Why Base is the conservative case.</strong> It is not the
      optimistic scenario — it is the one we are asking investors to underwrite
      precisely because it depends on the least. It assumes zero channel or data
      revenue until somebody outside the company pays for the benchmark data,
      rather than assuming a trajectory. Bull exists to show the ceiling and is
      not what the valuation assumes.
      <br />
      <br />
      <strong>And the Series A is optional, not required.</strong> All three
      cases turn EBIT-positive by Year 2, Bear included — so this round is not
      buying runway to the next one, it is buying the bridge to profitability.
      We raise again if the benchmark data sells, because at that point capital
      buys something it could not buy before. If it doesn&rsquo;t, we don&rsquo;t,
      and you own {"14.29%"} of a company throwing off $11.4M a year. That is
      the floor, and a floor is different from a failure case.
    </div>
  </div>,

  /* ── 11 · valuation ── */
  <div className="dk-navy dk-pad" key="i11">
    <div className="dk-eyebrow dk-eyebrow-l">Valuation backup</div>
    <h2 className="dk-h2 dk-h2-l">
      $6.0M pre-money — and why
      <br />
      the markup is <em>credible rather than asserted.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      $1.0M raised at $6.0M pre-money, $7.0M post. Grounded in 2026 market
      benchmarks.
    </p>

    {/* Three across, not four in a 2×2.
        The fourth card was the benchmark-data trigger, which is the strongest
        idea on the slide and was sitting in a quarter tile looking like an
        afterthought. It is now the band underneath, at full width.

        The founder card no longer claims repeat-founder status. The old copy
        cited "strong repeat founders command $8–10M caps" as the comparison,
        which implies a thing that isn't true of Tom and would be checked. Five
        exits from the inside is both accurate and, for a company whose product
        is analytical judgment, the more relevant credential — the operator who
        built the models is a different bet from the founder who sold twice. */}
    <div className="dk-grid-3 dk-tight">
      <div className="dk-gap">
        <div className="dk-gap-k">Priced against the market</div>
        <div className="dk-gap-v">
          $1.0M is pre-seed-sized rather than full-seed — 2026 seed medians run
          $3.1M+. Pre-seed post-money benchmarks span $3M–$10M, and $7.0M sits
          mid-band rather than at the aggressive edge.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">Priced against the operator</div>
        <div className="dk-gap-v">
          Not a repeat founder — an operator through{" "}
          <strong>five exits from the inside</strong>: Enclarity to LexisNexis,
          MMS to Genoa, Genoa to Optum, Quartet to NeuroFlow, and employee two at
          ETS. Twenty years of healthcare analytics, a Yale MBA and $500M+ in
          underwritten risk products.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">Priced against what exists</div>
        <div className="dk-gap-v">
          A working research pipeline and live discovery engagements, not just a
          deck. 2026 pre-seed investors increasingly expect a functional product
          at this stage, and there is one — you just clicked through it.
        </div>
      </div>
    </div>

    <div className="dk-trigger">
      <div className="dk-trigger-k">What triggers the next round</div>
      <div className="dk-trigger-v">
        One event, and it is allowed to fail:{" "}
        <strong>somebody outside this company pays for the benchmark data.</strong>{" "}
        Until it does, no further capital is raised and the company runs Bear —
        profitable from Year 2, undiluted, smaller on purpose. When it does, the
        Series A becomes worth taking, and it is priced off proof rather than
        off a projection. That is the evidence a revenue multiple alone
        can&rsquo;t capture, and the reason the markup below is arithmetic
        rather than an assertion.
      </div>
    </div>

    <div className="dk-ramp">
      <div className="dk-ramp-k">Base case revenue ramp</div>
      {[
        ["Year 3", "$4.4M"],
        ["Year 4", "$11.2M"],
        ["Year 7", "$48.0M"],
      ].map(([k, v]) => (
        <div className="dk-ramp-c" key={k}>
          <span className="dk-ramp-l">{k}</span>
          <span className="dk-ramp-v">{v}</span>
        </div>
      ))}
      <div className="dk-ramp-c is-note">
        <span className="dk-ramp-l">Year 3 → 4 growth</span>
        <span className="dk-ramp-v">~154%</span>
      </div>
    </div>

    <div className="dk-mult">
      <div className="dk-mult-r is-head">
        <span>Basis</span>
        <span>Multiple</span>
        <span>Implied pre-money</span>
      </div>
      <div className="dk-mult-r">
        <span>Trailing Year-3 revenue ($4.4M)</span>
        <span>8–10×</span>
        <span>$35–44M</span>
      </div>
      <div className="dk-mult-r">
        <span>Forward Year-4 revenue ($11.2M)</span>
        <span>3.5–4×</span>
        <span>$39–45M</span>
      </div>
      <div className="dk-mult-r is-total">
        <span>
          Year-3 → Year-4 growth of ~154% clears the 40% threshold that commands
          top-of-range multiples. Both methods bracket the modelled Series A
          pre-money almost exactly.
        </span>
        <span />
        <span>$40M</span>
      </div>
    </div>

    <p className="dk-fine">
      The path, priced: seed at $1.0M on $6.0M pre / $7.0M post. Series A when
      the data sells, ~$15.0M on $40.0M pre / $55.0M post — landing almost
      exactly on the 2026 Series A post-money median. Every number here is
      sourced rather than asserted; full comps available on request.
    </p>
  </div>,

  /* ── 12 · the ask ──
     The original headlined this slide with "we tell you what we think — but we
     expose the entire model", which is the methodology promise rather than the
     ask, and the actual number appeared only on the valuation slide. A reader
     who skips to the last page should find what is being asked for on it. The
     promise survives as the closing line, where it is a sign-off rather than a
     substitute for the ask. */
  <div className="dk-navy dk-pad" key="i12">
    <div className="dk-eyebrow dk-eyebrow-l">The ask</div>
    <h2 className="dk-h2 dk-h2-l">
      $1.0M at $6.0M pre-money.
      <br />
      <em>We&rsquo;re looking for first believers.</em>
    </h2>
    <div className="dk-asks">
      {[
        ["01", "What the round is", "Pre-seed, concept stage. The thesis is clear, the methodology is built, and the founder has spent twenty years inside the problem. We're looking for partners who see the market and want to help shape what this becomes."],
        ["02", "What we're not doing", "Building a giant SaaS platform. Hiring ahead of validation. Over-engineering before there are customers. At this stage the methodology is the company, and every dollar goes to proving it."],
        ["03", "The $495B question", "Healthcare benefit purchasing is the largest recurring financial decision most mid-market companies make, and it is almost entirely driven by vendor narratives and misaligned incentives. The independent intelligence layer has never existed. We're building it."],
      ].map(([n, t, d]) => (
        <div className="dk-ask" key={n}>
          <div className="dk-ask-n">{n}</div>
          <div>
            <div className="dk-ask-t">{t}</div>
            <div className="dk-ask-d">{d}</div>
          </div>
        </div>
      ))}
    </div>
    <blockquote className="dk-quote dk-quote-l">
      We tell you what we think — but we expose the entire model.
    </blockquote>
    <div className="dk-site">Thomas Dow · thomas@axionia.com · axionia.com</div>
  </div>,
];
