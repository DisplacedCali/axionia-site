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

/**
 * Split detected states into the few worth a paragraph and the rest.
 *
 * The regulatory prompt used to ask for four categories of analysis for every
 * detected state, which produced five pages for one company. Length was only
 * half the problem: the curated mandate table renders alongside that text and
 * already carries the statute names, effective dates and ERISA reach, so most
 * of the prose was restating a table.
 *
 * Exposure is not evenly spread. A state whose mandates stop at fully insured
 * plans is one an ERISA employer can mostly set aside; a state that reaches
 * self-insured plans is one where preemption does not save them. That
 * distinction, not the number of statutes, is what earns commentary.
 *
 * Uncovered states get NO bonus on purpose. They're already surfaced as
 * `uncoveredStates` and labelled unverified in the report, and promoting the
 * model's least verifiable output to top billing would invert the point of
 * having a curated library at all.
 *
 * Deterministic: ties break on the state code, so the same input always yields
 * the same focus set and the dry run can assert on it.
 */
export function rankStatesByExposure(
  states: readonly string[] = [],
  primaryState?: string | null,
  limit = 3,
): { focus: string[]; other: string[] } {
  const seen = [...new Set(states.map((s) => s.toUpperCase().trim()).filter(Boolean))];
  const primary = primaryState?.toUpperCase().trim() ?? null;

  const score = (state: string): number => {
    const mandates = getMandatesForStates([state]);
    let n = 0;
    if (mandates.some((m) => m.selfInsured === true)) n += 100;
    if (mandates.some((m) => m.selfInsured === "partial")) n += 50;
    if (mandates.some((m) => m.urgency === "High")) n += 20;
    if (state === primary) n += 30;
    if (mandates.length) n += 10;
    return n;
  };

  const ranked = [...seen].sort((a, b) => score(b) - score(a) || a.localeCompare(b));

  return { focus: ranked.slice(0, limit), other: ranked.slice(limit) };
}

// ── Model segment → library segment matching ────────────────────────────────

/**
 * Match a model-generated workforce segment to the library.
 *
 * Scores on DIMENSIONS rather than role vocabulary. The previous keyword
 * approach failed structurally: the five original segments were named after
 * healthcare roles, so "Portfolio Managers" matched nothing while
 * "Maintenance Technicians" matched Clinical Support on the word "technician".
 *
 * What actually determines benefit economics is compensation level, work model,
 * and how hard the role is to replace. A surgeon and an investment principal
 * are both very-high-comp and hard to replace, and they want broadly the same
 * things — income protection above group caps, premium access, tax-advantaged
 * structures. Only the clinical flag separates them.
 *
 * Dimensions come from the model where it provides them (retentionRisk,
 * replacementComplexity, and comp/work inferred from the role name), so adding
 * an industry needs no new keyword list.
 */

import type { CompLevel, Replaceability, Segment, WorkModel } from "./types";

export interface InferredDimensions {
  comp: CompLevel;
  work: WorkModel;
  replaceability: Replaceability;
  licensed: boolean;
  clinical: boolean;
  supervisory: boolean;
  /** Which signals were actually present rather than defaulted. */
  observed: string[];
}

const COMP_SIGNALS: Array<[CompLevel, string[]]> = [
  ["very_high", [
    "portfolio manager", "principal", "partner", "managing director", "executive",
    "chief", "physician", "surgeon", "dentist", "attorney", "founder", "president",
    "md", "vp ", "head of",
  ]],
  ["high", [
    "engineer", "developer", "architect", "scientist", "actuary", "quant",
    "analyst", "consultant", "manager", "supervisor", "specialist", "technician",
    "electrician", "machinist", "millwright", "welder", "nurse practitioner",
    "physician assistant", "lead", "senior",
  ]],
  ["medium", [
    "nurse", "rn", "hygienist", "therapist", "technologist", "coordinator",
    "account", "sales", "marketing", "customer success",
  ]],
  ["low", [
    "assistant", "aide", "cna", "clerk", "receptionist", "associate", "operator",
    "cashier", "warehouse", "picker", "packer", "janitor", "housekeep", "server",
    "entry", "helper", "labor",
  ]],
];

