import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/authApi";
import { createJob, getCachedRun, listJobs } from "@/lib/modules/research/db";
import { TOTAL_MODEL_CALLS, WAVES } from "@/lib/modules/research/pipeline/plan";
import type { JobInput } from "@/lib/modules/research/pipeline/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start a research job, or list the queue.
 *
 * Creating a job does NOT run it — POST to /[jobId]/advance to execute a wave.
 * Keeping creation and execution separate means a double-submit costs a queue
 * row rather than ten model calls, and the unique partial index on
 * pipeline_jobs blocks a second live job for the same company.
 *
 * Admin only: the pipeline spends real money per call. Entitlement checks for
 * paid modules land in step 4.
 */
export async function POST(req: Request) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  let body: Partial<JobInput> & { requestId?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  if (!companyName) {
    return NextResponse.json({ error: "companyName is required." }, { status: 400 });
  }

  // Offer the cache before spending anything. The caller decides — `force: true`
  // runs anyway, which is what a deliberate refresh does.
  if (!body.force) {
    try {
      const cached = await getCachedRun(companyName);
      if (cached.found) {
        return NextResponse.json(
          {
            cached: true,
            isFresh: cached.isFresh,
            ageDays: cached.ageDays,
            runId: cached.runId,
            runDate: cached.runDate,
            data: cached.data,
            message: cached.isFresh
              ? "Fresh research already exists for this company. Pass force:true to re-run."
              : "Research exists but is past the 30-day refresh window. Pass force:true to re-run.",
          },
          { status: 200 },
        );
      }
    } catch (e) {
      // A cache-lookup failure must not block a run.
      console.error("[research] cache check failed:", (e as Error).message);
    }
  }

  const input: JobInput = {
    companyName,
    website: body.website?.trim() || null,
    industry: body.industry?.trim() || null,
    employees: body.employees?.trim() || null,
    notes: body.notes?.trim() || null,
  };

  try {
    const job = await createJob({
      input,
      requestId: body.requestId ?? null,
      createdBy: auth.userId,
    });

    return NextResponse.json(
      {
        cached: false,
        jobId: job.id,
        status: job.status,
        waves: WAVES.length,
        totalModelCalls: TOTAL_MODEL_CALLS,
        next: `/api/modules/research/${job.id}/advance`,
      },
      { status: 201 },
    );
  } catch (e) {
    const message = (e as Error).message;
    // The partial unique index surfaces here.
    if (/pipeline_jobs_one_active_per_company/.test(message)) {
      return NextResponse.json(
        { error: "A research job is already running for this company." },
        { status: 409 },
      );
    }
    console.error("[research] createJob failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ jobs: await listJobs(50) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
