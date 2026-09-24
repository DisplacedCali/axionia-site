import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAFF_ROLES, type Role } from "@/lib/auth";
import { verifyDeckLink } from "@/lib/deckLinks";
import DeckShell from "@/components/deck/DeckShell";
import { buildProposalSlides, type ProposalTerms } from "@/components/deck/proposalSlides";
import { mergeProposalCustom, type ProposalCustom } from "@/lib/deck/proposalCustom";
import {
  FOUNDING_COHORT_CAP,
  FOUNDING_COHORT_CONVERSION_DATE,
  foundingCohortSeatsTaken,
} from "@/lib/foundingCohort";
import "../deck.css";

export const dynamic = "force-dynamic";

/**
 * The proposal deck — one company, a real fee rate, gated exactly like
 * founders and investor.
 *
 * ── Two things this route enforces that the others don't ──
 *
 * 1. It requires `?v=`, always. Founders and investor have one canonical
 *    deck each; this one has no content of its own to fall back to
 *    without a version, and the source template is full of unresolved
 *    "[Client Name]"-shaped gaps. A missing or unapproved version is
 *    treated exactly like a missing or invalid link: notFound().
 *
 * 2. The link's entity ref must match the version's company. `k` alone
 *    proves you hold A valid proposal link; matching it against `v` proves
 *    it's YOUR valid proposal link. Without this check, holding any one
 *    approved proposal link plus a guessed or forwarded `v` would open
 *    every other company's rate — the version id is a UUID, not a secret,
 *    and the signature is what's supposed to be doing the gating.
 *
 * Approved-only, checked here on the server — same as buyer's `?v=` and
 * for the same reason (026, decision 3): generation on this deck is
 * manual rather than a model's, but "draft" still means nobody has
 * confirmed it's what should go out, and the URL is what makes that
 * confirmation real rather than a step someone could skip.
 */
export const metadata = {
  title: "Axionia — Proposal",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProposalDeck({
  searchParams,
}: {
  searchParams: { v?: string; k?: string };
}) {
  if (!searchParams.v) notFound();

  const admin = createAdminClient();
  const { data: version } = await admin
    .from("deck_versions")
    .select("id, company_id, generated, edits, status, deck")
    .eq("id", searchParams.v)
    .eq("status", "approved")
    .eq("deck", "proposal")
    .maybeSingle();

  if (!version) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStaff = STAFF_ROLES.includes(profile?.role as Role);
  }

  const link = verifyDeckLink(searchParams.k, "proposal");
  const linkMatchesCompany =
    link.ok && link.ref?.kind === "company" && link.ref.id === version.company_id;

  if (!isStaff && !linkMatchesCompany) notFound();

  const { data: company } = await admin
    .from("companies")
    .select("founding_cohort, fee_rate")
    .eq("id", version.company_id)
    .single();

  const seatsTaken = await foundingCohortSeatsTaken();
  const conversionLabel = new Date(
    `${FOUNDING_COHORT_CONVERSION_DATE}T00:00:00`,
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const terms: ProposalTerms = {
    foundingCohort: company?.founding_cohort ?? false,
    feeRate: company?.fee_rate ?? null,
    conversionLabel,
    seatsTaken,
    seatsCap: FOUNDING_COHORT_CAP,
  };

  const custom = mergeProposalCustom(
    version.generated as ProposalCustom,
    version.edits as ProposalCustom,
  );

  return (
    /*
      downloadable={false} — same reasoning as investor. A fee rate is not
      something that should leave as a screenshot's worth of friction lower
      than "ask, get a watermarked copy, and have it logged who has it."
    */
    <DeckShell
      slides={buildProposalSlides(custom, terms)}
      signedIn={isStaff}
      deck="proposal"
      linkLabel={linkMatchesCompany ? link.label : null}
      linkToken={searchParams.k ?? null}
      downloadable={false}
    />
  );
}
