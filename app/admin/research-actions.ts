"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  confirmValidation,
  createJob,
  getActiveJobForRequest,
  getCachedRun,
  getJob,
  promoteRunToReport,
} from "@/lib/modules/research/db";
import { createAnthropicClient } from "@/lib/modules/research/pipeline/llm";
import { advanceJob } from "@/lib/modules/research/pipeline/runner";
import { reviseSection, type RevisableSection } from "@/lib/modules/research/pipeline/revise";
import { assembleReport, releaseBlockers, type ReportEdits, type ReportView } from "@/lib/modules/research/report";
import type { JobInput, ResearchResult } from "@/lib/modules/research/pipeline/types";
import { STEPS } from "@/lib/modules/research/pipeline/plan";

type Result<T = unknown> = ({ ok: true } & (T extends object ? T : object)) | { ok: false; error: string };

/**
 * Server actions for the free-report workflow.
 *
 * Deliberately separate from app/admin/actions.ts: those handle the intake
 * queue and artifact delivery, these handle the research pipeline. Keeping the
 * two apart means the paid tier's artifact flow can grow without tangling with
 * research execution.
 */

/**
 * Start a research job from an existing request.
 *
 * Pulls the company details AND the intake's own `programs` / `context` fields
 * — the client's stated ask, which was previously collected and discarded.
 */
export async function startResearchForRequest(args: {
  requestId: string;
  analystContext?: string;
  force?: boolean;
}): Promise<Result<{ jobId?: string; cached?: boolean; runId?: string; ageDays?: number }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: request, error } = await admin
    .from("report_requests")
    .select("id, company_id, company_name, payload, companies(name, domain)")
    .eq("id", args.requestId)
    .single();

  if (error || !request) return { ok: false, error: error?.message ?? "Request not found." };

  const payload = (request.payload ?? {}) as Record<string, string | null>;
  const company = Array.isArray(request.companies) ? request.companies[0] : request.companies;
  const companyName = (company?.name ?? request.company_name ?? "").trim();

  if (!companyName) {
    return { ok: false, error: "This request has no company name to research." };
  }

  // Offer the cache rather than silently re-spending ten model calls.
  if (!args.force) {
    try {
      const cached = await getCachedRun(companyName);
      if (cached.found) {
        return { ok: true, cached: true, runId: cached.runId, ageDays: cached.ageDays };
      }
    } catch {
      // A cache miss must never block a run.
    }
  }

  const input: JobInput = {
    companyName,
    website: company?.domain ? `https://${company.domain}` : null,
    industry: payload.industry ?? null,
    employees: payload.employees ?? null,
    programs: payload.programs ?? null,
    roleGroups: payload.role_groups ?? null,
    portfolio: (payload.portfolio as JobInput["portfolio"]) ?? null,
    context: payload.context ?? null,
    analystContext: args.analystContext?.trim() || null,
  };

  try {
    const job = await createJob({ input, requestId: request.id, createdBy: user.id });
    revalidatePath(`/admin/requests/${args.requestId}`);
    return { ok: true, jobId: job.id };
  } catch (e) {
    const message = (e as Error).message;
    if (/one_active_per_company/.test(message)) {
      return { ok: false, error: "Research is already running for this company." };
    }
    return { ok: false, error: message };
  }
}

/**
 * Run the next wave. Called repeatedly by the client so progress is visible
 * and a failure costs one wave rather than the whole run.
 */
export async function advanceResearch(jobId: string): Promise<
  Result<{
    status: string;
    wave: number | null;
    done: boolean;
    percent: number;
    runId: string | null;
    steps: Array<{ id: string; label: string; status: string; degraded: boolean; ms: number | null }>;
    tokens: { input: number; output: number };
    retryAfterMs: number | null;
  }>
