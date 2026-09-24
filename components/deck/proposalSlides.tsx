import type { ProposalCustom } from "@/lib/deck/proposalCustom";

/**
 * The proposal deck. One client, sent a real commercial offer.
 *
 * ── Ported, not imported, like founders and investor ──
 *
 * The source material for this deck arrived as a standalone HTML mock with
 * its own colour variables and its own type scale — the same shape
 * investorSlides.tsx describes porting away from, for the same reason: a
 * deck that disagrees with axionia.com about what blue is has already told
 * a client something. Every class below is one deck.css already defines.
 *
 * ── Why there's almost nothing to tailor ──
 *
 * The buyer deck patches a headline, a sub and an inserted slide — three
 * things, reviewable in a minute (lib/deck/custom.ts). This patches one:
 * the client's name on the cover. Everything else a prospect reads here is
 * the same offer every founding-cohort company gets, because it is the
 * same offer — the scope, the phases, what's asked of them, the terms. A
 * proposal that improvised its scope per recipient would be promising
 * something the delivery team never agreed to.
 *
 * ── Where the price lives, and why it isn't here ──
 *
 * This deck takes NO fee figure as a prop that isn't already sourced from
 * companies.founding_cohort / fee_rate. See lib/deck/proposalCustom.ts and
 * the migration 040 header — the number belongs to the Terms panel, once,
 * and this renders whatever it currently says rather than a copy of it
 * that could drift out of date the next time Tom changes the rate.
 */

export type ProposalTerms = {
  foundingCohort: boolean;
  /** Fraction, e.g. 0.0075. Null means offered the terms but the rate isn't agreed yet. */
  feeRate: number | null;
  /** "January 2027", already formatted — see lib/foundingCohort.ts. */
  conversionLabel: string;
  seatsTaken: number;
  seatsCap: number;
};

const PHASES = [
  {
    n: "Phase 1 of 3",
    t: "Intake",
    time: "1–2 weeks",
    what: "Data collection, scope confirmation, outcome-weight calibration.",
    role: "Your role: return three intake spreadsheets, join a 60-minute kickoff call.",
  },
  {
    n: "Phase 2 of 3",
    t: "Analysis",
    time: "2–3 weeks",
    what: "Independent scoring, scenario modelling, population fit, vendor landscape, peer benchmarking.",
    role: "Your role: available for clarifying questions. No action required.",
  },
  {
    n: "Phase 3 of 3",
    t: "Delivery",
    time: "1 week",
    what: "The Axionia report, delivered via secure login. A 90-minute readout call.",
    role: "Your role: attend the readout. CFO participation strongly recommended.",
  },
];

const WHAT_YOU_GET = [
  ["Independent scoring", "Every active benefit program scored against the same framework — economic impact, attribution confidence, vendor transparency, and more."],
  ["Scenario-modelled ranges", "Savings estimates calibrated to your actual population, given as a range — never a single point estimate standing in for one."],
  ["Vendor claims checked", "Overlapping claims de-duplicated and bias-adjusted, with where a number diverges from the vendor's own claim, and why."],
  ["Peer benchmarking", "Compared against comparable employers, with a ranked, CFO-ready portfolio summary."],
  ["A fully open model", "Every assumption and adjustment behind the report is visible and documented. You can inspect and challenge any number in it."],
  ["Vendor monitoring after delivery", "The relationship doesn't end at the readout — see the next slide for what continues and when a fee starts."],
];

const NEED_DATA = [
  ["Benefit programs & cost structure", "Required — one row per active program: vendor, pricing model, cost, enrolment, renewal date, vendor-claimed ROI."],
  ["Workforce & population profile", "Required — headcount, industry, geography, age and job-type mix, plan type."],
  ["Utilization & claims", "Optional, high value — medical and Rx spend, top condition categories. Even aggregate totals materially improve the analysis."],
];

const NEED_TIME = [
  ["Outcome priority weighting", "Required — allocate priority across outcome dimensions so the scoring reflects what matters to you, not a default."],
  ["60-minute kickoff call", "Required — walk through the data, confirm scope, set the weights together."],
  ["90-minute readout call", "Required — CFO participation strongly recommended. This is the conversation the report is built for."],
];

const TERMS = [
  ["No contingency", "The terms below are fixed once agreed. They don't change based on which vendors score well, poorly, or get recommended for renewal."],
  ["No vendor money", "Axionia takes no compensation, commission or referral fee from any vendor named in your report. If the funding source can't be printed on page one, we don't take it."],
  ["Your data stays yours", "Used solely to build your report, never shared, sold or disclosed. Peer comparisons draw on Axionia's own aggregated benchmark library, not your submissions."],
  ["A fully open model", "Every assumption and adjustment in the report is visible and documented — inspect and challenge any number."],
];