const WORK_SIGNALS: Array<[WorkModel, string[]]> = [
  ["remote", ["remote", "distributed", "work from home", "virtual"]],
  ["field", ["field", "home health", "home care", "driver", "route", "mobile", "site"]],
  ["shift", ["shift", "production", "assembly", "line", "plant", "floor", "overnight", "night"]],
  ["hybrid", ["hybrid", "office", "corporate", "administrative", "hq", "research", "analytics"]],
];

/**
 * Work model implied by the role itself, used when nothing else states one.
 *
 * A machine operator works shifts by definition; a maintenance technician is on
 * the plant floor. Relying on the description alone made matching fragile —
 * "Maintenance Technicians" with no description inferred hybrid knowledge work
 * and landed in Technical/Engineering.
 */
const ROLE_WORK_HINTS: Array<[WorkModel, string[]]> = [
  ["shift", [
    "operator", "machinist", "welder", "millwright", "maintenance", "mechanic",
    "electrician", "hvac", "fitter", "packer", "picker", "warehouse", "assembler",
    "technician", "custodian", "housekeep", "line cook", "server", "barista",
  ]],
  ["field", [
    "aide", "home health", "home care", "caregiver", "driver", "installer",
    "surveyor", "inspector", "courier", "route",
  ]],
  ["remote", ["customer success", "inside sales", "support rep", "help desk"]],
  ["hybrid", [
    "engineer", "developer", "architect", "scientist", "analyst", "actuary",
    "quant", "consultant", "attorney", "accountant", "designer", "marketing",
  ]],
];

const CLINICAL_TERMS = [
  "clinical", "physician", "surgeon", "dentist", "nurse", "rn", "lpn",
  "hygienist", "therapist", "patient", "care", "medical", "health aide",
  "pharmacist", "radiolog", "paramedic", "cna",
];

/**
 * People-leadership vocabulary — specific phrases, not bare "manager".
 *
 * "Portfolio Manager" and "Customer Success Manager" are individual
 * contributors; "Shift Supervisor" and "Branch Manager" lead people. Matching
 * the bare word would misfile every professional whose title contains it.
 */
const SUPERVISORY_TERMS = [
  "supervisor", "foreman", "team lead", "shift lead", "crew lead",
  "branch manager", "practice manager", "store manager", "plant manager",
  "site manager", "office manager", "superintendent", "team leader",
  "front-line leader", "frontline leader",
];

const LICENSED_TERMS = [
  "licensed", "registered", "certified", "credential", "rn", "lpn", "md", "dds",
  "cpa", "pe ", "journeyman", "apprentice", "electrician", "attorney",
];

/** Infer dimensions for a model segment from its name, description and risk fields. */
export function inferDimensions(seg: {
  name: string;
  description?: string | null;
  retentionRisk?: string | null;
  replacementComplexity?: string | null;
}): InferredDimensions {
  const hay = `${seg.name} ${seg.description ?? ""}`.toLowerCase();
  const observed: string[] = [];

  let comp: CompLevel = "medium";
  for (const [level, terms] of COMP_SIGNALS) {
    const hit = terms.find((t) => hay.includes(t));
    if (hit) {
      comp = level;
      observed.push(`comp=${level} ("${hit.trim()}")`);
      break;
    }
  }

  let work: WorkModel | null = null;
  for (const [model, terms] of WORK_SIGNALS) {
    const hit = terms.find((t) => hay.includes(t));
    if (hit) {
      work = model;
      observed.push(`work=${model} ("${hit.trim()}")`);
      break;
    }
  }
  if (!work) {
    // Nothing stated. Try the role noun before falling back to a prior — the
    // role name is usually more reliable than the pay band for this.
    for (const [model, terms] of ROLE_WORK_HINTS) {
      const hit = terms.find((t) => hay.includes(t));
      if (hit) {
        work = model;
        observed.push(`work=${model} (role implies, "${hit.trim()}")`);
        break;
      }
    }
  }
  if (!work) {
    const knowledgeWork = comp === "high" || comp === "very_high";
    work = knowledgeWork ? "hybrid" : "onsite";
    observed.push(`work=${work} (assumed)`);
  }

  // The model supplies this directly, which is better than guessing from a name.
  let replaceability: Replaceability = "moderate";
  const rc = (seg.replacementComplexity ?? "").toLowerCase();
  if (rc === "high") {
    replaceability = "hard";
    observed.push("replaceability=hard (model)");
  } else if (rc === "low") {
    replaceability = "easy";
    observed.push("replaceability=easy (model)");
  } else if (rc === "medium") {
    observed.push("replaceability=moderate (model)");
  }

  const clinical = CLINICAL_TERMS.some((t) => hay.includes(t));
  if (clinical) observed.push("clinical");

  const licensed = LICENSED_TERMS.some((t) => hay.includes(t));
  if (licensed) observed.push("licensed");

  const supervisory = SUPERVISORY_TERMS.some((t) => hay.includes(t));
  if (supervisory) observed.push("supervisory");

  return { comp, work, replaceability, licensed, clinical, supervisory, observed };
}

