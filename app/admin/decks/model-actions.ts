"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The financial model, hosted rather than emailed around from a laptop.
 *
 * ── Staff only, and that is the whole security model ──
 *
 * There is no share link and no investor-facing route. Tom downloads it and
 * sends it himself when somebody needs it. That is a deliberate stopping
 * point: a signed link would control who receives the file and expire, but an
 * xlsx cannot be watermarked the way the deck PDF can and cannot be revoked
 * once saved — so the link would protect the delivery and not the document,
 * and building it would imply a guarantee that isn't there. When the sharing
 * is manual, the limitation is obvious to the person doing it.
 *
 * ── Versions, not a current file ──
 *
 * Every upload lands under its own timestamp and nothing is overwritten. A
 * financial model changes weekly, and "which version did that investor see" is
 * a question with real consequences that a single mutable object cannot
 * answer. Storage listing is the index — no table and therefore no migration,
 * which matters because migrations written in one session and never applied
 * have already cost this project five debugging round trips.
 *
 * The bucket is `reports`, which is private and already has no client-facing
 * policy: every read goes through a short-lived signed URL minted here with
 * the service role. `internal/` prefixes the path so a future policy scoped to
 * company folders can never accidentally match it.
 */

const BUCKET = "reports";
const PREFIX = "internal/financial-model";

export type ModelVersion = {
  path: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number | null;
};

/** Newest first. Empty is a valid answer and renders as an empty state. */
export async function listModelVersions(): Promise<ModelVersion[]> {
  await requireStaff();
  const admin = createAdminClient();

  const { data, error } = await admin.storage.from(BUCKET).list(PREFIX, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });

  // A read failure and an empty folder look identical downstream, and empty
  // looks like data loss — same reasoning as /admin/companies reading its
  // query error. Throwing surfaces it rather than rendering "no versions".
  if (error) throw new Error(`Could not list the model folder: ${error.message}`);
  if (!data) return [];

  return data
    .filter((o) => o.name && !o.name.startsWith("."))
    .map((o) => {
      // Names are `<epoch>-<original>`, so the timestamp survives even though
      // storage's own created_at is not returned by every driver version.
      const dash = o.name.indexOf("-");
      const stamp = Number(o.name.slice(0, dash));
      return {
        path: `${PREFIX}/${o.name}`,
        filename: dash > 0 ? o.name.slice(dash + 1) : o.name,
        uploadedAt: Number.isFinite(stamp)
          ? new Date(stamp).toISOString()
          : (o.created_at ?? new Date(0).toISOString()),
        sizeBytes:
          (o.metadata as { size?: number } | null)?.size ?? null,
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/**
 * A short-lived signed URL for one version.
 *
 * Ten minutes, matching signedFileUrl in app/admin/actions.ts. The path is
 * checked against the prefix rather than trusted: it arrives from a client
 * component, and an unchecked path would let any staff member mint a URL for
 * any object in the bucket — which is every client's report artifacts.
 */
export async function modelDownloadUrl(
  path: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireStaff();

  if (!path.startsWith(`${PREFIX}/`) || path.includes("..")) {
    return { ok: false, error: "That path isn't a model version." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10, { download: true });

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "Could not create a link." };
  }
  return { ok: true, url: data.signedUrl };
}

/**
 * Removes one version.
 *
 * Kept deliberately narrow: it deletes a single object under the prefix and
 * nothing recursive. Superseded versions are cheap to store and the reason to
 * keep them is the same reason they exist — but a mistaken upload should be
 * removable without a console visit.
 */
export async function deleteModelVersion(
  path: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();

  if (!path.startsWith(`${PREFIX}/`) || path.includes("..")) {
    return { ok: false, error: "That path isn't a model version." };
  }

  const { error } = await createAdminClient().storage.from(BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/decks");
  return { ok: true };
}
