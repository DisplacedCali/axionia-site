/**
 * Dry-run harness for the pipeline DAG.
 *
 * Exercises every step against a deterministic mock model and an in-memory job
 * store, so wave ordering, dependency resolution, degradation and resumability
 * are all verifiable without a database and without spending a token.
 *
 * Not imported by the app. Compiled and executed by scripts/dryrun-research.js.
 */

import {
  PIPELINE_VERSION,
  STEPS,
  STEPS_BY_ID,
  TOTAL_MODEL_CALLS,
  WAVES,
  blockedBy,
  runnableSteps,
  validatePlan,
} from "./plan";
import { createMockClient, LlmError, type LlmClient, type Usage } from "./llm";
import { StepError, type StepContext } from "./steps";
import type {
  JobInput,
  PipelineJob,
  ResearchResult,
  ScoreSet,
  StepId,
  StepOutputs,
  StepStates,
} from "./types";

const MAX_STEP_ATTEMPTS = 2;

// ── Mock model responses, keyed by step label ───────────────────────────────

export const MOCK_RESPONSES: Record<string, string> = {
  validate: JSON.stringify({
    name: "Meridian Manufacturing",
    industry: "Manufacturing / Industrial",
    hq: "Eden Prairie, MN",
    size: "~1,400 employees",
    description: "Mid-market precision manufacturer with three plants.",
    website: "https://meridianmfg.com",
    confidence: "high",
    stateOfOperations: ["MN", "IL"],
  }),
  linkedin: "- CHRO: Dana Reyes, 3 years\n- CFO: Sam Okafor, ex-PE",
  profile: "- Hourly-heavy workforce\n- Family-owned\n- Two shifts",
  benefits: "- Fully insured medical\n- Broker-led renewals",
  financial: "- Thin margins\n- Stable headcount",
  states: JSON.stringify({
    states: ["MN", "IL"],
    primaryState: "MN",
    rationale: "Plants in both states.",
  }),
  regulatory: "## MN\n- **MN Paid Leave Act** applies to self-insured plans\n## IL\n- Paid Leave for All Workers Act",
  workforce: JSON.stringify({
    segments: [
      {
        name: "Machine Operators",
        description: "Shift-based production staff",
        headcountEstimate: "~800",
        retentionRisk: "high",
        retentionRiskDrivers: ["Local wage competition", "Shift fatigue"],
        replacementComplexity: "medium",
        replacementNote: "Fillable but training-heavy.",
        topBenefit: "Childcare subsidy",
        premiumBenefits: [{ benefit: "Backup care", rationale: "Absence reduction" }],
        insight: "Absence is the cost driver, not premium.",
      },
      {
        name: "Maintenance Technicians",
        retentionRisk: "high",
        replacementComplexity: "high",
        topBenefit: "Tuition assistance",
        insight: "Hard to replace; licensing matters.",
      },
    ],
    summaryBullets: ["Absence drives cost", "Retention concentrated in maintenance"],
    overallInsight: "Benefit spend is misaligned with an hourly, shift-based workforce.",
    axioniaPitch: "Absence economics, not premium, is where the money is.",
  }),
  // Deliberately fenced and prose-wrapped, to prove extractJson's escalation.
  scoring:
    "Here is the assessment:\n```json\n" +
    JSON.stringify({
      spendEfficiency: 42,
      decisionMaturity: 38,
      workforceAlignment: 30,
      vendorIndependence: 45,
      analyticsReadiness: 33,
      cfoEngagement: 55,
      regulatoryReadiness: 48,
      appreciationValue: 29,
      readinessLabel: "Emerging",
      spendRationale: "Broker-led renewals.",
      maturityRationale: "Reactive.",
      alignmentRationale: "Mismatched to hourly workforce.",
      vendorRationale: "Moderate capture.",
      analyticsRationale: "Little data use.",
      cfoRationale: "CFO engaged via cost pressure.",
      regulatoryRationale: "MN paid leave exposure.",
      appreciationRationale: "Premium perks unused by shift staff.",
      topOpportunity: "Absence-driven benefit redesign.",
      urgencySignal: "MN Paid Leave Act effective date.",
      conversationHook: "What does an unplanned absence cost you per shift?",
      weakestAxis: "Appreciation Value",
      overallScore: 99, // wrong on purpose — must be overwritten
    }) +
    "\n```",
  "workforce-fallback": JSON.stringify({
    segments: [{ name: "Production Staff", topBenefit: "Childcare" }],
    summaryBullets: [],
    overallInsight: "Recovered via fallback.",
    axioniaPitch: "",
  }),
  synthesis: "## Company Snapshot\n- Mid-market manufacturer\n## Watch-Outs\n- Paid leave compliance",
};

