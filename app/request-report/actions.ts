"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  domainFromEmail,
  isCorporateDomain,
  companyNameFromDomain,
} from "@/lib/company";
import {
  sendEmail,
  requestReceivedNew,
  requestReceivedRefresh,
  adminNewRequest,
} from "@/lib/email";

export type SubmitResult =
  | { ok: true; kind: "new" | "refresh"; companyName: string | null }
  | { ok: false; error: string };

/**
 * Called after OTP verification. Resolves the company from the email domain,
 * checks whether that company already has a released report, records the
 * request, and fires confirmation + admin notification email.
 */
export async function submitReportRequest(formData: {
  employees?: string;
  industry?: string;
  programs?: string;
  context?: string;
}): Promise<SubmitResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "You need to be signed in to request a report." };
  }

  const admin = createAdminClient();

  // Profile carries full_name / company_name from signup metadata.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, company_name, company_id")
    .eq("id", user.id)
    .single();

  const email = user.email.toLowerCase();
  const domain = domainFromEmail(email);
  const corporate = isCorporateDomain(domain);

  // ── resolve or create the company (corporate domains only) ──
  let companyId: string | null = profile?.company_id ?? null;
  let companyName: string | null = profile?.company_name ?? null;

  if (!companyId && corporate && domain) {
    const { data: existing } = await admin
      .from("companies")
      .select("id, name")
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      companyId = existing.id;
      companyName = existing.name ?? companyName;
    } else {
      const { data: created, error: createErr } = await admin
        .from("companies")
        .insert({
          domain,
          name: profile?.company_name || companyNameFromDomain(domain),
        })
        .select("id, name")
        .single();

      if (createErr) return { ok: false, error: createErr.message };
      companyId = created?.id ?? null;
      companyName = created?.name ?? companyName;
    }

    if (companyId && profile?.id) {
      await admin.from("profiles").update({ company_id: companyId }).eq("id", profile.id);
    }
  }

  // ── has this company already had a report released? ──
  let kind: "new" | "refresh" = "new";
  if (companyId) {
    const { count } = await admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "ready");
    if ((count ?? 0) > 0) kind = "refresh";
  }

  // ── record the request ──
  const { data: request, error: reqErr } = await admin
    .from("report_requests")
    .insert({
      user_id: user.id,
      company_id: companyId,
      contact_email: email,
      contact_name: profile?.full_name ?? null,
      company_name: companyName,
      kind,
      status: "new",
      payload: {
        employees: formData.employees ?? null,
        industry: formData.industry ?? null,
        programs: formData.programs ?? null,
        context: formData.context ?? null,
        email_domain: domain,
        personal_email: !corporate,
      },
    })
    .select("id")
    .single();

  if (reqErr) return { ok: false, error: reqErr.message };

  // ── email: confirmation to requester, notification to admin ──
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";

  const confirmation =
    kind === "refresh" ? requestReceivedRefresh(companyName) : requestReceivedNew(profile?.full_name);

  await sendEmail({
    to: email,
    subject: confirmation.subject,
    html: confirmation.html,
    template: `request_received_${kind}`,
    requestId: request.id,
  });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    const notice = adminNewRequest({
      contactName: profile?.full_name,
      contactEmail: email,
      companyName,
      kind,
      url: `${site}/admin/requests/${request.id}`,
    });
    await sendEmail({
      to: adminEmail,
      subject: notice.subject,
      html: notice.html,
      template: "admin_new_request",
      requestId: request.id,
    });
  }

  return { ok: true, kind, companyName };
}
