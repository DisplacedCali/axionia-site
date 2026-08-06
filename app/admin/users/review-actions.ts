"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export type ReviewState = "unreviewed" | "legitimate" | "spam";

/**
 * Mark one account. Nothing is ever deleted — see migration 021.
 *
 * `legitimate` is sticky on purpose: it survives every future sweep, so a real
 * client whose name happens to trip the heuristic is confirmed once and never
 * bothers you again.
 */
export async function setAccountReview(args: {
  userId: string;
  state: ReviewState;
}): Promise<Result> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      review_state: args.state,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", args.userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Hide everything currently suspected, in one action.
 *
 * The whole reason triage stays cheap. The caller passes the ids it just
 * showed you, rather than the server recomputing — so you hide exactly the
 * rows you looked at, and a row that arrived in the last second can't be
 * swept without ever being seen.
 *
 * Refuses to touch anything already marked `legitimate`, so a bulk sweep can
 * never undo a human decision.
 */
export async function bulkHideAccounts(
  userIds: string[],
): Promise<Result<{ hidden: number }>> {
  const { user } = await requireAdmin();
  if (!userIds.length) return { ok: true, hidden: 0 };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update({
      review_state: "spam",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .in("id", userIds)
    .neq("review_state", "legitimate")
    // Never sweep staff. A bug in the heuristic must not be able to hide the
    // person holding the only owner account.
    .eq("role", "client")
    .select("id");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true, hidden: data?.length ?? 0 };
}
