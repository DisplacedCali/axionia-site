"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Mark a lead dealt with, or put it back.
 *
 * `handled_at` is the only state, deliberately — see migration 019. The
 * question worth asking of an inquiry is whether someone answered it, and
 * every richer pipeline invented before there are enough leads to need one
 * gets abandoned half-populated.
 */
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
