/**
 * Axionia Research module — data layer public surface.
 *
 * Pure data and pure functions only. Nothing here imports React, Next, Supabase
 * or fetch, so it is safe in a server action, an API route, a script, or a
 * client component. That constraint is the module boundary — keep it.
 *
 * Ported from axionia-app src/App.js as step 1 of moving the research pipeline
 * into the site. The pipeline itself (prompts, waves, scoring calls) is not here
 * yet; this is the inert half.
 */

import { BENEFITS, BENEFITS_BY_ID } from "./benefits";
import { SEGMENTS, SEGMENTS_BY_ID } from "./segments";
import { VENDORS, VENDORS_BY_ID, BENEFIT_VENDORS, FERTILITY_VENDORS } from "./vendors";
import { MANDATES } from "./mandates";
import type {
  Benefit,
  BenefitVendorWithVendor,
  Mandate,
  SegmentBenefits,
  Urgency,
} from "./types";

export * from "./types";
export { BENEFITS, BENEFITS_BY_ID } from "./benefits";
export { SEGMENTS, SEGMENTS_BY_ID } from "./segments";
export { VENDORS, VENDORS_BY_ID, BENEFIT_VENDORS, FERTILITY_VENDORS } from "./vendors";
export { MANDATES } from "./mandates";
export {
  AXES,
  AXES_BY_KEY,
  RATIONALE_KEYS,
  SCORE_BANDS,
  AXIS_WEIGHTS,
  TOTAL_RELATIVE_WEIGHT,
  bandForScore,
  computeOverallScore,
  overallScoreDrift,
} from "./axes";
export * from "./tokens";
export {
  validateResearchData,
  isResearchDataValid,
  formatDataIssues,
  type DataIssue,
  type IssueSeverity,
} from "./validate";

// ── Benefit / segment lookups ────────────────────────────────────────────────

/**
 * Benefits for a segment, split by value tier.
 *
 * Returns a null segment with empty tiers for an unknown ID rather than
 * throwing — a missing segment should degrade the report, not fail the run.
 */
export function getSegmentBenefits(segmentId: string): SegmentBenefits {
  const segment = SEGMENTS_BY_ID.get(segmentId);
  if (!segment) return { segment: null, high: [], medium: [], low: [] };

  const lookup = (ids: readonly string[]): Benefit[] =>
    ids.map((id) => BENEFITS_BY_ID.get(id)).filter((b): b is Benefit => Boolean(b));

  return {
    segment,
    high: lookup(segment.highValueBenefits),
    medium: lookup(segment.mediumValueBenefits),
    low: lookup(segment.lowValueBenefits),
  };
}

/** Vendors serving a benefit, with the full vendor record joined on. */
export function getVendorsForBenefit(benefitId: string): BenefitVendorWithVendor[] {
  return BENEFIT_VENDORS.filter((bv) => bv.benefitId === benefitId)
    .map((bv) => {
      const vendor = VENDORS_BY_ID.get(bv.vendorId);
      return vendor ? { ...bv, vendor } : null;
    })
    .filter((bv): bv is BenefitVendorWithVendor => bv !== null);
}

/**
 * Which workforce segments to model for an industry, most relevant first.
 *
 * Ordering matters downstream: the Benefit Design tab takes the first three and
 * assigns Critical / High / Medium priority in that order.
 */
export function getSegmentsForIndustry(industry: string | null | undefined): string[] {
  const ind = (industry ?? "").toLowerCase();
  const has = (...terms: string[]) => terms.some((t) => ind.includes(t));

  // Clinical / physician-heavy employers.
  if (has("dental", "dso", "physician", "surgery")) {
    return ["SEG001", "SEG002", "SEG003", "SEG004", "SEG005"];
  }
  // Home care / community health / direct care — frontline-heavy, no physician segment.
  if (has("home care", "home health", "personal care", "community health", "direct care", "caregiver")) {
    return ["SEG003", "SEG002", "SEG004", "SEG005"];
  }
  // Hospital / health system — full clinical mix.
  if (has("hospital", "health system", "medical center")) {
    return ["SEG001", "SEG002", "SEG003", "SEG004", "SEG005"];
  }
  // General healthcare / clinic / behavioral health.
  if (has("health", "clinic", "therapy", "rehab")) {
    return ["SEG002", "SEG003", "SEG004", "SEG005"];
  }
  // Tech / software / knowledge workers.
  if (has("tech", "software", "saas", "data")) {
    return ["SEG005", "SEG004", "SEG002"];
  }
  // Manufacturing / warehouse / industrial.
  if (has("manufact", "warehouse", "logistics", "distribution")) {
    return ["SEG003", "SEG004", "SEG005"];
  }
  // Retail / hospitality / food service — frontline-heavy.
  if (has("retail", "hospitality", "restaurant", "food")) {
    return ["SEG003", "SEG004", "SEG005"];
  }
  // Financial / professional services.
  if (has("financial", "insurance", "consulting", "legal")) {
    return ["SEG005", "SEG004", "SEG002"];
  }
  // Education.
  if (has("education", "school", "university")) {
    return ["SEG002", "SEG004", "SEG005"];
  }
  // Default — admin + frontline + operations.
  return ["SEG004", "SEG003", "SEG005"];
}

