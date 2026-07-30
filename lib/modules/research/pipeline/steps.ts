/**
 * Pipeline steps as pure functions.
 *
 * Each step takes (input, accumulated outputs, llm) and returns its own output.
 * No database access, no React, no globals — the runner owns persistence, the
 * steps own reasoning. That split is what makes the DAG testable against a
 * mock client.
 *
 * Dependency structure is preserved exactly from axionia-app:
 *   validate                          — resolves the company
 *   linkedin ∥ profile                — wave 1a
 *   benefits ∥ financial              — wave 1b
 *   regulatory ∥ workforce            — wave 2, both need profile
 *   benefitdesign                     — pure, derived from the benefit library
 *   scoring                           — needs everything above
 *   synthesis                         — needs scoring
 */

import {
  getSegmentBenefits,
  getSegmentsForIndustry,
  getVendorsForBenefit,
  computeOverallScore,
  bandForScore,
} from "../data";
import type { AxisKey } from "../data/types";
import { extractArrayProperty, extractJson } from "./json";
import { completeJson, type LlmClient, LlmError } from "./llm";
import * as P from "./prompts";
import type {
  BenefitDesignSegment,
  JobInput,
  RegulatoryOutput,
  ScoreSet,
  StatesData,
  StepOutputs,
  ValidateOutput,
  WorkforceOutput,
  WorkforceSegment,
} from "./types";

export interface StepContext {
  input: JobInput;
  outputs: StepOutputs;
  llm: LlmClient;
}

/** Company context assembled from the validate step, with input as fallback. */
function co(ctx: StepContext): P.CompanyContext {
  const v = ctx.outputs.validate;
  return {
    name: v?.name ?? ctx.input.companyName,
    industry: v?.industry ?? ctx.input.industry ?? null,
    hq: v?.hq ?? null,
    size: v?.size ?? ctx.input.employees ?? null,
    website: v?.website ?? ctx.input.website ?? null,
    description: v?.description ?? null,
  };
}

/** Thrown when a step cannot produce usable output. */
export class StepError extends Error {
  constructor(message: string, readonly stepId: string) {
    super(message);
    this.name = "StepError";
  }
}

// ── validate ────────────────────────────────────────────────────────────────

export async function runValidate(ctx: StepContext): Promise<ValidateOutput> {
  const res = await completeJson(ctx.llm, {
    system: P.VALIDATE_SYSTEM,
    user: P.validateUser(ctx.input),
    label: "validate",
  });
  const data = extractJson<ValidateOutput>(res.text);
  if (!data?.name) {
    throw new StepError("Could not identify the company from the model response.", "validate");
  }
  return data;
}

// ── wave 1a ─────────────────────────────────────────────────────────────────

export async function runLinkedin(ctx: StepContext): Promise<string> {
  const res = await ctx.llm.complete({
    system: P.LINKEDIN_SYSTEM,
    user: P.linkedinUser(co(ctx), ctx.input.notes),
    label: "linkedin",
  });
  return res.text;
}

export async function runProfile(ctx: StepContext): Promise<string> {
  const res = await ctx.llm.complete({
    system: P.PROFILE_SYSTEM,
    user: P.profileUser(co(ctx)),
    label: "profile",
  });
  return res.text;
}

// ── wave 1b ─────────────────────────────────────────────────────────────────

export async function runBenefits(ctx: StepContext): Promise<string> {
  const res = await ctx.llm.complete({
    system: P.BENEFITS_SYSTEM,
    user: P.contextOnlyUser(co(ctx)),
    label: "benefits",
  });
  return res.text;
}

export async function runFinancial(ctx: StepContext): Promise<string> {
  const res = await ctx.llm.complete({
    system: P.FINANCIAL_SYSTEM,
    user: P.contextOnlyUser(co(ctx)),
    label: "financial",
  });
  return res.text;
}

// ── wave 2a: states then regulatory ─────────────────────────────────────────

