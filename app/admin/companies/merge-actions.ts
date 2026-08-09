"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Every table that points at a company.
 *
 * Listed explicitly rather than discovered, because a merge that misses one
 * leaves data attached to a row that is no longer a company — invisible, and
 * only noticed when a report doesn't appear for someone who should see it.
 * ADD TO THIS LIST when you add a company_id column.
 */
const COMPANY_REFS = [
  "profiles",
  "reports",
  "report_requests",
  "report_files",
  "report_recipients",
  "site_events",
  // 025. Contacts and steps are the two most likely to be noticed by their
  // absence — losing the people you met is worse than losing a file row,
  // because nothing else in the system records that the meeting happened.
  "contacts",
  "company_steps",
  // 026. Recipients hang off the version rather than the company, so they
  // follow it here without needing their own entry.
  "deck_versions",
] as const;

/**
 * Fold one company into another.
 *
 * The duplicate is NOT deleted. It keeps its domain and gains `merged_into`,
 * which turns it from a company into one of the several domains that company
 * uses — because `domain` is what every lookup joins on, and a deleted row is
 * recreated by the next email from that domain.
 *
 * Requires admin: this moves other people's reports between accounts, and
 * getting it wrong shows one employer's analysis to another.
 */
export async function mergeCompanies(args: {
  sourceId: string;
  targetId: string;
}): Promise<Result<{ moved: number }>> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  if (args.sourceId === args.targetId) {
    return { ok: false, error: "That's the same company." };
  }

  const { data: rows, error } = await admin
    .from("companies")
    .select("id, name, domain, merged_into")
    .in("id", [args.sourceId, args.targetId]);

  if (error) return { ok: false, error: error.message };

  const source = rows?.find((r) => r.id === args.sourceId);
  const target = rows?.find((r) => r.id === args.targetId);
  if (!source || !target) return { ok: false, error: "Company not found." };

  if (source.merged_into) {
    return { ok: false, error: `${source.domain} has already been merged.` };
  }

  /*
    Resolve the target to its own head first, so chains can never form. A
    reader following merged_into must be able to stop after one hop — a loop
    would hang every company lookup on the site.
  */
  let head = target;
  if (target.merged_into) {
    const { data: h } = await admin
      .from("companies")
      .select("id, name, domain, merged_into")
      .eq("id", target.merged_into)
      .maybeSingle();
    if (!h) return { ok: false, error: "The target company is in a broken state." };
    head = h;
  }
  if (head.id === source.id) {
    return { ok: false, error: "That would merge a company into itself." };
  }

  // Move the references BEFORE marking the merge. If this fails halfway the
  // source is still a company, which is a visible, fixable state — the
  // reverse leaves rows attached to something that isn't one.
  let moved = 0;
  for (const table of COMPANY_REFS) {
    const { data, error: mvErr } = await admin
      .from(table)
      .update({ company_id: head.id })
      .eq("company_id", source.id)
      .select("id");
    if (mvErr) {
      return {
        ok: false,
        error: `Stopped while moving ${table}: ${mvErr.message}. Nothing was marked merged, so this is safe to retry.`,
      };
    }
    moved += data?.length ?? 0;
  }

  const { error: markErr } = await admin
    .from("companies")
    .update({
      merged_into: head.id,
      merged_at: new Date().toISOString(),
      merged_by: user.id,
    })
    .eq("id", source.id);

  if (markErr) return { ok: false, error: markErr.message };

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${head.id}`);
  return { ok: true, moved };
}

/** Undo a merge. The alias becomes a company again; its old rows stay put. */
export async function unmergeCompany(args: {
  companyId: string;
}): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("companies")
    .update({ merged_into: null, merged_at: null, merged_by: null })
    .eq("id", args.companyId);

  if (error) return { ok: false, error: error.message };

  /*
    Deliberately does NOT move rows back. The merge moved them by company, not
    by origin, so there is no record of which report came from which duplicate
    — and inventing a split would be guessing with client data. Un-merging
    restores the row; re-assigning anything is a manual decision.
  */
  revalidatePath("/admin/companies");
  return { ok: true };
}