// ── In-memory job store mirroring the DB semantics ──────────────────────────

export class MemoryJobStore {
  private jobs = new Map<string, PipelineJob>();
  private seq = 0;

  /**
   * `opts.gated` opts into the identity confirmation gate.
   *
   * Default is OFF here and ON in production, which looks backwards and isn't:
   * every other check in the dry run exercises the pipeline end to end, and
   * they would all park after wave 1 waiting for a human who doesn't exist in
   * a script. Pre-confirming is how the rest of the suite stays about what it
   * is about. The gate has its own checks.
   */
  create(input: JobInput, opts: { gated?: boolean } = {}): PipelineJob {
    const id = `job-${++this.seq}`;
    const now = new Date().toISOString();
    const job: PipelineJob = {
      id,
      companyId: null,
      requestId: null,
      status: "queued",
      input,
      steps: opts.gated
        ? {}
        : { validate: { status: "pending", attempts: 0, confirmedAt: now } },
      nextWave: 0,
      attempts: 0,
      lastError: null,
      runId: null,
      inputTokens: 0,
      outputTokens: 0,
      model: null,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string): PipelineJob | null {
    return this.jobs.get(id) ?? null;
  }

  /** Mirrors claimJob(): only queued/paused can be claimed. */
  claim(id: string): PipelineJob | null {
    const j = this.jobs.get(id);
    if (!j) return null;
    if (j.status !== "queued" && j.status !== "paused") return null;
    j.status = "running";
    j.attempts += 1;
    return j;
  }

  save(id: string, patch: Partial<PipelineJob>): PipelineJob {
    const j = this.jobs.get(id)!;
    Object.assign(j, patch, { updatedAt: new Date().toISOString() });
    return j;
  }
}

// ── Runner mirroring runner.ts, minus persistence ───────────────────────────

export function outputsFromSteps(steps: StepStates): StepOutputs {
  const out: Record<string, unknown> = {};
  for (const [id, st] of Object.entries(steps)) {
    if (st?.status === "done" && st.output !== undefined) out[id] = st.output;
  }
  return out as StepOutputs;
}

export interface DryAdvance {
  wave: number | null;
  ranSteps: StepId[];
  done: boolean;
  error?: string;
  result?: ResearchResult;
}

export async function advance(
  store: MemoryJobStore,
  jobId: string,
  llm: LlmClient,
): Promise<DryAdvance> {
  const job = store.claim(jobId);
  if (!job) return { wave: null, ranSteps: [], done: store.get(jobId)?.status === "complete" };

  const steps: StepStates = { ...job.steps };
  const waveIndex = job.nextWave;

  if (waveIndex >= WAVES.length) return finish(store, jobId, steps, []);

  const wave = [...WAVES[waveIndex]];
  const toRun = runnableSteps(steps, wave).filter((id) => steps[id]?.status !== "done");
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };

  const wrapped: LlmClient = {
    async complete(args) {
      const r = await llm.complete(args);
      usage.inputTokens += r.usage.inputTokens;
      usage.outputTokens += r.usage.outputTokens;
      return r;
    },
  };

  const results = await Promise.allSettled(
    toRun.map(async (id) => {
      const def = STEPS_BY_ID.get(id)!;
      const attempts = (steps[id]?.attempts ?? 0) + 1;
      steps[id] = { ...steps[id], status: "running", attempts };
      const ctx: StepContext = {
        input: job.input,
        outputs: outputsFromSteps(steps),
        llm: wrapped,
      };
      return { id, output: await def.run(ctx), attempts };
    }),
  );

  let hardError: string | null = null;

