/**
 * Pipeline contracts.
 *
 * The step outputs mirror the shape axionia-app's `results` object had, so the
 * existing six report tabs can consume this without reshaping — and so a run
 * from either codebase produces the same research_runs row.
 */

import type { AxisKey } from "../data/types";

export type StepId =
  | "validate"
  | "linkedin"
  | "profile"
  | "benefits"
  | "financial"
  | "regulatory"
  | "workforce"
  | "benefitdesign"
  | "scoring"
  | "synthesis";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface StepState {
  status: StepStatus;
  /** Step output. Shape depends on the step; see StepOutputs. */
  output?: unknown;
  error?: string;
  attempts: number;
  startedAt?: string;
  finishedAt?: string;
  ms?: number;
  /** True when the step produced usable output via a degraded path. */
  degraded?: boolean;

  /**
   * Identity confirmation. Set on the `validate` step only.
   *
   * `output` is what downstream steps read, so a correction is written there
   * directly — and `modelOutput` preserves what the model originally said.
   * Same principle as reports.content vs reports.edits: a correction must
   * never erase what it corrected, or "we expose the entire model" stops being
   * true at the one point where the model was most consequentially wrong.
   */
  modelOutput?: unknown;
  confirmedAt?: string;
  confirmedBy?: string;
}

export type StepStates = Partial<Record<StepId, StepState>>;

/** What the admin submitted, plus anything carried over from the intake. */
export interface JobInput {
  companyName: string;
  website?: string | null;
  industry?: string | null;
  employees?: string | null;
  /** Free-text LinkedIn/market observations the admin pasted in. */
  notes?: string | null;

  /**
   * "Programs or vendors you'd like looked at" — collected by the public
   * intake form and stored in report_requests.payload.programs. It was being
   * captured and then discarded; this is the client's own statement of what
   * they want examined, so it belongs in the prompts.
   */
  programs?: string | null;

  /**
   * "Your largest role groups" — free text from the intake, e.g. "hygienists,
   * dental assistants, front office".
   *
   * Industry alone only ever yields a DEFAULT segment mix. Two professional
   * services firms of the same size can be 90% consultants or 60% back office,
   * and the benefit economics diverge completely. This is the client telling
   * us which one they are, in their own words — which is the form
   * `matchSegmentToLibrary` already reads, so it needs no translation.
   */
  roleGroups?: string | null;

  /**
   * The optional detail step from the intake — funding, states, covered lives
   * by tier, program categories, vendors, carrier.
   *
   * First-party and specific, so it outranks anything the model infers. The
   * program list in particular replaces guesswork: knowing an employer runs
   * Hinge and Lyra is the difference between scoring their portfolio and
   * scoring their sector's.
   */
  portfolio?: {
    funding?: string | null;
    states?: string | null;
    tiers?: string | null;
    categories?: string[] | null;
    vendors?: string | null;
    carriers?: string | null;
  } | null;

  /** The intake's free-text "additional context" field. */
  context?: string | null;

  /**
   * Analyst context. Where you type what you learned from a vendor deck or
   * renewal packet you read yourself.
   *
   * Deliberately manual: the pipeline does not parse attachments. Document
   * ingestion needs the PHI firewall and is the substance of the paid tier,
   * so for the free report a human reads the artifact and summarises it here.
   */
  analystContext?: string | null;
}

export interface ValidateOutput {
  name: string;
  industry?: string;
  hq?: string;
  size?: string;
  description?: string;
  website?: string;
  confidence?: "high" | "medium" | "low";
  /**
   * Who owns this company, if the model specifically knows. Null is the
   * correct answer when it doesn't — see VALIDATE_SYSTEM.
   */
  ownership?: string | null;
  ownershipConfidence?: "high" | "medium" | "low" | "unknown";
  stateOfOperations?: string[];
}

export interface StatesData {
  states: string[];
  primaryState: string;
  rationale: string;
}

export interface RegulatoryOutput {
  regulatory: string;
  statesData: StatesData;
}

