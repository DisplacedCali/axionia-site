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