> {
  await requireAdmin();

  let llm;
  try {
    llm = createAnthropicClient();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  try {
    const r = await advanceJob(jobId, llm);
    return {
      ok: true,
      status: r.job.status,
      wave: r.wave,
      done: r.done,
      percent: r.progress.percent,
      runId: r.runId ?? r.job.runId ?? null,
      steps: STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        status: r.job.steps[s.id]?.status ?? "pending",
        degraded: r.job.steps[s.id]?.degraded ?? false,
        ms: r.job.steps[s.id]?.ms ?? null,
      })),
      tokens: { input: r.job.inputTokens, output: r.job.outputTokens },
      retryAfterMs: r.done ? null : r.wave === null ? 3000 : 250,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * What the model concluded about the company, for the confirmation gate.
 *
 * Returned as a plain shape rather than the raw step so the panel never has to
 * know the pipeline's internals to render a form.
 */
export async function pendingIdentity(jobId: string): Promise<
  Result<{
    confirmed: boolean;
    identity: {
      name: string;
      industry: string;
      hq: string;
      size: string;
      description: string;
      confidence: string;
    };
  }>
> {
  await requireAdmin();
  try {
    const job = await getJob(jobId);
    if (!job) return { ok: false, error: "Job not found." };

    const v = (job.steps.validate?.output ?? {}) as Record<string, unknown>;
    const s = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");

    return {
      ok: true,
      confirmed: Boolean(job.steps.validate?.confirmedAt),
      identity: {
        name: s("name"),
        industry: s("industry"),
        hq: s("hq"),
        size: s("size"),
        description: s("description"),
        confidence: s("confidence") || "unknown",
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Ratify or correct the identity and release the gate.
 *
 * The corrections become the premise the remaining nine model calls are built
 * on. That is the whole point — a fertility vendor once ran as a behavioral
 * health employer for eight consecutive calls because nothing between the
 * first answer and the rest of the report asked a person.
 */
export async function confirmIdentity(args: {
  jobId: string;
  requestId: string;
  corrections: Record<string, string>;
}): Promise<Result<object>> {
  const { user } = await requireAdmin();
  try {
    const job = await confirmValidation({
      jobId: args.jobId,
      corrections: args.corrections,
      confirmedBy: user.id,
    });
    if (!job) {
      return {
        ok: false,
        error: "This job is not waiting for confirmation — it may already have moved on.",
      };
    }
    revalidatePath(`/admin/requests/${args.requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** The in-flight job for a request, so a reload can resume the progress view. */
export async function activeResearchJob(requestId: string) {
  await requireAdmin();
  try {
    const job = await getActiveJobForRequest(requestId);
    if (!job) return null;
    return {
      id: job.id,
      status: job.status,
      runId: job.runId,
      steps: STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        status: job.steps[s.id]?.status ?? "pending",
        degraded: job.steps[s.id]?.degraded ?? false,
        ms: job.steps[s.id]?.ms ?? null,
      })),
    };
  } catch {
    // DATABASE_URL missing or unreachable must not break the admin page.
    return null;
  }
}

/** Job status without advancing it — for resuming a view after a reload. */
export async function researchJobStatus(jobId: string) {
  await requireAdmin();
  const job = await getJob(jobId);
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    runId: job.runId,
    lastError: job.lastError,
    tokens: { input: job.inputTokens, output: job.outputTokens },
    steps: STEPS.map((s) => ({
      id: s.id,
      label: s.label,
      status: job.steps[s.id]?.status ?? "pending",
      degraded: job.steps[s.id]?.degraded ?? false,
      ms: job.steps[s.id]?.ms ?? null,
    })),
  };
}

/**
 * Attach a completed research run to this request's draft report.
 *
 * Writes the run payload into reports.content — the immutable record of what
 * the pipeline produced. Creates the draft if it doesn't exist yet.
 */
export async function attachResearchToReport(args: {
  requestId: string;
  runId: string;
  clientView?: ReportView;
}): Promise<Result<{ reportId: string }>> {
  await requireAdmin();
  const admin = createAdminClient();

  // promote_research_to_report handles company anchoring, the version chain and
  // the report_requests row. Reusing it keeps one code path for that logic.
  let reportId: string;
  try {
    reportId = await promoteRunToReport({ runId: args.runId });
  } catch (e) {
    return { ok: false, error: `Promote failed: ${(e as Error).message}` };
  }

  const { error } = await admin
    .from("reports")
    .update({
      request_id: args.requestId,
      research_run_id: args.runId,
      client_view: args.clientView ?? "summary",
    })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true, reportId };
}

/**
 * Save the admin's edit overlay.
 *
 * Never touches `content`. Corrections stay reversible and the model's original
 * output stays inspectable — see migration 010.
 */
export async function saveReportEdits(args: {
  reportId: string;
  requestId: string;
  edits: ReportEdits;
  clientView?: ReportView;
  title?: string;
  markReviewed?: boolean;
}): Promise<Result<object>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  /*
    Every score override needs a stated reason, checked here rather than only in
    the form. Two reasons it lives server-side: a form validation is bypassed by
    any other call path, and this is the discipline the paid tier is built on —
    see docs/PAID_REVIEW_DESIGN.md. Turning it on now means free reports
    accumulate the same ledger, so the practice is established before a client
    is waiting on it.

    Prose edits are exempt: you can read what changed in a paragraph. You cannot
    read why a number moved.
  */
  const scores = args.edits.scores ?? {};
  const notes = { ...(args.edits.scoreNotes ?? {}) };
  const now = new Date().toISOString();
  const unexplained: string[] = [];

  for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
    if (typeof scores[key] !== "number") continue;
    const rationale = notes[key]?.rationale?.trim();
    if (!rationale) {
      unexplained.push(String(key));
      continue;
    }
    // Stamp attribution server-side. A client-supplied `by` is a claim, not a
    // fact — the session is the only thing that can't be lied about.
    notes[key] = { ...notes[key]!, rationale, by: user.id, at: notes[key]?.at ?? now };
  }

  // Drop notes for scores that are no longer overridden, or the overlay
  // accumulates orphaned justifications for numbers that went back to the
  // model's.
  for (const key of Object.keys(notes) as (keyof typeof notes)[]) {
    if (typeof scores[key] !== "number") delete notes[key];
  }

  if (unexplained.length) {
    return {
      ok: false,
      error: `A reason is required for every score you change. Missing: ${unexplained.join(", ")}.`,
    };
  }

  const patch: Record<string, unknown> = {
    edits: {
      ...args.edits,
      scoreNotes: notes,
      editedAt: now,
      editedBy: user.id,
    },
  };
  if (args.clientView) patch.client_view = args.clientView;
  if (typeof args.title === "string" && args.title.trim()) patch.title = args.title.trim();

  // The summary column is what the dashboard list and the release email show,
  // so keep it in step with the edited narrative rather than letting them drift.
  if (args.edits.narrative?.summary?.trim()) {
    patch.summary = args.edits.narrative.summary.trim();
  }

  if (args.markReviewed) {
    patch.reviewed_at = new Date().toISOString();
    patch.reviewed_by = user.id;
  }

  const { error } = await admin.from("reports").update(patch).eq("id", args.reportId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true };
}

/**
 * Pre-release check.
 *
 * Surfaced before the release button rather than after, so the fallback-score
 * block is a fact the admin sees rather than an error they hit.
 */
export async function checkReportReadiness(reportId: string): Promise<{
  blockers: string[];
  hasContent: boolean;
  anyScoreAdjusted: boolean;
  visibleSections: string[];
  withheldSections: string[];
}> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("reports")
    .select("content, edits, client_view, reviewed_at")
    .eq("id", reportId)
    .single();

  const content = (data?.content ?? null) as ResearchResult | null;
  if (!content) {
    return {
      blockers: ["No research output attached to this report."],
      hasContent: false,
      anyScoreAdjusted: false,
      visibleSections: [],
      withheldSections: [],
    };
  }

  const edits = (data?.edits ?? {}) as ReportEdits;
  const assembled = assembleReport({
    content,
    edits,
    view: (data?.client_view ?? "summary") as ReportView,
  });

  return {
    blockers: releaseBlockers({ content, edits, reviewedAt: data?.reviewed_at ?? null }),
    hasContent: true,
    anyScoreAdjusted: assembled.anyScoreAdjusted,
    visibleSections: assembled.visibleSections,
    withheldSections: assembled.withheldSections,
  };
}


/**
 * Rewrite one section from an analyst comment.
 *
 * The comment is the instruction: "this read is too generous, they've never seen
 * a claims file" produces a rewritten section, rather than the analyst having to
 * type replacement prose themselves. The correction is the part that needs their
 * judgement; the prose is not.
 *
 * Writes into the `edits` overlay. `content` is untouched, so a section can be
 * regenerated repeatedly and the model's original stays on the record.
 */
export async function regenerateSection(args: {
  reportId: string;
  requestId: string;
  section: RevisableSection;
  comment: string;
}): Promise<Result<{ text: string; note: string }>> {
  const { user } = await requireAdmin();

  if (!args.comment.trim()) {
    return { ok: false, error: "Add a comment describing what to change." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select("content, edits, client_view")
    .eq("id", args.reportId)
    .single();

  if (error || !data?.content) {
    return { ok: false, error: error?.message ?? "No research attached to this report." };
  }

  const content = data.content as ResearchResult;
  const edits = (data.edits ?? {}) as ReportEdits;

  // Revise whatever the section currently says — the last revision if there is
  // one, otherwise the model's original. Iterating refines rather than restarts.
  const assembled = assembleReport({
    content,
    edits,
    view: (data.client_view ?? "summary") as ReportView,
  });

  const current =
    args.section === "findings"
      ? assembled.findings.map((f) => f.text).join("\n")
      : args.section === "summary"
        ? assembled.summary
        : args.section === "topOpportunity"
          ? (assembled.callToAction?.headline ?? "")
          : args.section === "profile"
            ? assembled.profile
            : args.section === "regulatory"
              ? assembled.regulatory
              : assembled.brief;

  let llm;
  try {
    llm = createAnthropicClient();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let revised;
  try {
    revised = await reviseSection({
      section: args.section,
      current,
      comment: args.comment.trim(),
      content,
      llm,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const narrative = { ...(edits.narrative ?? {}) };
  if (args.section === "findings") {
    narrative.findings = revised.text
      .split("\n")
      .map((f) => f.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  } else {
    narrative[args.section] = revised.text;
  }

  // Keep the comment and the model's note alongside the revision, so the reason
  // for a change survives past the moment it was made.
  /*
    `previous` is what makes a revision inspectable rather than merely
    described. The note said what changed in prose, which sounds like the same
    thing and isn't: a note claiming "replaced X with plain language" can be
    perfectly accurate while the reader is looking at a different paragraph
    that also contains X, and there's no way to tell from the note alone.

    Keeping the prior text also makes revert free — `content` holds the model's
    original, but not the intermediate state of an iterated revision.
  */
  const revisions = { ...((edits as Record<string, unknown>).revisions as Record<string, unknown> ?? {}) };
  revisions[args.section] = {
    comment: args.comment.trim(),
    note: revised.note,
    previous: current,
    at: new Date().toISOString(),
    by: user.id,
  };

  const { error: saveErr } = await admin
    .from("reports")
    .update({
      edits: { ...edits, narrative, revisions, editedAt: new Date().toISOString(), editedBy: user.id },
      // A revision invalidates any prior review — the text changed since it was
      // read, so it has to be read again.
      reviewed_at: null,
      reviewed_by: null,
      ...(args.section === "summary" ? { summary: revised.text } : {}),
    })
    .eq("id", args.reportId);

  if (saveErr) return { ok: false, error: saveErr.message };

  revalidatePath(`/admin/reports/${args.reportId}`);
  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true, text: revised.text, note: revised.note };
}

/**
 * Undo one revision, restoring what the section said before it.
 *
 * Free to build because `revisions[section].previous` already holds the prior
 * text — and necessary because nothing else could get it back. `content` keeps
 * the model's original, but an iterated revision's intermediate state lived
 * nowhere, so the second regeneration silently destroyed the first.
 *
 * Clears the revision record rather than stacking an "un-revision" on top: a
 * revision that has been undone should stop claiming it happened.
 */
export async function revertRevision(args: {
  reportId: string;
  requestId: string;
  section: RevisableSection;
}): Promise<Result<{ text: string }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("reports")
    .select("edits")
    .eq("id", args.reportId)
    .single();

  if (error) return { ok: false, error: error.message };

  const edits = (data?.edits ?? {}) as ReportEdits;
  const revisions = {
    ...((edits as Record<string, unknown>).revisions as Record<
      string,
      { previous?: string }
    > ?? {}),
  };

  const previous = revisions[args.section]?.previous;
  if (typeof previous !== "string") {
    return {
      ok: false,
      error: "Nothing to revert — this revision predates change tracking.",
    };
  }

  const narrative = { ...(edits.narrative ?? {}) };
  if (args.section === "findings") {
    narrative.findings = previous
      .split("\n")
      .map((f) => f.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  } else {
    narrative[args.section] = previous;
  }

  delete revisions[args.section];

  const { error: saveErr } = await admin
    .from("reports")
    .update({
      edits: {
        ...edits,
        narrative,
        revisions,
        editedAt: new Date().toISOString(),
        editedBy: user.id,
      },
      // The text changed again, so a prior review is stale again.
      reviewed_at: null,
      reviewed_by: null,
      ...(args.section === "summary" ? { summary: previous } : {}),
    })
    .eq("id", args.reportId);

  if (saveErr) return { ok: false, error: saveErr.message };

  revalidatePath(`/admin/reports/${args.reportId}`);
  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true, text: previous };
}

/** Mark a report read by a human. Required before release. */
export async function markReportReviewed(args: {
  reportId: string;
  requestId?: string;
}): Promise<Result<object>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("reports")
    .update({ reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", args.reportId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/reports/${args.reportId}`);
  if (args.requestId) revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true };
}

/** Change which rendering the client gets. */
export async function setClientView(args: {
  reportId: string;
  view: ReportView;
}): Promise<Result<object>> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ client_view: args.view })
    .eq("id", args.reportId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/reports/${args.reportId}`);
  return { ok: true };
}
