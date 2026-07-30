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

/* ─────────────── admin-initiated research ─────────────── */

/**
 * Start research on any company, with or without a user account.
 *
 * The company row is the anchor: output lands in that company's folder and
 * waits there. If someone from the company later signs up with a matching
 * email domain, the company-scoped RLS policy means released reports become
 * visible to them automatically — no backfill needed.
 */
export async function createAdminRequest(input: {
  companyName: string;
  domain?: string;
  employees?: string;
  industry?: string;
  notes?: string;
}): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const companyName = input.companyName.trim();
  if (!companyName) return { ok: false, error: "Company name is required." };

  const rawDomain = (input.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const domain = rawDomain || null;

  // ── resolve or create the company ──
  let companyId: string | null = null;

  if (domain) {
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();
    companyId = existing?.id ?? null;
  }

  if (!companyId) {
    // No domain given: fall back to matching on name so repeat research on the
    // same company doesn't create duplicate folders.
    if (!domain) {
      const { data: byName } = await admin
        .from("companies")
        .select("id")
        .ilike("name", companyName)
        .maybeSingle();
      companyId = byName?.id ?? null;
    }

    if (!companyId) {
      const { data: created, error: createErr } = await admin
        .from("companies")
        .insert({
          // A synthetic domain keeps the unique constraint satisfied when we
          // genuinely don't know one; it's replaced the moment a real contact
          // arrives from that company.
          domain: domain ?? `internal.${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name: companyName,
          notes: "Created by admin-initiated research.",
        })
        .select("id")
        .single();
      if (createErr) return { ok: false, error: createErr.message };
      companyId = created.id;
    }
  }

  // ── refresh or first pull? ──
  let kind: "new" | "refresh" = "new";
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "ready");
  if ((count ?? 0) > 0) kind = "refresh";

  const { data: request, error } = await admin
    .from("report_requests")
    .insert({
      user_id: null,
      company_id: companyId,
      contact_email: null,
      contact_name: null,
      company_name: companyName,
      kind,
      status: "in_review",
      origin: "admin",
      // No requester, so there's no alignment question to answer.
      alignment: "cleared",
      alignment_reason: "Admin-initiated research — no external requester.",
      admin_notes: input.notes || null,
      payload: {
        employees: input.employees || null,
        industry: input.industry || null,
        email_domain: domain,
        admin_initiated: true,
      },
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true, requestId: request.id };
}

/* ─────────────── alignment validation ─────────────── */

/**
 * Classify a flagged request.
 *   cleared      it is their own employer after all — proceed as normal
 *   third_party  a paid research engagement on another organisation
 *   restricted   declined
 * The note is internal — the audit trail for how a request was routed.
 */
export async function setAlignment(
  requestId: string,
  alignment: "cleared" | "third_party" | "restricted" | "review",
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

  // Notify the client — but admin-initiated research has no requester to
  // notify. The report simply sits in the company folder until someone from
  // that company signs up, at which point RLS makes it visible to them.
  const { data: request } = await admin
    .from("report_requests")
    .select("contact_email, contact_name, origin")
    .eq("id", args.requestId)
    .single();

  if (request?.contact_email) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
    const mail = reportReleased(request.contact_name, `${site}/dashboard`, site);
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
