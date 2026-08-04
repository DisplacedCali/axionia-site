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

export interface WorkforceOutput {
  segments: WorkforceSegment[];
  summaryBullets: string[];
  overallInsight: string;
  axioniaPitch: string;
  benefitDesign?: BenefitDesignSegment[];
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
