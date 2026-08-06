"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { domainFromEmail, isCorporateDomain } from "@/lib/company";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Mark a lead dealt with, or put it back.
 *
 * `handled_at` is the only state, deliberately — see migration 019. The
 * question worth asking of an inquiry is whether someone answered it, and
 * every richer pipeline invented before there are enough leads to need one
 * gets abandoned half-populated.
 */
/**
 * Turn an inquiry into a client account.
 *
 * `leads` and `auth.users` are different tables and should stay that way — a
 * contact form silently creating a login would be wrong, and the deck's print
 * gate collects an unverified name and email on purpose. But there was no path
 * between them at all, so the two people who actually engaged existed only as
 * rows in a queue and never appeared under Users.
 *
 * This is the deliberate promotion: a person decides someone is real, and only
 * then does an account exist.
 *
 * Company is resolved, never created. A speculative companies row per inquiry
 * makes the CRM list useless — same rule as `noteContactSubmitted`.
 */
export async function inviteLeadAsClient(args: {
  leadId: string;
}): Promise<Result<{ created: boolean; email: string }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: lead, error } = await admin
    .from("leads")
    .select("id, email, full_name, company_name")
    .eq("id", args.leadId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!lead) return { ok: false, error: "Lead not found." };

  const email = lead.email.trim().toLowerCase();
  const domain = domainFromEmail(email);

  let companyId: string | null = null;
  if (domain && isCorporateDomain(domain)) {
    const { data: co } = await admin
      .from("companies")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();
    companyId = co?.id ?? null;
  }

  // Reuse an existing account rather than failing on the duplicate. Someone
  // who already signed up and then used the contact form is one person.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, company_id")
    .eq("email", email)
    .maybeSingle();

  let created = false;

  if (existing) {
    await admin
      .from("profiles")
      .update({
        // Confirmed real by a human, so future sweeps leave them alone.
        review_state: "legitimate",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        ...(companyId && !existing.company_id ? { company_id: companyId } : {}),
      })
      .eq("id", existing.id);
  } else {
    const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: lead.full_name ?? null,
        company_name: lead.company_name ?? null,
      },
    });
    if (createErr || !authUser?.user) {
      return { ok: false, error: createErr?.message ?? "Could not create the account." };
    }
    created = true;

    await admin
      .from("profiles")
      .update({
        full_name: lead.full_name ?? null,
        company_name: lead.company_name ?? null,
        company_id: companyId,
        review_state: "legitimate",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", authUser.user.id);
  }

  /*
    No email is sent. An unsolicited "here's your account" to someone who
    filled in a contact form reads as presumptuous — you reply to them as a
    person, and the account is simply there when they need it.
  */
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/users");
  return { ok: true, created, email };
}

/**
 * Ignore an inquiry, or bring it back.
 *
 * Distinct from "handled" on purpose. Junk was never answered, so filing it as
 * handled makes the handled list a lie and destroys the only record of what
 * was actually dealt with — which is the one thing that list is for.
 *
 * Never deleted. The row is evidence of what arrived, and the spam corpus is
 * what `lib/leadSignal.ts` is tuned against.
 */
export async function setLeadIgnored(args: {
  leadId: string;
  ignored: boolean;
}): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin
    .from("leads")
    .update(
      args.ignored
        ? { ignored_at: new Date().toISOString(), ignored_by: user.id }
        : { ignored_at: null, ignored_by: null },
    )
    .eq("id", args.leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  return { ok: true };
}

export async function setLeadHandled(args: {
  leadId: string;
  handled: boolean;
  note?: string;
}): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();

  const { error } = await admin
    .from("leads")
    .update(
      args.handled
        ? {
            handled_at: new Date().toISOString(),
            handled_by: user.id,
            handled_note: args.note?.trim() || null,
          }
        : { handled_at: null, handled_by: null, handled_note: null },
    )
    .eq("id", args.leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  return { ok: true };
}
