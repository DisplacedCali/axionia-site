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
  getVendorsForBenefit,
  matchSegmentToLibrary,
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

/** The client's stated ask plus analyst notes, for prompts that should use it. */
function ask(ctx: StepContext): string {
  return P.clientAskBlock({
    programs: ctx.input.programs,
    context: ctx.input.context,
    analystContext: ctx.input.analystContext,
  });
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
    // The client's named programs land here — this is the step where "look at
    // GLP-1 coverage" changes the answer rather than decorating it.
    user: P.contextOnlyUser(co(ctx), ask(ctx)),
    label: "benefits",
    maxTokens: 2000,
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
 * Benefit design, derived from the library — now keyed to the model's OWN
 * workforce segments rather than segments picked by industry keyword.
 *
 * The bug this fixes: Workforce Intelligence analysed "Portfolio Managers &
 * Investment Principals" while Benefit Design prescribed for "Operations / Team
 * Leaders", because the latter came from getSegmentsForIndustry(). One report,
 * two different workforces — which is what made the output feel disconnected.
 *
 * Where the library has no honest match, the segment is returned with no
 * prescription and a stated reason. Prescribing childcare subsidies to portfolio
 * managers because both landed in "Administrative" is worse than admitting the
 * library does not cover them — and it makes the gap visible instead of
 * producing confident nonsense.
 *
 * Still constrained by a known library gap: no segment covers highly-
 * compensated non-clinical professionals, and ten of thirty benefits are
 * unreachable from any segment. See lib/modules/research/README.md.
 */
export function runBenefitDesign(ctx: StepContext): BenefitDesignSegment[] {
  const modelSegments = ctx.outputs.workforce?.segments ?? [];
  if (!modelSegments.length) return [];

  const priorities: Array<"Critical" | "High" | "Medium"> = ["Critical", "High", "Medium"];

  return modelSegments.slice(0, 4).map((modelSeg, i): BenefitDesignSegment => {
    const match = matchSegmentToLibrary(modelSeg.name, modelSeg.description);
    const lib = match.segmentId ? getSegmentBenefits(match.segmentId) : null;

    // Prefer the model's own reading of this segment over the library's generic
    // note — it is specific to this company.
    const designInsight =
      modelSeg.insight?.trim() ||
      lib?.segment?.notes ||
      "";

    if (!lib?.segment) {
      return {
        segment: modelSeg.name,
        priority: priorities[i] ?? "Medium",
        designInsight,
        bestInClass: [],
        middleOfPack: [],
        bareMinimum: [],
        gap: [],
        libraryMatch: { segmentId: null, confidence: match.confidence, reason: match.reason },
      };
    }

    /**
     * Gap rationale, specific to this segment and benefit.
     *
     * Previously every row read "High perceived value (5/5) and retention score
     * (5/5) for this segment — commonly missing at employers of this type",
     * identical for every benefit under every segment. That is filler, and it
     * read as filler. Now it leads with the library's own point of view on the
     * benefit and ties it to what the model said drives retention here.
     */
    const gapRationale = (b: { name: string; axioniaPOV?: string; perceived: number; retention: number; financial: number }) => {
      const parts: string[] = [];
      if (b.axioniaPOV?.trim()) parts.push(b.axioniaPOV.trim());

      const drivers = modelSeg.retentionRiskDrivers?.filter(Boolean) ?? [];
      if (drivers.length) {
        parts.push(`Relevant here because ${drivers[0].toLowerCase().replace(/\.$/, "")}.`);
      } else if (modelSeg.replacementNote?.trim()) {
        parts.push(modelSeg.replacementNote.trim());
      }

      if (b.financial >= 4) {
        parts.push("Financial leverage is the argument, not perception.");
      } else if (b.perceived >= 5 && b.retention >= 5) {
        parts.push("Retention and perceived value both score at the top of the library.");
      }
      return parts.join(" ");
    };

    return {
      segment: modelSeg.name,
      priority: priorities[i] ?? "Medium",
      designInsight,
      bestInClass: lib.high.slice(0, 3).map((b) => ({
        benefit: b.name,
        economicRationale: b.axioniaPOV ?? "",
        competitiveSignal: `Perceived ${b.perceived}/5 · Retention ${b.retention}/5 · Financial leverage ${b.financial}/5`,
      })),
      middleOfPack: lib.medium.slice(0, 3).map((b) => ({
        benefit: b.name,
        note: b.axioniaPOV ?? "Standard market offering.",
      })),
      bareMinimum: lib.low.slice(0, 2).map((b) => ({
        benefit: b.name,
        note: "Compliance or baseline — expected by candidates.",
      })),
      gap: lib.high.slice(0, 3).map((b) => ({
        benefit: b.name,
        estimatedCost: "Varies by vendor",
        gapRationale: gapRationale(b),
        retentionImpact:
          modelSeg.retentionRisk === "high"
            ? `${modelSeg.name} carry high retention risk — this is where it bites.`
            : `Retention weight ${b.retention}/5 for this segment.`,
        urgency:
          b.perceived >= 5 && b.retention >= 5
            ? ("High" as const)
            : b.perceived >= 4
              ? ("Medium" as const)
              : ("Low" as const),
        vendors: getVendorsForBenefit(b.id).map((v) => v.vendorName),
      })),
      libraryMatch: {
        segmentId: match.segmentId,
        confidence: match.confidence,
        reason: match.reason,
      },
    };
  });
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
    ask: ask(ctx),
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
      ask: ask(ctx),
    }),
    label: "synthesis",
    maxTokens: 2500,
  });
  return res.text;
}