/**
 * The Investment slide's numbers, entirely.
 *
 * Three states, not two — `founding_cohort = true, fee_rate = null` is a
 * real, distinct state per the 039 header (offered the terms, rate not
 * agreed yet), and collapsing it into "not set" would say something false
 * about whether the offer stands.
 */
function investmentCopy(terms: ProposalTerms, clientLabel: string) {
  if (!terms.foundingCohort) {
    return {
      commitment: "By agreement",
      commitmentDetail: "Founding-cohort terms aren't set for this account yet.",
      after: "Discussed directly",
      afterDetail: "Priced against verified savings, never a share of spend — the same basis as every founding relationship, confirmed together before anything starts.",
      seats: `${terms.seatsTaken}/${terms.seatsCap}`,
      seatsDetail: "Founding seats claimed so far.",
    };
  }
  return {
    commitment: "Free",
    commitmentDetail: `Through ${terms.conversionLabel}. No fee for ${clientLabel} before then.`,
    after:
      terms.feeRate != null
        ? `${(terms.feeRate * 100).toFixed(2).replace(/\.?0+$/, "")}%`
        : "Agreed together",
    afterDetail:
      terms.feeRate != null
        ? `Of verified savings, held for the term. Not a percentage of spend.`
        : `The rate isn't set yet — agreed once we've verified what the analysis finds, and it is never a percentage of spend.`,
    seats: `${terms.seatsTaken}/${terms.seatsCap}`,
    seatsDetail: "Founding seats claimed. This would be one of them.",
  };
}

