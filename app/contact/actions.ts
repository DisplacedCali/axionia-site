"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { domainFromEmail, isCorporateDomain } from "@/lib/company";
import { identifySession, track } from "@/lib/analytics";

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
export async function noteContactSubmitted(email: string) {
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
  } catch {
    /* swallowed on purpose */
  }
}
