import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/authApi";
import { createAnthropicClient } from "@/lib/modules/research/pipeline/llm";
import { advanceJob } from "@/lib/modules/research/pipeline/runner";
import { STEPS, WAVES } from "@/lib/modules/research/pipeline/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 300s ceiling. A wave is 10–25s in practice, so this is headroom for a slow
 * model call rather than an expectation — the whole point of advancing one wave
 * per request is that no single invocation needs to be long.
 */
export const maxDuration = 300;

/**
 * Execute the next wave of a research job.
 *
 * Call repeatedly until `done` is true. Safe to call concurrently: claimJob()
 * is a conditional UPDATE, so a second caller gets `wave: null` and should back
 * off rather than retry immediately.
 *
 * Safe to abandon: the job keeps its position, and a later call resumes from
 * the last completed wave instead of re-spending it.
 */
export async function POST(
  _req: Request,
  { params }: { params: { jobId: string } },
) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  const { jobId } = params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  let llm;
  try {
    llm = createAnthropicClient();
  } catch (e) {
    // Missing API key is a configuration problem, not a job failure — don't
    // burn an attempt on the job for it.
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  try {
    const result = await advanceJob(jobId, llm);

    return NextResponse.json({
      jobId,
      status: result.job.status,
      wave: result.wave,
      totalWaves: WAVES.length,
      ranSteps: result.ranSteps,
      done: result.done,
      progress: result.progress,
      runId: result.runId ?? null,
      error: result.error ?? null,
      tokens: {
        input: result.job.inputTokens,
        output: result.job.outputTokens,
      },
      steps: STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        emoji: s.emoji,
        optional: s.optional,
        status: result.job.steps[s.id]?.status ?? "pending",
        ms: result.job.steps[s.id]?.ms ?? null,
        degraded: result.job.steps[s.id]?.degraded ?? false,
        error: result.job.steps[s.id]?.error ?? null,
      })),
      // Nudge for the caller's poll loop. `wave: null` means someone else holds
      // the claim, so wait longer.
      retryAfterMs: result.done ? null : result.wave === null ? 3000 : 250,
    });
  } catch (e) {
    const message = (e as Error).message;
    console.error(`[research] advance ${jobId} failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