export function buildProposalSlides(custom: ProposalCustom, terms: ProposalTerms) {
  const clientName = custom.clientName?.trim();
  const clientLabel = clientName || "your company";
  const inv = investmentCopy(terms, clientLabel);

  return [
    /* ── 00 · cover ── */
    <div className="dk-navy dk-cover" key="p0">
      <span className="dk-orb dk-orb-a" />
      <span className="dk-orb dk-orb-b" />
      <div className="dk-cover-in">
        <div className="dk-eyebrow dk-eyebrow-l">
          {clientName ? `Prepared for ${clientName}` : "Proposal"}
        </div>
        <h1 className="dk-h1">
          A proposal to put your benefit portfolio
          <br />
          <em>through an independent test.</em>
        </h1>
        <p className="dk-sub dk-sub-l">
          What the relationship includes, what we ask of you to start, and what
          it costs — a fixed-fee, independent analysis your CFO can stand
          behind. No vendor studies, no commissions.
        </p>
        <div className="dk-partner">
          <div className="dk-gap-k">Confidential &amp; proprietary</div>
          <div className="dk-gap-v">
            Prepared exclusively for {clientLabel}, for the purpose of
            evaluating this engagement. Not for further distribution.
          </div>
        </div>
      </div>
    </div>,

    /* ── 01 · the engagement ── */
    <div className="dk-navy dk-pad" key="p1">
      <div className="dk-eyebrow dk-eyebrow-l">The engagement</div>
      <h2 className="dk-h2 dk-h2-l">
        Three phases.
        <br />
        <em>About four to six weeks,</em> start to finish.
      </h2>
      <p className="dk-sub dk-sub-l">
        One report, built on your actual programs and workforce. Here's what
        happens at each stage, and what's on you.
      </p>
      <div className="dk-grid-3">
        {PHASES.map((p) => (
          <div className="dk-phase" key={p.n}>
            <div className="dk-phase-n">{p.n}</div>
            <div className="dk-phase-t">{p.t}</div>
            <div className="dk-ph-t">{p.time}</div>
            <div className="dk-ph-d">{p.what}</div>
            <div className="dk-ph-i">{p.role}</div>
          </div>
        ))}
      </div>
    </div>,

    /* ── 02 · what you get ── */
    <div key="p2">
      <div className="dk-eyebrow">What you get</div>
      <h2 className="dk-h2">
        One report. <em>Everything visible,</em> nothing assumed.
      </h2>
      <div className="dk-grid-2 dk-tight">
        {WHAT_YOU_GET.map(([k, v]) => (
          <div className="dk-gap" key={k}>
            <div className="dk-gap-k">{k}</div>
            <div className="dk-gap-v">{v}</div>
          </div>
        ))}
      </div>
    </div>,

    /* ── 03 · what we need from you ── */
    <div key="p3">
      <div className="dk-eyebrow">The ask</div>
      <h2 className="dk-h2">
        What we need <em>from you</em> to start.
      </h2>
      <p className="dk-sub dk-sub-tight">
        Three spreadsheets, one calibration exercise, two calls. Most of it
        pulls straight from HR records or your benefits administration
        system.
      </p>
      <div className="dk-grid-2">
        <div>
          <div className="dk-led-h">Data — three Excel files</div>
          {NEED_DATA.map(([k, v]) => (
            <div className="dk-led" key={k}>
              <span className="dk-blue">·</span>
              <span>
                <strong>{k}.</strong> {v}
              </span>
            </div>
          ))}
        </div>
        <div>
          <div className="dk-led-h">Calibration &amp; time</div>
          {NEED_TIME.map(([k, v]) => (
            <div className="dk-led" key={k}>
              <span className="dk-blue">·</span>
              <span>
                <strong>{k}.</strong> {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,

    /* ── 04 · investment ──
       Every number on this slide comes from `terms`, read live from
       companies.founding_cohort / fee_rate at render time — see the header
       and lib/deck/proposalCustom.ts. Nothing here is typed per version. */
    <div key="p4">
      <div className="dk-eyebrow">Investment</div>
      <h2 className="dk-h2">
        A founding relationship.
        <br />
        <em>Priced against what we verify,</em> never against spend.
      </h2>
      <div className="dk-mer">
        <div className="dk-mer-c">
          <div className="dk-mer-k dk-blue">Now</div>
          <div className="dk-mer-n dk-blue">{inv.commitment}</div>
          <div className="dk-mer-d">{inv.commitmentDetail}</div>
        </div>
        <div className="dk-mer-c">
          <div className="dk-mer-k">After</div>
          <div className="dk-mer-n">{inv.after}</div>
          <div className="dk-mer-d">{inv.afterDetail}</div>
        </div>
        <div className="dk-mer-c">
          <div className="dk-mer-k dk-green-d">Seats</div>
          <div className="dk-mer-n dk-green">{inv.seats}</div>
          <div className="dk-mer-d">{inv.seatsDetail}</div>
        </div>
      </div>
      <div className="dk-callout">
        <strong>What this means in practice.</strong> The analysis starts now,
        at no cost, and includes vendor monitoring through{" "}
        {terms.foundingCohort ? terms.conversionLabel : "the founding term"}.
        There is no invoice before then. What comes after is a rate we agree
        on together, held for the term — the same basis published at
        axionia.com/pricing, and never a share of what you spend.
      </div>
    </div>,

    /* ── 05 · independence & terms ── */
    <div className="dk-navy dk-pad" key="p5">
      <div className="dk-eyebrow dk-eyebrow-l">Independence, in writing</div>
      <h2 className="dk-h2 dk-h2-l">
        We're paid the <em>same amount</em>
        <br />
        no matter what we find.
      </h2>
      <div className="dk-grid-3 dk-tight">
        {TERMS.map(([k, v]) => (
          <div className="dk-gap" key={k}>
            <div className="dk-gap-k">{k}</div>
            <div className="dk-gap-v">{v}</div>
          </div>
        ))}
      </div>
    </div>,

    /* ── 06 · next steps ── */
    <div className="dk-navy dk-pad" key="p6">
      <div className="dk-eyebrow dk-eyebrow-l">Next steps</div>
      <h2 className="dk-h2 dk-h2-l">
        Four steps <em>to a kickoff date.</em>
      </h2>
      <div className="dk-asks">
        <div className="dk-ask">
          <div className="dk-ask-n">01</div>
          <div>
            <div className="dk-ask-t">Confirm scope and sign</div>
            <div className="dk-ask-d">
              A short engagement letter — no fee due at signing.
            </div>
          </div>
        </div>
        <div className="dk-ask">
          <div className="dk-ask-n">02</div>
          <div>
            <div className="dk-ask-t">Return the intake spreadsheets</div>
            <div className="dk-ask-d">
              Benefit programs, workforce profile, and — if available —
              utilization data.
            </div>
          </div>
        </div>
        <div className="dk-ask">
          <div className="dk-ask-n">03</div>
          <div>
            <div className="dk-ask-t">Kickoff call</div>
            <div className="dk-ask-d">
              60 minutes to confirm scope and set the outcome weights.
            </div>
          </div>
        </div>
        <div className="dk-ask">
          <div className="dk-ask-n">04</div>
          <div>
            <div className="dk-ask-t">Report delivered, 4–6 weeks later</div>
            <div className="dk-ask-d">
              Secure login access, plus a 90-minute readout with your team.
            </div>
          </div>
        </div>
      </div>
      <p className="dk-fine">
        Thomas Dow · tom@axionia.com · axionia.com
      </p>
    </div>,
  ];
}