// ── Mandate lookups ─────────────────────────────────────────────────────────

const URGENCY_ORDER: Record<Urgency, number> = { High: 0, Medium: 1, Low: 2 };

/** Mandates for a set of states, most urgent first. */
export function getMandatesForStates(
  states: readonly string[] = [],
  urgencyFilter: Urgency | null = null,
): Mandate[] {
  const wanted = new Set(states.map((s) => s.toUpperCase().trim()));
  return MANDATES.filter(
    (m) => wanted.has(m.state.toUpperCase()) && (!urgencyFilter || m.urgency === urgencyFilter),
  ).sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2));
}

/** Same set, grouped by category. */
export function getMandatesByCategory(
  states: readonly string[] = [],
): Record<string, Mandate[]> {
  const grouped: Record<string, Mandate[]> = {};
  for (const m of getMandatesForStates(states)) {
    (grouped[m.category] ??= []).push(m);
  }
  return grouped;
}

/**
 * Mandates that reach self-insured ERISA plans, split by how far.
 *
 * Called out as its own function because it is the compliance fact most likely
 * to be missed: employers generally assume ERISA preemption covers them, and
 * for most mandates it does. The exceptions are what's worth a conversation.
 *
 * `full` and `partial` are returned separately on purpose — see
 * SelfInsuredReach. Presenting a partial-reach parity mandate as a hard
 * self-insured obligation is an overstatement, and overstating compliance risk
 * to a CFO is exactly the vendor behaviour Axionia exists to correct.
 */
export function getSelfInsuredMandates(states: readonly string[] = []): {
  full: Mandate[];
  partial: Mandate[];
} {
  const relevant = getMandatesForStates(states);
  return {
    full: relevant.filter((m) => m.selfInsured === true),
    partial: relevant.filter((m) => m.selfInsured === "partial"),
  };
}

/**
 * Anything a self-insured employer cannot simply set aside — full reach plus
 * partial. Use when you need one list; use getSelfInsuredMandates when the
 * distinction needs to be visible to the reader.
 */
export function getMandatesTouchingSelfInsured(
  states: readonly string[] = [],
): Mandate[] {
  return getMandatesForStates(states).filter((m) => m.selfInsured !== false);
}

/** Every state the mandate library currently covers. */
export function coveredStates(): string[] {
  return [...new Set(MANDATES.map((m) => m.state))].sort();
}

// ── Model segment → library segment matching ────────────────────────────────

/**
 * The workforce step invents segments specific to the company ("Portfolio
 * Managers & Investment Principals"). The benefit library is keyed to five
 * fixed segments. Something has to bridge them, and until now nothing did:
 * Workforce Intelligence analysed the model's segments while Benefit Design
 * prescribed for library segments chosen by industry keyword. One report,
 * two different workforces.
 *
 * This matches by role vocabulary and returns a CONFIDENCE. Low confidence
 * produces no match rather than a bad one — prescribing childcare subsidies to
 * portfolio managers because both landed in "Administrative" is worse than
 * saying the library doesn't cover them.
 *
 * Known gap it exposes: all five library segments are healthcare-shaped. There
 * is no segment for highly-compensated non-clinical professionals — investment
 * staff, lawyers, engineers, senior technical. Those legitimately return null.
 */

type SegmentHint = { id: string; weight: number; terms: string[] };

