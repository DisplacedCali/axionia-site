"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { sendEmail, reportReleased } from "@/lib/email";

type Result = { ok: true } | { ok: false; error: string };

/* ─────────────── request status ─────────────── */

export async function setRequestStatus(
  requestId: string,
  status: "new" | "in_review" | "ready" | "sent" | "archived"
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("report_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

export async function saveAdminNotes(
  requestId: string,
  notes: string
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("report_requests")
    .update({ admin_notes: notes })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

/* ─────────────── alignment validation ─────────────── */

/**
 * Resolve a flagged request. 'cleared' means the affiliation was confirmed;
 * 'restricted' means we declined it on alignment grounds. The note is
 * internal — it's the audit trail for why a request was or wasn't run.
 */
export async function setAlignment(
  requestId: string,
  alignment: "cleared" | "restricted" | "review",
  note?: string
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();

  const patch: Record<string, unknown> = { alignment };
  if (note !== undefined) patch.alignment_note = note;
  // Restricting a request also closes it out of the working queue.
  if (alignment === "restricted") patch.status = "archived";

  const { error } = await admin
    .from("report_requests")
    .update(patch)
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

/* ─────────────── draft report ─────────────── */

/**
 * Creates (or updates) the draft report attached to a request.
 * Versioning: if the company already has released reports, the new draft
 * takes the next version number and points at the one it supersedes.
 */
export async function upsertDraftReport(args: {
  requestId: string;
  title: string;
  summary: string;
}): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: request, error: reqErr } = await admin
    .from("report_requests")
    .select("id, user_id, company_id")
    .eq("id", args.requestId)
    .single();

  if (reqErr || !request) {
    return { ok: false, error: reqErr?.message ?? "Request not found." };
  }

  // existing draft for this request?
  const { data: existing } = await admin
    .from("reports")
    .select("id")
    .eq("request_id", args.requestId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("reports")
      .update({ title: args.title, summary: args.summary })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/requests/${args.requestId}`);
    return { ok: true, reportId: existing.id };
  }

  // find the latest released report for this company to supersede
  let version = 1;
  let supersedesId: string | null = null;

  if (request.company_id) {
    const { data: prior } = await admin
      .from("reports")
      .select("id, version")
      .eq("company_id", request.company_id)
      .eq("status", "ready")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prior) {
      version = (prior.version ?? 1) + 1;
      supersedesId = prior.id;
    }
  }

  const { data: created, error } = await admin
    .from("reports")
    .insert({
      user_id: request.user_id,
      company_id: request.company_id,
      request_id: request.id,
      title: args.title,
      summary: args.summary,
      status: "in_review",
      version,
      supersedes_id: supersedesId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await admin
    .from("report_requests")
    .update({ status: "in_review" })
    .eq("id", args.requestId);

  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true, reportId: created.id };
}

/* ─────────────── files ─────────────── */

export async function registerUploadedFile(args: {
  reportId: string;
  companyId: string | null;
  storagePath: string;
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  requestId: string;
}): Promise<Result> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("report_files").insert({
    report_id: args.reportId,
    company_id: args.companyId,
    storage_path: args.storagePath,
    filename: args.filename,
    content_type: args.contentType ?? null,
    size_bytes: args.sizeBytes ?? null,
    uploaded_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${args.requestId}`);
  return { ok: true };
}

export async function deleteReportFile(
  fileId: string,
  requestId: string
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: file } = await admin
    .from("report_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (file?.storage_path) {
    await admin.storage.from("reports").remove([file.storage_path]);
  }

  const { error } = await admin.from("report_files").delete().eq("id", fileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

/** Short-lived signed URL so private artifacts are never publicly readable. */
export async function signedFileUrl(storagePath: string): Promise<string | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("reports")
    .createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}

/* ─────────────── release ─────────────── */

/**
 * The release gate. Flips the report to 'ready' (which makes it visible to
 * the whole company via RLS and stamps released_at), marks the request sent,
 * and emails the client.
 */
export async function releaseReport(args: {
  reportId: string;
  requestId: string;
}): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: report, error: repErr } = await admin
    .from("reports")
    .select("id, user_id, title")
    .eq("id", args.reportId)
    .single();

  if (repErr || !report) {
    return { ok: false, error: repErr?.message ?? "Report not found." };
  }

  const { error } = await admin
    .from("reports")
    .update({ status: "ready" })
    .eq("id", args.reportId);

  if (error) return { ok: false, error: error.message };

  await admin
    .from("report_requests")
    .update({ status: "sent" })
    .eq("id", args.requestId);

  // notify the client
  const { data: request } = await admin
    .from("report_requests")
    .select("contact_email, contact_name")
    .eq("id", args.requestId)
    .single();

  if (request?.contact_email) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
    const mail = reportReleased(request.contact_name, `${site}/dashboard`);
    await sendEmail({
      to: request.contact_email,
      subject: mail.subject,
      html: mail.html,
      template: "report_released",
      requestId: args.requestId,
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${args.requestId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ─────────────── user management ─────────────── */

export async function setUserRole(
  userId: string,
  role: "client" | "admin"
): Promise<Result> {
  const { user } = await requireAdmin();

  // Guard: don't let an admin strip their own access and lock everyone out.
  if (userId === user.id && role !== "admin") {
    return { ok: false, error: "You can't remove your own admin access." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function assignUserCompany(
  userId: string,
  companyId: string | null
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ company_id: companyId })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