export async function runRegulatory(ctx: StepContext): Promise<RegulatoryOutput> {
  const company = co(ctx);
  const profile = ctx.outputs.profile ?? "";
  const linkedin = ctx.outputs.linkedin ?? "";

  const statesRes = await completeJson(ctx.llm, {
    system: P.STATES_SYSTEM,
    user: P.statesUser(company, profile, linkedin),
    label: "states",
  });

  // Fall back to the HQ state rather than failing the step — a wrong-but-stated
  // assumption is more useful than an empty regulatory section, and the
  // rationale field says so explicitly.
  const statesData: StatesData =
    extractJson<StatesData>(statesRes.text) ?? {
      states: ctx.outputs.validate?.stateOfOperations?.length
        ? ctx.outputs.validate.stateOfOperations
        : ["MN"],
      primaryState: ctx.outputs.validate?.stateOfOperations?.[0] ?? "MN",
      rationale: "Assumed from HQ — state detection did not return usable data.",
    };

  const stateList = (statesData.states?.length ? statesData.states : ["MN"]).join(", ");

  const regRes = await ctx.llm.complete({
    system: P.regulatorySystem(stateList),
    user: P.regulatoryUser(company, stateList, profile, ctx.outputs.financial ?? ""),
    label: "regulatory",
    maxTokens: 2500,
  });

  return { regulatory: regRes.text, statesData };
}

// ── wave 2b: workforce segmentation ─────────────────────────────────────────

export async function runWorkforce(ctx: StepContext): Promise<WorkforceOutput> {
  const company = co(ctx);
  const profile = ctx.outputs.profile ?? "";

  const res = await completeJson(ctx.llm, {
    system: P.WORKFORCE_SYSTEM,
    user: P.workforceUser(company, profile),
    label: "workforce",
    maxTokens: 3000,
  });

  const parsed = extractJson<WorkforceOutput>(res.text);
  if (parsed?.segments?.length) return normaliseWorkforce(parsed);

  // Partial recovery: salvage just the segments array from a truncated envelope.
  const salvaged = extractArrayProperty<WorkforceSegment>(res.text, "segments");
  if (salvaged?.length) {
    return normaliseWorkforce({
      segments: salvaged,
      summaryBullets: [],
      overallInsight: "Partial data recovered.",
      axioniaPitch: "",
    });
  }

  // Lighter retry. In axionia-app this path was dead code: askJSON returns a
  // string and the result was read as an object, so `segRaw?.segments` was
  // always undefined and the fallback never fired.
  const retry = await completeJson(ctx.llm, {
    system: P.WORKFORCE_FALLBACK_SYSTEM,
    user: P.workforceFallbackUser(company, profile),
    label: "workforce-fallback",
    maxTokens: 2000,
  });

  const retryParsed = extractJson<WorkforceOutput>(retry.text);
  if (retryParsed?.segments?.length) return normaliseWorkforce(retryParsed);

  throw new StepError(
    "Workforce segmentation returned no usable segments after retry.",
    "workforce",
  );
}

function normaliseWorkforce(w: Partial<WorkforceOutput>): WorkforceOutput {
  return {
    segments: w.segments ?? [],
    summaryBullets: w.summaryBullets ?? [],
    overallInsight: w.overallInsight ?? "",
    axioniaPitch: w.axioniaPitch ?? "",
  };
}

// ── benefit design: pure, no model call ─────────────────────────────────────

/**
 * Derived entirely from the benefit intelligence library — fast, reproducible,
 * and defensible, because every claim traces to a curated row rather than to
 * model output.
 *
 * NOTE: constrained by a known gap in the library. Ten of thirty benefits are
 * unreachable because no segment references them, and it is the clinical half —
 * Healthcare Access, Clinical Value and Risk/Income Protection appear in no
 * segment. Six of the eight benefits scored financial:5 therefore cannot
 * surface here. See lib/modules/research/README.md.
 */
export function runBenefitDesign(ctx: StepContext): BenefitDesignSegment[] {
  const industry = ctx.outputs.validate?.industry ?? ctx.input.industry ?? "";
  const segmentIds = getSegmentsForIndustry(industry).slice(0, 3);

  const priorities: Array<"Critical" | "High" | "Medium"> = ["Critical", "High", "Medium"];

  return segmentIds
    .map((segId, i): BenefitDesignSegment | null => {
      const seg = getSegmentBenefits(segId);
      if (!seg.segment) return null;

      return {
        segment: seg.segment.name,
        priority: priorities[i] ?? "Medium",
        designInsight: seg.segment.notes ?? "",
        bestInClass: seg.high.slice(0, 3).map((b) => ({
          benefit: b.name,
          economicRationale: b.axioniaPOV ?? "",
          competitiveSignal: `Perceived value: ${b.perceived}/5 · Retention impact: ${b.retention}/5`,
        })),
        middleOfPack: seg.medium.slice(0, 3).map((b) => ({
          benefit: b.name,
          note: b.axioniaPOV ?? "Standard market offering.",
        })),
        bareMinimum: seg.low.slice(0, 2).map((b) => ({
          benefit: b.name,
          note: "Compliance/baseline — expected by candidates.",
        })),
        gap: seg.high.slice(0, 3).map((b) => ({
          benefit: b.name,
          estimatedCost: "Varies by vendor",
          gapRationale: `High perceived value (${b.perceived}/5) and retention score (${b.retention}/5) for this segment — commonly missing at employers of this type.`,
          retentionImpact: `Retention/attraction score: ${b.retention}/5`,
          urgency:
            b.perceived >= 5 && b.retention >= 5
              ? ("High" as const)
              : b.perceived >= 4
                ? ("Medium" as const)
                : ("Low" as const),
          vendors: getVendorsForBenefit(b.id).map((v) => v.vendorName),
        })),
      };
    })
    .filter((s): s is BenefitDesignSegment => s !== null);
}