export interface WorkforceSegment {
  name: string;
  description?: string;
  headcountEstimate?: string;
  retentionRisk?: "high" | "medium" | "low";
  retentionRiskDrivers?: string[];
  replacementComplexity?: "high" | "medium" | "low";
  replacementNote?: string;
  utilization?: string;
  topBenefit?: string;
  premiumBenefits?: Array<{ benefit: string; rationale: string }>;
  insight?: string;
}

export interface BenefitDesignGap {
  benefit: string;
  estimatedCost: string;
  gapRationale: string;
  retentionImpact: string;
  urgency: "High" | "Medium" | "Low";
  vendors: string[];
}

export interface BenefitDesignSegment {
  /** The MODEL's segment name, so this section matches Workforce Intelligence. */
  segment: string;
  priority: "Critical" | "High" | "Medium";
  designInsight: string;
  /**
   * Which library segment supplied the benefit data, and how confident the
   * match was. null means the library does not cover this role type — stated
   * rather than forced, so the gap is visible instead of producing a confident
   * but wrong prescription.
   */
  libraryMatch?: {
    segmentId: string | null;
    confidence: "high" | "medium" | "low" | "none";
    reason: string;
  };
  bestInClass: Array<{ benefit: string; economicRationale: string; competitiveSignal: string }>;
  middleOfPack: Array<{ benefit: string; note: string }>;
  bareMinimum: Array<{ benefit: string; note: string }>;
  gap: BenefitDesignGap[];
}

/**
 * A benefit the reader is unlikely to have been shown, and why.
 *
 * `kind` is the reason it's surprising, and each one is computable from the
 * library without knowing anything about what the employer currently runs:
 *
 *  - `no-seller`      nothing in the brokered channel pitches this, so its
 *                     absence from a portfolio was never a decision anyone made
 *  - `cheap-high-rank` scores at the top of the library on financial leverage
 *                     as well as value — the case where a low-cost option
 *                     outranks a funded one
 *  - `off-clinical`   sits outside the clinical stack entirely, which is the
 *                     axis no point-solution vendor can argue across
 */
export interface DesignedMixPick {
  benefit: string;
  kind: "no-seller" | "cheap-high-rank" | "off-clinical";
  why: string;
  forSegment: string;
  /** How often this is already in place. Only uncommon or rare can be a pick. */
  commonality: "uncommon" | "rare";
  scores: { perceived: number; retention: number; financial: number; clinical: number };
}

/**
 * One benefit placed on employer cost x employee-attributed value.
 *
 * The map exists because the four scores measure VALUE and not NOVELTY, so a
 * ranking built on them alone recommended a 401(k) to an investment firm.
 * Position makes that visible: table stakes cluster together and read as a
 * cluster, and the interesting things are at the edges.
 *
 * The quadrant nothing previously surfaced is `costly-unloved` — expensive and
 * unnoticed. It is a sharper thing to say than any suggestion.
 */
export interface MixPoint {
  benefit: string;
  /** 1-5. High employer leverage means LOW relative cost to the employer. */
  employerLeverage: number;
  /** 1-5, what employees attribute to it. */
  perceived: number;
  commonality: "table-stakes" | "common" | "uncommon" | "rare";
  quadrant: "cheap-loved" | "costly-loved" | "cheap-unloved" | "costly-unloved";
  /** True when this is one of the three picks below. */
  highlighted: boolean;
}

/**
 * A mix designed from workforce shape alone.
 *
 * The point of this section is that it is built WITHOUT knowing the employer's
 * current programs, and says so first. Two reasons that framing is load-bearing
 * rather than a disclaimer:
 *
 * 1. It's true, and this product's entire claim is that it exposes its own
 *    model. A confident prescription built from a bubble would be the exact
 *    overreach we exist to catch.
 *
 * 2. It converts better. The reader's first reaction to an unfamiliar mix is
 *    "but you don't know we already run X" — and that thought is the buying
 *    signal. Naming the blind spot first turns the objection into the invitation.
 *
 * What this must never do is score or rank a program the employer told us they
 * already run. That would be a verdict on a decision they made, delivered
 * without their data, which is the difference between provocative and
 * offensive. Named programs are acknowledged in `acknowledged` and left alone.
 */