  results.forEach((r, i) => {
    const id = toRun[i];
    const def = STEPS_BY_ID.get(id)!;
    if (r.status === "fulfilled") {
      steps[id] = {
        // Spread the prior state so `confirmedAt` survives the step running —
        // dropping it would re-park a job that had already been confirmed.
        ...steps[id],
        status: "done",
        output: r.value.output,
        attempts: r.value.attempts,
      };
      return;
    }
    const reason = r.reason as Error;
    const message =
      reason instanceof StepError || reason instanceof LlmError
        ? reason.message
        : (reason?.message ?? "unknown");
    const attempts = steps[id]?.attempts ?? 1;
    if (attempts < MAX_STEP_ATTEMPTS) {
      steps[id] = { ...steps[id], status: "pending", attempts, error: message };
    } else if (def.optional) {
      steps[id] = { ...steps[id], status: "skipped", attempts, error: message, degraded: true };
    } else {
      steps[id] = { ...steps[id], status: "failed", attempts, error: message };
      hardError = message;
    }
  });

  const settled = wave.every((id) =>
    ["done", "skipped", "failed"].includes(steps[id]?.status ?? ""),
  );

  if (hardError) {
    store.save(jobId, { steps, nextWave: waveIndex, status: "failed", lastError: hardError });
    return { wave: waveIndex, ranSteps: toRun, done: false, error: hardError };
  }

  const nextWave = settled ? waveIndex + 1 : waveIndex;
  const isLast = nextWave >= WAVES.length;

  // Mirrors runner.ts. See the note there — the gate lives in the runner so
  // every caller passes through it, and this file exists to mirror the runner.
  const awaitingConfirmation =
    settled && waveIndex === 0 && !steps.validate?.confirmedAt;

  store.save(jobId, {
    steps,
    nextWave: awaitingConfirmation ? waveIndex : nextWave,
    status: awaitingConfirmation
      ? "awaiting_confirmation"
      : isLast
        ? "running"
        : "paused",
    inputTokens: job.inputTokens + usage.inputTokens,
    outputTokens: job.outputTokens + usage.outputTokens,
  });

  if (awaitingConfirmation) return { wave: waveIndex, ranSteps: toRun, done: false };
  if (isLast) return finish(store, jobId, steps, toRun);
  return { wave: waveIndex, ranSteps: toRun, done: false };
}

/** Mirrors db.confirmValidation — merge corrections, keep the model's original. */
export function confirmIdentity(
  store: MemoryJobStore,
  jobId: string,
  corrections: Record<string, unknown>,
): void {
  const job = store.get(jobId);
  if (!job) return;
  const prior = job.steps.validate;
  if (!prior) return;
  const original = (prior.output ?? {}) as Record<string, unknown>;
  store.save(jobId, {
    steps: {
      ...job.steps,
      validate: {
        ...prior,
        output: { ...original, ...corrections },
        modelOutput: prior.modelOutput ?? original,
        confirmedAt: new Date().toISOString(),
      },
    },
    nextWave: 1,
    status: "paused",
  });
}

function finish(
  store: MemoryJobStore,
  jobId: string,
  steps: StepStates,
  ranSteps: StepId[],
): DryAdvance {
  const blocked = blockedBy(steps);
  if (blocked.length) {
    const message = `Required step(s) did not complete: ${blocked.join(", ")}`;
    store.save(jobId, { steps, status: "failed", lastError: message });
    return { wave: null, ranSteps, done: false, error: message };
  }

  const job = store.get(jobId)!;
  const o = outputsFromSteps(steps);
  const v = o.validate;
  const workforceData = o.workforce
    ? { ...o.workforce, benefitDesign: o.benefitdesign ?? [] }
    : null;

  const result: ResearchResult = {
    company: v?.name ?? job.input.companyName,
    website: v?.website ?? null,
    industry: v?.industry ?? null,
    hq: v?.hq ?? null,
    size: v?.size ?? null,
    profile: o.profile ?? "",
    benefits: o.benefits ?? "",
    financial: o.financial ?? "",
    linkedinData: o.linkedin ?? "",
    regulatory: o.regulatory?.regulatory ?? "",
    statesData: o.regulatory?.statesData ?? null,
    workforceData,
    scores: (o.scoring ?? {}) as ScoreSet,
    brief: o.synthesis ?? "",
    pipelineVersion: PIPELINE_VERSION,
  };

  store.save(jobId, { steps, nextWave: WAVES.length, status: "complete" });
  return { wave: WAVES.length - 1, ranSteps, done: true, result };
}

export {
  MOCK_RESPONSES as mockResponses,
  STEPS,
  WAVES,
  TOTAL_MODEL_CALLS,
  validatePlan,
  createMockClient,
};
