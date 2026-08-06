"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { domainFromEmail, isCorporateDomain } from "@/lib/company";
import { identifySession, track } from "@/lib/analytics";
import { sendEmail, adminNewLead } from "@/lib/email";

/**
 * Called after a contact form submits successfully.
 *
 * Separate from the insert, which the form does client-side against an
 * insert-only RLS policy. Nothing here can fail in a way the visitor should
 * see — the lead is already saved by the time this runs, and analytics must
 * never be able to make a successful submission look broken.
 *
 * Resolves the company by email domain WITHOUT creating one. A contact form is
 * weaker evidence of a real account than a report request, and a companies
 * table full of speculative rows makes the CRM list useless.
 */
export async function noteContactSubmitted(
  email: string,
  details?: { fullName?: string; companyName?: string; interest?: string; message?: string },
) {
  try {
    const domain = domainFromEmail(email);
    let companyId: string | null = null;

    if (domain && isCorporateDomain(domain)) {
      const { data } = await createAdminClient()
        .from("companies")
        .select("id")
        .eq("domain", domain)
        .maybeSingle();
      companyId = data?.id ?? null;
    }

    await identifySession({ companyId });
    await track({ event: "contact_submit", path: "/contact", companyId });

    /*
      Tell someone. This never happened before — a contact submission wrote a
      `leads` row and stopped there, with no email and no admin screen showing
      the table, so an inquiry could sit indefinitely with nothing going wrong
      loudly enough to notice.

      Still best-effort and still swallowed: the lead is already saved by the
      time this runs, and /admin/inbox is the channel that doesn't depend on
      RESEND_API_KEY being configured. This is the belt to that braces.
    */
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (adminEmail) {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
      const notice = adminNewLead({
        fullName: details?.fullName || email,
        email,
        companyName: details?.companyName ?? null,
        interest: details?.interest || "general",
        message: details?.message ?? null,
        url: `${site}/admin/inbox`,
      });
      await sendEmail({
        to: adminEmail,
        subject: notice.subject,
        html: notice.html,
        template: "admin_new_lead",
      });
    }
  } catch {
    /* swallowed on purpose */
  }
}
