/**
 * The wave runner.
 *
 * Advances a job by exactly one wave per call, then persists. That is the
 * resume granularity: a failure costs one wave, not the whole run.
 *
 * Why not one long invocation — Vercel would now allow it (Fluid Compute gives
 * minutes, not seconds). The reason is not the timeout:
 *   · a mid-run failure re-spends every prior call
 *   · progress is invisible until the end
 *   · closing the tab loses everything already paid for
 * One wave at a time fixes all three, and the queue row is the audit trail.
 *
 * SERVER ONLY.
 */

import {
  attachRunId,
  claimJob,
  getJob,
  saveResearchRun,
  saveWaveResult,
} from "../db";
import {
  PIPELINE_VERSION,
  STEPS_BY_ID,
  TOTAL_MODEL_CALLS,
  WAVES,
  blockedBy,
  runnableSteps,
  validatePlan,
} from "./plan";
import { LlmError, type LlmClient, type Usage } from "./llm";
import { StepError, type StepContext } from "./steps";
import type {
  PipelineJob,
  ResearchResult,
  ScoreSet,
  StepId,
  StepOutputs,
  StepStates,
} from "./types";

/** Per-step attempt ceiling before a step is failed or skipped. */
const MAX_STEP_ATTEMPTS = 2;

export interface AdvanceResult {
  job: PipelineJob;
  /** Wave index just executed, or null if nothing ran. */
  wave: number | null;
  ranSteps: StepId[];
  done: boolean;
  progress: { stepsDone: number; totalSteps: number; percent: number };
  runId?: string;
  error?: string;
}

/** Rebuild the accumulated outputs from persisted step state. */
export function outputsFromSteps(steps: StepStates): StepOutputs {
  const out: Record<string, unknown> = {};
  for (const [id, st] of Object.entries(steps)) {
    if (st?.status === "done" && st.output !== undefined) out[id] = st.output;
  }
  return out as StepOutputs;
}

function progressOf(steps: StepStates) {
  const total = WAVES.flat().length;
  const done = Object.values(steps).filter(
    (s) => s?.status === "done" || s?.status === "skipped",
  ).length;
  return { stepsDone: done, totalSteps: total, percent: Math.round((done / total) * 100) };
}

/**
 * Run one wave of a job.
 *
 * Concurrency-safe: claimJob() is a conditional UPDATE, so only one caller wins
 * the transition to 'running'. Everyone else gets `wave: null` and should back
 * off rather than retry immediately.
 */
export async function advanceJob(
  jobId: string,
  llm: LlmClient,
): Promise<AdvanceResult> {
  const planProblems = validatePlan();
  if (planProblems.length) {
    throw new Error(`Pipeline plan is invalid: ${planProblems.join("; ")}`);
  }

  const claimed = await claimJob(jobId);
  if (!claimed) {
    // Either already running elsewhere, or in a terminal state.
    const current = await getJob(jobId);
    if (!current) throw new Error(`Job ${jobId} not found`);
    return {
      job: current,
      wave: null,
      ranSteps: [],
      done: current.status === "complete",
      progress: progressOf(current.steps),
      runId: current.runId ?? undefined,
    };
  }

  const job = claimed;
  const steps: StepStates = { ...job.steps };
  const waveIndex = job.nextWave;

  if (waveIndex >= WAVES.length) {
    return finish(job, steps, llm);
  }

  const wave = [...WAVES[waveIndex]];
  const eligible = runnableSteps(steps, wave);

  // A step already done (from a prior partial wave) is not re-run.
  const toRun = eligible.filter((id) => steps[id]?.status !== "done");

  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  let model: string | null = job.model;

  const results = await Promise.allSettled(
    toRun.map(async (id) => {
      const def = STEPS_BY_ID.get(id)!;
      const prior = steps[id];
      const attempts = (prior?.attempts ?? 0) + 1;
      const startedAt = new Date().toISOString();
      const t0 = Date.now();

      steps[id] = { ...prior, status: "running", attempts, startedAt };

      // Each step gets its own outputs snapshot — steps in a wave are
      // independent by construction, so this is safe and keeps them pure.
      const ctx: StepContext = {
        input: job.input,
        outputs: outputsFromSteps(steps),
        llm: wrapUsage(llm, usage, (m) => (model = m)),
      };

      const output = await def.run(ctx);
      return { id, output, attempts, startedAt, ms: Date.now() - t0 };
    }),
  );

  let hardError: string | null = null;

  results.forEach((r, i) => {
    const id = toRun[i];
    const def = STEPS_BY_ID.get(id)!;

    if (r.status === "fulfilled") {
      steps[id] = {
        status: "done",
        output: r.value.output,
        attempts: r.value.attempts,
        startedAt: r.value.startedAt,
        finishedAt: new Date().toISOString(),
        ms: r.value.ms,
      };
      return;
    }

    const reason = r.reason as Error;
    const message =
      reason instanceof StepError || reason instanceof LlmError
        ? reason.message
        : (reason?.message ?? "unknown error");
    const attempts = (steps[id]?.attempts ?? 1);
    const exhausted = attempts >= MAX_STEP_ATTEMPTS;

    if (!exhausted) {
      // Leave as pending so the next advance() retries this same wave.
      steps[id] = { ...steps[id], status: "pending", attempts, error: message };
      return;
    }

    if (def.optional) {
      // Degrade: mark skipped so dependents can still run.
      steps[id] = { ...steps[id], status: "skipped", attempts, error: message, degraded: true };
    } else {
      steps[id] = { ...steps[id], status: "failed", attempts, error: message };
      hardError = message;
    }
  });

  // Only move to the next wave when every step in this one has settled.
  const settled = wave.every((id) => {
    const st = steps[id]?.status;
    return st === "done" || st === "skipped" || st === "failed";
  });

  if (hardError) {
    const saved = await saveWaveResult({
      jobId: job.id,
      steps,
      nextWave: waveIndex,
      companyId: companyIdFrom(steps) ?? job.companyId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      model,
      status: "failed",
      lastError: hardError,
    });
    return {
      job: saved,
      wave: waveIndex,
      ranSteps: toRun,
      done: false,
      progress: progressOf(steps),
      error: hardError,
    };
  }

  const nextWave = settled ? waveIndex + 1 : waveIndex;
  const isLast = nextWave >= WAVES.length;

  const saved = await saveWaveResult({
    jobId: job.id,
    steps,
    nextWave,
    companyId: job.companyId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    model,
    // 'paused' rather than 'queued' so a stalled retry is distinguishable
    // from a job that has never started.
    status: isLast ? "running" : "paused",
  });

  if (isLast) return finish(saved, steps, llm, toRun);

  return {
    job: saved,
    wave: waveIndex,
    ranSteps: toRun,
    done: false,
    progress: progressOf(steps),
  };
}

