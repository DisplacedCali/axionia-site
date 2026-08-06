"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  domainFromEmail,
  isCorporateDomain,
  companyNameFromDomain,
  resolveCompanyByDomain,
} from "@/lib/company";
import { checkAlignment } from "@/lib/alignment";
import { identifySession, track } from "@/lib/analytics";
import {
  sendEmail,
  requestReceivedNew,
  requestReceivedRefresh,
  adminNewRequest,
} from "@/lib/email";

export type SubmitResult =
  | {
      ok: true;
      kind: "new" | "refresh";
      companyName: string | null;
      requestId: string;
      needsValidation: boolean;
    }
  | { ok: false; error: string };

/**
 * Called after OTP verification. Resolves the company from the email domain,
 * checks whether that company already has a released report, records the
 * request, and fires confirmation + admin notification email.
 */
export async function submitReportRequest(formData: {
  employees?: string;
  industry?: string;
  /** Free text, e.g. "hygienists, dental assistants, front office". */
  roleGroups?: string;
  programs?: string;
  context?: string;
  /**
   * The optional detail step. Structured on purpose — program categories as a
   * list rather than prose is what makes a record comparable across employers,
   * which is the entire point of collecting it.
   *
   * Deliberately contains NO census and no member-level anything. See /privacy.
   */
  portfolio?: {
    funding?: string;
    states?: string;
    tiers?: string;
    categories?: string[];
    vendors?: string;
    carriers?: string;
  };
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
    // Follows a merge — see resolveCompanyByDomain. Reading companies by
    // domain directly would attach this request to an alias.
    const existing = await resolveCompanyByDomain(admin, domain);

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

  // ── does the subject company match the requester's domain? ──
  // A mismatch is the shape of a broker researching a prospect or someone
  // pulling intelligence on a competitor. Flag for review; never auto-block.
  const alignment = checkAlignment(companyName, domain);

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
      alignment: alignment.status,
      alignment_reason: alignment.reason,
      payload: {
        employees: formData.employees ?? null,
        industry: formData.industry ?? null,
        role_groups: formData.roleGroups?.trim() || null,
        portfolio: (() => {
          const p = formData.portfolio;
          if (!p) return null;
          const clean = {
            funding: p.funding?.trim() || null,
            states: p.states?.trim() || null,
            tiers: p.tiers?.trim() || null,
            categories: p.categories?.length ? p.categories : null,
            vendors: p.vendors?.trim() || null,
            carriers: p.carriers?.trim() || null,
          };
          // All-empty means they opened the panel and closed it again. Storing
          // an object of nulls would make "did they answer" unanswerable.
          return Object.values(clean).some(Boolean) ? clean : null;
        })(),
        programs: formData.programs ?? null,
        context: formData.context ?? null,
        email_domain: domain,
        personal_email: !corporate,
      },
    })
    .select("id")
    .single();

  if (reqErr) return { ok: false, error: reqErr.message };

  /*
    The stitch. Everything this visitor read before this moment was anonymous;
    now we know the person and the company, so their whole session gets stamped
    retroactively. This is the point of the analytics table — "what did they
    read on the way to converting" is unanswerable if identity only applies
    from here forward.
  */
  await identifySession({ userId: profile?.id ?? null, companyId });
  await track({
    event: "scorer_request",
    path: "/request-report",
    userId: profile?.id ?? null,
    companyId,
  });

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
      thirdParty: alignment.status === "review",
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

  return {
    ok: true,
    kind,
    companyName,
    requestId: request.id,
    needsValidation: alignment.status === "review",
  };
}