const SEGMENT_HINTS: SegmentHint[] = [
  {
    id: "SEG001",
    weight: 3,
    terms: [
      "physician", "doctor", "dentist", "surgeon", "md", "dds",
      "nurse practitioner", "physician assistant", "clinician", "provider",
      "attending", "specialist",
    ],
  },
  {
    id: "SEG002",
    weight: 3,
    terms: [
      "nurse", "rn", "lpn", "hygienist", "technologist",
      "therapist", "clinical support", "medical assistant",
      "paramedic", "pharmacist", "radiolog", "sonograph", "phlebotom",
      "surgical tech", "lab tech", "pharmacy tech", "respiratory",
    ],
  },
  {
    id: "SEG003",
    weight: 3,
    terms: [
      "aide", "cna", "caregiver", "frontline", "front line", "hourly",
      "associate", "operator", "warehouse", "retail", "cashier", "driver",
      "production", "assembly", "line worker", "shift worker", "field",
      "janitor", "food service", "housekeep", "laborer", "picker", "packer",
      // Industrial trades. "technician" on its own is ambiguous — a maintenance
      // technician is industrial, not clinical — so the trades are listed here
      // and SEG002 requires clinical vocabulary.
      "maintenance", "mechanic", "electrician", "millwright", "machinist",
      "welder", "plumber", "hvac", "fitter", "installer", "trades",
    ],
  },
  {
    id: "SEG004",
    weight: 3,
    terms: [
      "administrative", "admin", "office", "clerical", "billing", "scheduling",
      "reception", "front desk", "customer service", "coordinator", "clerk",
      "data entry", "back office", "support staff",
    ],
  },
  {
    id: "SEG005",
    weight: 3,
    terms: [
      "manager", "supervisor", "team lead", "team leader", "foreman",
      "practice manager", "branch manager", "shift supervisor", "operations",
      "director", "head of",
    ],
  },
];

/**
 * Roles the library genuinely does not cover. Matched explicitly so they return
 * a clear "no coverage" rather than falling through to a weak keyword hit —
 * "Investment Principals" contains no library vocabulary, but "Principal"
 * shares nothing useful with "Practice Manager" either.
 */
const UNCOVERED_TERMS = [
  "portfolio manager", "investment", "principal", "partner", "analyst",
  "trader", "banker", "attorney", "lawyer", "counsel", "engineer",
  "developer", "software", "architect", "scientist", "researcher",
  "consultant", "actuary", "quant", "advisor", "wealth", "broker",
];

export interface SegmentMatch {
  segmentId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  /** Why this matched, or why nothing did. Surfaced in the report. */
  reason: string;
}

export function matchSegmentToLibrary(
  modelSegmentName: string,
  description?: string | null,
): SegmentMatch {
  const haystack = `${modelSegmentName} ${description ?? ""}`.toLowerCase();

  if (!haystack.trim()) {
    return { segmentId: null, confidence: "none", reason: "No segment name given." };
  }

  const scores = new Map<string, { score: number; hits: string[] }>();

  for (const hint of SEGMENT_HINTS) {
    let score = 0;
    const hits: string[] = [];
    for (const term of hint.terms) {
      if (haystack.includes(term)) {
        // Longer phrases are stronger evidence than single words.
        score += hint.weight * (term.includes(" ") ? 2 : 1);
        hits.push(term);
      }
    }
    if (score > 0) scores.set(hint.id, { score, hits });
  }

  const uncovered = UNCOVERED_TERMS.filter((t) => haystack.includes(t));

  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);
  const best = ranked[0];
  const runnerUp = ranked[1];

  // An uncovered professional role with only a weak library hit is the case
  // that produced nonsense before: "Investment Principals" matching
  // "Operations / Team Leaders" on the word "principal"/"operations".
  if (uncovered.length && (!best || best[1].score <= 3)) {
    return {
      segmentId: null,
      confidence: "none",
      reason:
        `No library segment covers this role type (${uncovered.slice(0, 3).join(", ")}). ` +
        "The five library segments are clinical, frontline, administrative and operations-leader; " +
        "highly-compensated non-clinical professionals are not represented.",
    };
  }

  if (!best) {
    return {
      segmentId: null,
      confidence: "none",
      reason: "No recognised role vocabulary — no library segment matched.",
    };
  }

  const [id, { score, hits }] = best;
  const margin = runnerUp ? score - runnerUp[1].score : score;

  const confidence: SegmentMatch["confidence"] =
    score >= 6 && margin >= 3 ? "high" : score >= 3 ? "medium" : "low";

  if (confidence === "low") {
    return {
      segmentId: null,
      confidence: "low",
      reason: `Weak match only (matched on "${hits[0]}") — not confident enough to prescribe.`,
    };
  }

  return {
    segmentId: id,
    confidence,
    reason: `Matched on ${hits.slice(0, 3).map((h) => `"${h}"`).join(", ")}.`,
  };
}
