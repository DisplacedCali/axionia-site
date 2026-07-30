import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/authApi";
import { cancelJob, getJob } from "@/lib/modules/research/db";
import { STEPS, WAVES } from "@/lib/modules/research/pipeline/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Job status and per-step progress. Read-only; does not advance the job. */
export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } },
) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  try {
    const job = await getJob(params.jobId);
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

    const settled = Object.values(job.steps).filter(
      (s) => s?.status === "done" || s?.status === "skipped",
    ).length;

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      input: job.input,
      nextWave: job.nextWave,
      totalWaves: WAVES.length,
      attempts: job.attempts,
      lastError: job.lastError,
      runId: job.runId,
      tokens: { input: job.inputTokens, output: job.outputTokens },
      model: job.model,
      progress: {
        stepsDone: settled,
        totalSteps: WAVES.flat().length,
        percent: Math.round((settled / WAVES.flat().length) * 100),
      },
      steps: STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        emoji: s.emoji,
        optional: s.optional,
        status: job.steps[s.id]?.status ?? "pending",
        ms: job.steps[s.id]?.ms ?? null,
        degraded: job.steps[s.id]?.degraded ?? false,
        error: job.steps[s.id]?.error ?? null,
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Cancel a job. Completed work is kept — only the queue state changes. */
export async function DELETE(
  _req: Request,
  { params }: { params: { jobId: string } },
) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  try {
    await cancelJob(params.jobId);
    return NextResponse.json({ ok: true, jobId: params.jobId, status: "cancelled" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