/** Wrap a client to accumulate token usage across a wave. */
function wrapUsage(llm: LlmClient, acc: Usage, onModel: (m: string) => void): LlmClient {
  return {
    async complete(args) {
      const r = await llm.complete(args);
      acc.inputTokens += r.usage.inputTokens;
      acc.outputTokens += r.usage.outputTokens;
      onModel(r.model);
      return r;
    },
  };
}

function companyIdFrom(_steps: StepStates): string | null {
  // The company row is created at save time, not during the pipeline — the
  // validate step only resolves identity, it doesn't write.
  return null;
}

/** Assemble the result payload and write the research_runs row. */
async function finish(
  job: PipelineJob,
  steps: StepStates,
  _llm: LlmClient,
  /** Steps executed in the wave that triggered completion, for accurate reporting. */
  ranSteps: StepId[] = [],
): Promise<AdvanceResult> {
  const blocked = blockedBy(steps);
  if (blocked.length) {
    const message = `Required step(s) did not complete: ${blocked.join(", ")}`;
    const saved = await saveWaveResult({
      jobId: job.id,
      steps,
      nextWave: job.nextWave,
      inputTokens: 0,
      outputTokens: 0,
      status: "failed",
      lastError: message,
    });
    return {
      job: saved,
      wave: null,
      ranSteps,
      done: false,
      progress: progressOf(steps),
      error: message,
    };
  }

  const o = outputsFromSteps(steps);
  const v = o.validate;

  // benefitdesign is attached to workforceData because that is the shape the
  // existing report tabs and the benefit_gaps insert already expect.
  const workforceData = o.workforce
    ? { ...o.workforce, benefitDesign: o.benefitdesign ?? [] }
    : null;

  const result: ResearchResult = {
    company: v?.name ?? job.input.companyName,
    website: v?.website ?? job.input.website ?? null,
    industry: v?.industry ?? job.input.industry ?? null,
    hq: v?.hq ?? null,
    size: v?.size ?? job.input.employees ?? null,
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

  const { runId } = await saveResearchRun(result);
  await attachRunId(job.id, runId);

  const saved = await saveWaveResult({
    jobId: job.id,
    steps,
    nextWave: WAVES.length,
    inputTokens: 0,
    outputTokens: 0,
    status: "complete",
  });

  return {
    job: { ...saved, runId },
    wave: WAVES.length - 1,
    ranSteps,
    done: true,
    progress: progressOf(steps),
    runId,
  };
}

/**
 * Drive a job to completion in one process. Convenient for scripts and dry
 * runs; the API route advances one wave per request instead so the browser can
 * show progress.
 */
export async function runJobToCompletion(
  jobId: string,
  llm: LlmClient,
  opts?: { maxWaves?: number; onWave?: (r: AdvanceResult) => void },
): Promise<AdvanceResult> {
  const limit = opts?.maxWaves ?? WAVES.length * MAX_STEP_ATTEMPTS + 2;
  let last: AdvanceResult | null = null;

  for (let i = 0; i < limit; i++) {
    const r = await advanceJob(jobId, llm);
    opts?.onWave?.(r);
    last = r;
    if (r.done || r.error) return r;
    if (r.wave === null && !r.done) break; // claimed elsewhere
  }
  if (!last) throw new Error("runJobToCompletion made no progress");
  return last;
}

export { TOTAL_MODEL_CALLS, WAVES, PIPELINE_VERSION };