export interface DesignedMix {
  /** The stated blind spot. Rendered before anything else in the section. */
  premise: string;
  /**
   * At most THREE, and zero is a valid answer.
   *
   * Capped because a list of five reads as a list and a list of three reads as
   * a choice. Allowed to be empty because the previous version, ranking on
   * value alone, suggested a 401(k) to an investment firm — and if the shape of
   * a workforce doesn't produce a surprise, saying so is worth more than
   * padding the section with things they already have.
   */
  picks: DesignedMixPick[];
  /** Every benefit placed on cost x perceived value, for the map. */
  map: MixPoint[];
  /** Set when nothing cleared the bar — rendered instead of the picks. */
  nothingSurprising?: string;
  /** Programs the client named at intake. Listed, never scored. */
  acknowledged: string[];
  /**
   * Where serving one group well serves another badly. Genuinely the most
   * distinctive output here, and reserved for the paid view — see SECTIONS,
   * where `benefitDesign` carries it and stays out of the summary.
   */
  tension: string[];
}

export interface WorkforceOutput {
  segments: WorkforceSegment[];
  summaryBullets: string[];
  overallInsight: string;
  axioniaPitch: string;
  benefitDesign?: BenefitDesignSegment[];
  designedMix?: DesignedMix;
}

export type ScoreSet = Partial<Record<AxisKey, number>> & {
  overallScore?: number;
  readinessLabel?: string;
  weakestAxis?: string;
  topOpportunity?: string;
  urgencySignal?: string;
  conversationHook?: string;
  /** True when the model failed and estimated defaults were substituted. */
  _fallback?: boolean;
  /**
   * WHY the fallback happened, in plain words.
   *
   * `runScoring` used to catch the LlmError and discard it, so a report could
   * say "estimated defaults were substituted" with no way to find out why: the
   * step still completed, `steps.scoring.error` was never set, `last_error`
   * stayed null and nothing logged. For a product whose worst failure is
   * showing estimates as real analysis, not knowing the cause is most of the
   * problem.
   *
   * Lives on the score set rather than the step because it travels with
   * `reports.content` — the immutable record — so the reason survives as long
   * as the number it explains.
   */
  _fallbackReason?: string;
  [key: string]: unknown;
};

/** Typed view of accumulated step outputs. */
export interface StepOutputs {
  validate?: ValidateOutput;
  linkedin?: string;
  profile?: string;
  benefits?: string;
  financial?: string;
  regulatory?: RegulatoryOutput;
  workforce?: WorkforceOutput;
  benefitdesign?: BenefitDesignSegment[];
  scoring?: ScoreSet;
  synthesis?: string;
}

/** The payload written to research.research_runs on completion. */
export interface ResearchResult {
  company: string;
  website?: string | null;
  industry?: string | null;
  hq?: string | null;
  size?: string | null;
  profile: string;
  benefits: string;
  financial: string;
  linkedinData: string;
  regulatory: string;
  statesData: StatesData | null;
  workforceData: WorkforceOutput | null;
  scores: ScoreSet;
  brief: string;
  pipelineVersion: string;
}

export type JobStatus =
  | "queued"
  | "running"
  | "paused"
  /**
   * Parked after wave 1 until a human ratifies the company identity.
   *
   * Distinct from 'paused', which means "between waves, resume when polled".
   * This means "will not proceed until a person acts". See migration 016 — a
   * run once analysed a fertility vendor as a behavioral health employer, and
   * eight subsequent model calls inherited it faithfully.
   */
  | "awaiting_confirmation"
  | "complete"
  | "failed"
  | "cancelled";

export interface PipelineJob {
  id: string;
  companyId: string | null;
  requestId: string | null;
  status: JobStatus;
  input: JobInput;
  steps: StepStates;
  nextWave: number;
  attempts: number;
  lastError: string | null;
  runId: string | null;
  inputTokens: number;
  outputTokens: number;
  model: string | null;
  createdAt: string;
  updatedAt: string;
}