const COMP_ORDER: CompLevel[] = ["low", "medium", "high", "very_high"];
const REPL_ORDER: Replaceability[] = ["easy", "moderate", "hard"];

export interface SegmentMatch {
  segmentId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  /** Why this matched, or why nothing did. Surfaced in the report. */
  reason: string;
  dimensions?: InferredDimensions;
}

export function matchSegmentToLibrary(
  modelSegmentName: string,
  description?: string | null,
  extra?: { retentionRisk?: string | null; replacementComplexity?: string | null },
): SegmentMatch {
  if (!modelSegmentName?.trim()) {
    return { segmentId: null, confidence: "none", reason: "No segment name given." };
  }

  const dims = inferDimensions({
    name: modelSegmentName,
    description,
    retentionRisk: extra?.retentionRisk,
    replacementComplexity: extra?.replacementComplexity,
  });

  let best: { seg: Segment; score: number } | null = null;
  let runnerUp = -Infinity;

  for (const seg of SEGMENTS) {
    const d = seg.dimensions;
    if (!d) continue;

    let score = 0;

    // Clinical is a hard discriminator, not a preference. A surgeon and an
    // investment principal share every other dimension.
    if (d.clinical === dims.clinical) score += 4;
    else score -= 6;

    // Compensation is the strongest remaining signal: it decides whether group
    // caps bind, which decides which benefits matter at all.
    const compGap = Math.abs(COMP_ORDER.indexOf(d.comp) - COMP_ORDER.indexOf(dims.comp));
    score += compGap === 0 ? 5 : compGap === 1 ? 2 : -2;

    if (d.work.includes(dims.work)) score += 3;

    const rGap = Math.abs(
      REPL_ORDER.indexOf(d.replaceability) - REPL_ORDER.indexOf(dims.replaceability),
    );
    score += rGap === 0 ? 2 : rGap === 1 ? 1 : 0;

    if (d.licensed === dims.licensed) score += 1;

    // Separates a shift supervisor from a maintenance technician: same pay band,
    // same shift work, different economic position.
    if (Boolean(d.supervisory) === dims.supervisory) score += 3;
    else score -= 3;

    if (!best || score > best.score) {
      if (best) runnerUp = best.score;
      best = { seg, score };
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }

  if (!best || best.score <= 2) {
    return {
      segmentId: null,
      confidence: "none",
      reason: `No library segment fits these characteristics (${dims.comp} comp, ${dims.work}, ${dims.replaceability} to replace${dims.clinical ? ", clinical" : ""}).`,
      dimensions: dims,
    };
  }

  const margin = Number.isFinite(runnerUp) ? best.score - runnerUp : best.score;
  const confidence: SegmentMatch["confidence"] =
    best.score >= 12 && margin >= 2 ? "high" : best.score >= 8 ? "medium" : "low";

  return {
    segmentId: best.seg.id,
    confidence,
    reason:
      `Matched to ${best.seg.name} on ${dims.comp.replace("_", " ")} compensation, ` +
      `${dims.work} work, ${dims.replaceability} to replace` +
      (dims.clinical ? ", clinical" : "") + ".",
    dimensions: dims,
  };
}
