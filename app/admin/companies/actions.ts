"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";

const STAGES = [
  "lead",
  "engaged",
  "analysis",
  "proposal",
  "client",
  "dormant",
  "declined",
] as const;

/**
 * Updates pipeline fields on a company.
 *
 * Partial by design — the panel saves one field at a time as it changes, so
 * anything absent from the patch is left alone rather than nulled. The
 * alternative (send the whole object every time) races badly when two fields
 * are edited in quick succession.
 *
 * stage_changed_at is stamped by a trigger, not here. Three places write a
 * stage and only the database sees all of them.
 */
export async function updateCrm(
  companyId: string,
  patch: {
    stage?: string;
    ownerId?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const update: Record<string, unknown> = {};

  if (patch.stage !== undefined) {
    if (!STAGES.includes(patch.stage as (typeof STAGES)[number])) {
      return { ok: false, error: `Unknown stage: ${patch.stage}` };
    }
    update.stage = patch.stage;
  }
  if (patch.ownerId !== undefined) update.owner_id = patch.ownerId;
  if (patch.nextAction !== undefined) {
    update.next_action = patch.nextAction?.slice(0, 400) || null;
  }
  if (patch.nextActionAt !== undefined) update.next_action_at = patch.nextActionAt;

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await createAdminClient()
    .from("companies")
    .update(update)
    .eq("id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/* ─────────────── brief ─────────────── */

/**
 * The company brief — who they are and why they matter, in your words.
 *
 * `companies.notes` has existed since 002 and the hub has always rendered it.
 * Nothing could ever write it, so in practice it was a column that displayed
 * an empty string. This is the missing half.
 *
 * Separate from `updateCrm` on purpose: that one saves on every keystroke's
 * blur because its fields are selects and dates. A paragraph wants an explicit
 * save, and mixing the two would either make the brief lossy or make the
 * selects sluggish.
 */
export async function updateBrief(
  companyId: string,
  notes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("companies")
    .update({ notes: notes.trim().slice(0, 4000) || null })
    .eq("id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/* ─────────────── contacts ─────────────── */

/**
 * A person you've met, whether or not they ever sign up.
 *
 * See migration 025 for why this isn't a `profiles` row. The short version:
 * profiles.id is the join every RLS policy reads, and a profile that can't
 * authenticate is a hole rather than a contact.
 */
export async function addContact(
  companyId: string,
  contact: { name: string; title?: string; email?: string; source?: string; notes?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { profile: staff } = await requireStaff();

  const name = contact.name?.trim();
  if (!name) return { ok: false, error: "A contact needs a name." };

  const { error } = await createAdminClient().from("contacts").insert({
    company_id: companyId,
    name: name.slice(0, 200),
    title: contact.title?.trim().slice(0, 200) || null,
    email: contact.email?.trim().toLowerCase().slice(0, 320) || null,
    source: contact.source?.trim().slice(0, 400) || null,
    notes: contact.notes?.trim().slice(0, 4000) || null,
    created_by: staff?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

export async function removeContact(
  companyId: string,
  contactId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/* ─────────────── steps ─────────────── */

export async function addStep(
  companyId: string,
  step: { step: string; dueOn?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { profile: staff } = await requireStaff();

  const text = step.step?.trim();
  if (!text) return { ok: false, error: "A step needs a description." };

  const { error } = await createAdminClient().from("company_steps").insert({
    company_id: companyId,
    step: text.slice(0, 400),
    due_on: step.dueOn || null,
    created_by: staff?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/**
 * Close a step, or reopen it.
 *
 * `done_at` carries when rather than whether (migration 025, decision 3), so
 * reopening clears the timestamp rather than setting a second flag. There is
 * only ever one answer to "is this open".
 */
export async function toggleStep(
  companyId: string,
  stepId: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("company_steps")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", stepId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

export async function removeStep(
  companyId: string,
  stepId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("company_steps")
    .delete()
    .eq("id", stepId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/* ─────────────── firm ─────────────── */

/**
 * Group a company under a firm, or detach it.
 *
 * Resolve-or-create by name for the same reason the research form does it:
 * the moment you need a firm to exist is while you're looking at the company
 * that belongs to it.
 *
 * Refuses on an alias. Migration 024 has a check constraint saying a merged
 * row cannot carry a firm_id, so the database would reject this anyway — but
 * a clear message beats a constraint violation surfacing as a 500.
 */
export async function setCompanyFirm(
  companyId: string,
  firmName: string,
  kind: "investor" | "operator" = "investor",
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("id, merged_into")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return { ok: false, error: "No such company." };
  if (company.merged_into) {
    return {
      ok: false,
      error:
        "This row is an alias of another company. Group the surviving company instead — the alias follows it.",
    };
  }

  const name = firmName.trim();

  if (!name) {
    const { error } = await admin
      .from("companies")
      .update({ firm_id: null })
      .eq("id", companyId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/companies/${companyId}`);
    revalidatePath("/admin/firms");
    return { ok: true };
  }

  const { data: existing } = await admin
    .from("firms")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  let firmId = existing?.id ?? null;
  if (!firmId) {
    const { data: created, error: createErr } = await admin
      .from("firms")
      .insert({ name: name.slice(0, 200), kind })
      .select("id")
      .single();
    if (createErr) return { ok: false, error: createErr.message };
    firmId = created.id;
  }

  const { error } = await admin
    .from("companies")
    .update({ firm_id: firmId })
    .eq("id", companyId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/firms");
  return { ok: true };
}
