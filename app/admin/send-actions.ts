"use server";

import { revalidatePath } from "next/cache";
import { requireRelease } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, reportReleased } from "@/lib/email";
import { mintReportLink, reportLinksEnabled } from "@/lib/reportLinks";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";

/**
 * Send a released report to someone who may have no account.
 *
 * Gated by `requireRelease()`, not `requireStaff()`. This reaches a person
 * outside the building with a named employer's analysis — it belongs on the
 * same side of the privilege boundary as releasing, because in every way that
 * matters it *is* releasing, just to one more person.
 *
 * Two modes, chosen per send:
 *
 *   invite — create the auth user, link them to the company if there is one,
 *            and email a login link. RLS then does the authorisation exactly
 *            as it does for the original requester.
 *
 *   link   — mint an HMAC-signed, expiring URL bound to this report id. No
 *            account, no friction, and anyone holding the URL can read it.
 *            Revocation is by rotating REPORT_LINK_SECRET, not by deleting
 *            the row — see migration 018.
 */
export async function sendReportTo(args: {
  reportId: string;
  requestId?: string | null;
  email: string;
  fullName?: string;
  organisation?: string;
  companyId?: string | null;
  mode: "invite" | "link";
  days?: number;
}): Promise<Result<{ url: string; created: boolean }>> {
  const { user } = await requireRelease();
  const admin = createAdminClient();

  const email = args.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "That doesn't look like an email address." };
  }

  const { data: report } = await admin
    .from("reports")
    .select("id, status, title, company_id")
    .eq("id", args.reportId)
    .maybeSingle();

  if (!report) return { ok: false, error: "Report not found." };

  /*
    Only released reports. A draft is invisible to its own client by RLS, and
    an admin emailing one to an outsider would route around the single gate
    the whole review process exists to defend.
  */
  if (report.status !== "ready") {
    return {
      ok: false,
      error: "Release the report first — drafts can't be sent to anyone.",
    };
  }

  const companyId = args.companyId ?? report.company_id ?? null;
  let url: string;
  let created = false;
  let linkLabel: string | null = null;
  let expiresAt: string | null = null;
  let userId: string | null = null;

  if (args.mode === "link") {
    if (!reportLinksEnabled()) {
      return {
        ok: false,
        error:
          "Signed links are unavailable — REPORT_LINK_SECRET (or DECK_LINK_SECRET) isn't set, or is under 24 characters.",
      };
    }
    const days = args.days ?? 14;
    linkLabel = args.fullName?.trim() || email;
    const token = mintReportLink(report.id, linkLabel, days);
    if (!token) return { ok: false, error: "Could not mint a link." };
    url = `${site()}/reports/${report.id}?k=${token}`;
    expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
  } else {
    /*
      Look before creating. `createUser` on an existing address returns an
      error that reads like a failure, when the correct outcome is simply to
      reuse the account — someone who already has a login shouldn't be told
      the send failed.
    */
    const { data: existing } = await admin
      .from("profiles")
      .select("id, company_id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      userId = existing.id;
      // Link them to the company if they weren't already, or RLS won't show
      // them a report that belongs to it.
      if (companyId && !existing.company_id) {
        await admin.from("profiles").update({ company_id: companyId }).eq("id", existing.id);
      }
    } else {
      const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: args.fullName?.trim() || null,
          company_name: args.organisation?.trim() || null,
        },
      });
      if (createErr || !authUser?.user) {
        return { ok: false, error: createErr?.message ?? "Could not create the account." };
      }
      userId = authUser.user.id;
      created = true;

      // The handle_new_user trigger creates the profile row; fill in what the
      // trigger can't know.
      await admin
        .from("profiles")
        .update({
          full_name: args.fullName?.trim() || null,
          company_name: args.organisation?.trim() || null,
          company_id: companyId,
        })
        .eq("id", userId);
    }

    // They'll be bounced to login and returned here — see /reports/[id].
    url = `${site()}/reports/${report.id}`;
  }

  const { error: recErr } = await admin
    .from("report_recipients")
    .upsert(
      {
        report_id: report.id,
        email,
        full_name: args.fullName?.trim() || null,
        organisation: args.organisation?.trim() || null,
        company_id: companyId,
        user_id: userId,
        mode: args.mode,
        link_label: linkLabel,
        link_expires_at: expiresAt,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
      },
      { onConflict: "report_id,email" },
    );

  if (recErr) return { ok: false, error: recErr.message };

  const mail = reportReleased(args.fullName?.trim() || null, url, site());
  await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    template: "report_sent_direct",
    requestId: args.requestId ?? null,
  });

  revalidatePath(`/admin/reports/${report.id}`);
  return { ok: true, url, created };
}