// ── scoring ─────────────────────────────────────────────────────────────────

/**
 * Estimated scores, used only when the model call fails outright.
 * `_fallback: true` keeps these out of the benchmark views.
 */
export const FALLBACK_SCORES: ScoreSet = {
  spendEfficiency: 38,
  decisionMaturity: 40,
  workforceAlignment: 33,
  vendorIndependence: 36,
  analyticsReadiness: 32,
  cfoEngagement: 27,
  regulatoryReadiness: 40,
  appreciationValue: 35,
  readinessLabel: "Emerging",
  spendRationale: "Estimated.",
  maturityRationale: "Estimated.",
  alignmentRationale: "Estimated.",
  vendorRationale: "Estimated.",
  analyticsRationale: "Estimated.",
  cfoRationale: "Estimated.",
  regulatoryRationale: "Estimated.",
  appreciationRationale: "Estimated.",
  topOpportunity: "Discovery call recommended.",
  urgencySignal: "No strong signals found.",
  conversationHook: "How do you currently measure benefit ROI?",
  weakestAxis: "CFO Engagement",
  _fallback: true,
};

const AXIS_KEYS: AxisKey[] = [
  "spendEfficiency",
  "decisionMaturity",
  "workforceAlignment",
  "vendorIndependence",
  "analyticsReadiness",
  "cfoEngagement",
  "regulatoryReadiness",
  "appreciationValue",
];

export async function runScoring(ctx: StepContext): Promise<ScoreSet> {
  const args = {
    co: co(ctx),
    profile: ctx.outputs.profile ?? "",
    benefits: ctx.outputs.benefits ?? "",
    financial: ctx.outputs.financial ?? "",
    regulatory: ctx.outputs.regulatory?.regulatory ?? "",
    workforceInsight: ctx.outputs.workforce?.overallInsight ?? "",
  };

  let raw: ScoreSet | null = null;
  try {
    const res = await completeJson(ctx.llm, {
      system: P.SCORING_SYSTEM,
      user: P.scoringUser(args),
      label: "scoring",
      maxTokens: 2000,
    });
    raw = extractJson<ScoreSet>(res.text);
  } catch (e) {
    if (!(e instanceof LlmError)) throw e;
    // Fall through to the fallback set below.
  }

  // A score set missing axes is not a partial success — it would enter the
  // benchmark averages as if complete. Treat it as a fallback instead.
  const complete =
    raw && AXIS_KEYS.every((k) => typeof raw?.[k] === "number" && !Number.isNaN(raw[k]));

  const scores: ScoreSet = complete ? { ...raw } : { ...FALLBACK_SCORES };

  // Overall score is computed here, never taken from the model. The original
  // prompt asked the model to redistribute a 0.09 weight residual in prose,
  // which made the headline number irreproducible across runs.
  const overall = computeOverallScore(scores as Partial<Record<AxisKey, number>>);
  if (overall !== null) {
    scores.overallScore = overall;
    scores.scoreBand = bandForScore(overall).band;
    scores.scoreBandFraming = bandForScore(overall).framing;
  }

  return scores;
}

// ── synthesis ───────────────────────────────────────────────────────────────

export async function runSynthesis(ctx: StepContext): Promise<string> {
  const res = await ctx.llm.complete({
    system: P.SYNTHESIS_SYSTEM,
    user: P.synthesisUser({
      co: co(ctx),
      profile: ctx.outputs.profile ?? "",
      benefits: ctx.outputs.benefits ?? "",
      financial: ctx.outputs.financial ?? "",
      regulatory: ctx.outputs.regulatory?.regulatory ?? "",
      workforceInsight: ctx.outputs.workforce?.overallInsight ?? "",
      scores: ctx.outputs.scoring ?? {},
    }),
    label: "synthesis",
    maxTokens: 2500,
  });
  return res.text;
}
