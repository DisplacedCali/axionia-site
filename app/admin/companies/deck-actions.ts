"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireRelease } from "@/lib/auth";
import { generateDeckCustom, reportMaterial } from "@/lib/deck/generate";
import { sanitiseCustom, type DeckCustom } from "@/lib/deck/custom";
import { sanitiseProposalCustom, type ProposalCustom } from "@/lib/deck/proposalCustom";
import { createShareLink } from "@/app/admin/decks/actions";

type Result = { ok: true } | { ok: false; error: string };
type Audience = "hr" | "cfo" | "broker" | null;

/**
 * Generate a tailored deck version for one company.
 *
 * The source report is REQUIRED and must be released. Not a policy so much as
 * the whole safety model: the agent may only phrase things a person already
 * checked, so if there is nothing checked there is nothing to phrase. Letting
 * this run against a draft would put unreviewed model output one approval
 * click away from a live URL.
 *
 * Always lands as `draft`. Approval is a separate, deliberate act.
 */
export async function generateDeckVersion(args: {
  companyId: string;
  reportId: string;
  audience?: Audience;
  label?: string;
}): Promise<{ ok: true; versionId: string } | { ok: false; error: string }> {
  const { profile: staff } = await requireStaff();
  const admin = createAdminClient();

  const [{ data: company }, { data: report }] = await Promise.all([
    admin.from("companies").select("id, name, domain").eq("id", args.companyId).single(),
    admin
      .from("reports")
      .select("id, title, summary, content, status, company_id")
      .eq("id", args.reportId)
      .single(),
  ]);

  if (!company) return { ok: false, error: "No such company." };
  if (!report) return { ok: false, error: "No such report." };
  if (report.company_id !== args.companyId) {
    return { ok: false, error: "That report belongs to a different company." };
  }
  if (report.status !== "ready") {
    return {
      ok: false,
      error:
        "That report hasn't been released. Tailor from reviewed work only — otherwise the deck inherits whatever the draft got wrong.",
    };
  }

  const material = reportMaterial(report);
  const gen = await generateDeckCustom({
    companyName: company.name || company.domain,
    audience: args.audience ?? null,
    material,
  });
  if (!gen.ok) return { ok: false, error: gen.error };

  const { data, error } = await admin
    .from("deck_versions")
    .insert({
      company_id: args.companyId,
      deck: "buyer",
      audience: args.audience ?? null,
      label:
        args.label?.trim().slice(0, 120) ||
        `${company.name || company.domain} — ${new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })}`,
      generated: gen.custom,
      edits: {},
      status: "draft",
      source_report_id: args.reportId,
      created_by: staff?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save." };

  revalidatePath(`/admin/companies/${args.companyId}`);
  return { ok: true, versionId: data.id };
}

/**
 * Save corrections without touching what the agent produced.
 *
 * `generated` is never written again after insert (migration 026, decision 2).
 * Keeping both means "what did the model actually claim" is still answerable
 * after it has been fixed — which is the only way to tell whether the prompt
 * is improving or you are just editing harder.
 */
export async function editDeckVersion(
  companyId: string,
  versionId: string,
  edits: DeckCustom,
): Promise<Result> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("deck_versions")
    .update({ edits: sanitiseCustom(edits) })
    .eq("id", versionId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/**
 * Approve a version, which is what makes its URL resolve.
 *
 * Separate from generation on purpose. The gap between the two is where a
 * human reads four sentences and decides whether they're true — the single
 * control standing between a model's guess and a projector.
 */
export async function setDeckVersionStatus(
  companyId: string,
  versionId: string,
  status: "draft" | "approved" | "retired",
): Promise<Result> {
  const { profile: staff } = await requireStaff();

  const { error } = await createAdminClient()
    .from("deck_versions")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? (staff?.id ?? null) : null,
    })
    .eq("id", versionId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

export async function deleteDeckVersion(
  companyId: string,
  versionId: string,
): Promise<Result> {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("deck_versions")
    .delete()
    .eq("id", versionId)
    .eq("company_id", companyId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/* ─────────────── proposal deck ─────────────── */

/**
 * Create a proposal version for one company.
 *
 * No generation step — see lib/deck/proposalCustom.ts for why. What this
 * function actually guards is different from generateDeckVersion's job:
 * the report gate still applies (a proposal citing analysis nobody has
 * checked is the same failure buyer decks are guarded against), but the
 * load-bearing check here is `founding_cohort`. The Investment slide reads
 * companies.founding_cohort / fee_rate live at render time (039,
 * lib/foundingCohort.ts) — a company that was never offered those terms
 * would otherwise get a deck that states them anyway, which is exactly
 * the "plausible fabricated row" the house rule exists to prevent, just
 * arrived at through a missing checkbox instead of a model.
 *
 * Gated by requireRelease, the same boundary updateTerms uses — this is a
 * real fee rate about to reach a client, not an internal draft.
 */
export async function createProposalVersion(args: {
  companyId: string;
  reportId: string;
  clientName: string;
  label?: string;
}): Promise<{ ok: true; versionId: string } | { ok: false; error: string }> {
  const { profile: staff } = await requireRelease();
  const admin = createAdminClient();

  const clientName = args.clientName?.trim().slice(0, 120);
  if (!clientName) return { ok: false, error: "Who is this for?" };

  const [{ data: company }, { data: report }] = await Promise.all([
    admin
      .from("companies")
      .select("id, name, domain, founding_cohort")
      .eq("id", args.companyId)
      .single(),
    admin
      .from("reports")
      .select("id, status, company_id")
      .eq("id", args.reportId)
      .single(),
  ]);

  if (!company) return { ok: false, error: "No such company." };
  if (!company.founding_cohort) {
    return {
      ok: false,
      error:
        "This company isn't marked founding cohort in Terms above. The Investment slide states those terms live — check the box there first, or the deck would be stating terms nobody agreed to.",
    };
  }
  if (!report) return { ok: false, error: "No such report." };
  if (report.company_id !== args.companyId) {
    return { ok: false, error: "That report belongs to a different company." };
  }
  if (report.status !== "ready") {
    return {
      ok: false,
      error:
        "That report hasn't been released. A proposal references reviewed work only.",
    };
  }

  const { data, error } = await admin
    .from("deck_versions")
    .insert({
      company_id: args.companyId,
      deck: "proposal",
      label:
        args.label?.trim().slice(0, 120) ||
        `${company.name || company.domain} — Proposal — ${new Date().toLocaleDateString(
          "en-US",
          { month: "short", year: "numeric" },
        )}`,
      generated: sanitiseProposalCustom({ clientName }),
      edits: {},
      status: "draft",
      source_report_id: args.reportId,
      created_by: staff?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save." };

  revalidatePath(`/admin/companies/${args.companyId}`);
  return { ok: true, versionId: data.id };
}

/**
 * Correct the client name without disturbing what was originally typed.
 * Same generated/edits split as editDeckVersion, same reasoning.
 */
export async function editProposalVersion(
  companyId: string,
  versionId: string,
  edits: ProposalCustom,
): Promise<Result> {
  await requireRelease();

  const { error } = await createAdminClient()
    .from("deck_versions")
    .update({ edits: sanitiseProposalCustom(edits) })
    .eq("id", versionId)
    .eq("company_id", companyId)
    .eq("deck", "proposal");

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true };
}

/**
 * Mint a share link for one approved proposal version, already scoped to
 * this company.
 *
 * Reuses createShareLink rather than calling mintDeckLink directly, so
 * proposal links go through the same entity-validation path (the company
 * id is re-checked against the real table, and a merge is followed) as
 * every other deck's links — one place that logic lives, not two.
 *
 * Requires `approved`. /deck/proposal already refuses to render anything
 * else, so this isn't a security control — it stops Tom generating and
 * sending a link that 404s the moment the recipient opens it.
 */
export async function mintProposalLink(
  companyId: string,
  versionId: string,
  days = 90,
): Promise<{ ok: true; url: string; warning?: string } | { ok: false; error: string }> {
  await requireRelease();
  const admin = createAdminClient();

  const { data: version } = await admin
    .from("deck_versions")
    .select("id, status")
    .eq("id", versionId)
    .eq("company_id", companyId)
    .eq("deck", "proposal")
    .maybeSingle();
  if (!version) return { ok: false, error: "That version isn't on this company." };
  if (version.status !== "approved") {
    return { ok: false, error: "Approve the version before minting a link for it." };
  }

  const { data: company } = await admin
    .from("companies")
    .select("name, domain")
    .eq("id", companyId)
    .single();

  // The version travels into createShareLink rather than being appended
  // here, so the URL written to deck_links (043) is the one that actually
  // opens the deck. Appending afterwards would log a link that 404s.
  const res = await createShareLink(
    company?.name || company?.domain || "Proposal recipient",
    days,
    "proposal",
    { kind: "company", id: companyId },
    versionId,
  );
  if (!res.ok) return res;

  revalidatePath(`/admin/companies/${companyId}`);
  return res;
}

/**
 * Record who you showed it to.
 *
 * `name` is stored as text as well as the contact link, so deleting a contact
 * doesn't erase the fact that the meeting happened. See migration 026.
 */
export async function addDeckRecipient(args: {
  companyId: string;
  versionId: string;
  contactId?: string | null;
  name: string;
  note?: string;
}): Promise<Result> {
  await requireStaff();

  const name = args.name?.trim();
  if (!name) return { ok: false, error: "Who did you show it to?" };

  const admin = createAdminClient();

  // Confirm the version belongs to this company before writing a child row —
  // the recipients table has no company_id of its own to scope on.
  const { data: version } = await admin
    .from("deck_versions")
    .select("id")
    .eq("id", args.versionId)
    .eq("company_id", args.companyId)
    .maybeSingle();
  if (!version) return { ok: false, error: "That version isn't on this company." };

  const { error } = await admin.from("deck_version_recipients").insert({
    version_id: args.versionId,
    contact_id: args.contactId || null,
    name: name.slice(0, 200),
    note: args.note?.trim().slice(0, 400) || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/companies/${args.companyId}`);
  return { ok: true };
}
