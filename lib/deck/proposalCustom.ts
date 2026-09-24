/**
 * The override surface for a proposal deck version.
 *
 * ── Why this has no generation step ──
 *
 * lib/deck/generate.ts writes slide copy from a reviewed report and is
 * explicit that the model must never invent a dollar figure. The proposal
 * deck's entire commercial content — free through the founding-cohort
 * conversion date, then a fee rate — IS a set of figures, read live from
 * companies.founding_cohort / fee_rate (039) at render time. There is
 * nothing here for a model to phrase and nothing here for it to invent,
 * so there is no generateProposalCustom to go with this file. What Tom
 * types is what renders — no drafting agent sits between the two.
 *
 * ── Why the surface is smaller than DeckCustom ──
 *
 * lib/deck/custom.ts patches a headline, a sub and an inserted slide.
 * This patches one string. The proposal template already says everything
 * else — the engagement, what's included, the terms — and the only line
 * in it that varies per company is who it's for.
 */

export type ProposalCustom = {
  /** The cover's "Prepared for …" line. Omitted → the slide says so plainly rather than leaving a blank. */
  clientName?: string;
};

export const NO_PROPOSAL_CUSTOM: ProposalCustom = {};

/**
 * Layer edits over what was typed at creation.
 *
 * Same generated/edits split as deck_versions carries for every deck
 * (026, decision 2), applied here even though "generated" is itself
 * manual entry rather than a model's output: keeping the two separate is
 * what lets a later correction be told apart from what was originally
 * typed, and that answerability doesn't depend on which one produced the
 * original text.
 */
export function mergeProposalCustom(
  generated: ProposalCustom | null | undefined,
  edits: ProposalCustom | null | undefined,
): ProposalCustom {
  return { clientName: edits?.clientName ?? generated?.clientName };
}

/**
 * Trim and cap whatever arrives at the boundary.
 *
 * Same reasoning as sanitiseCustom in lib/deck/custom.ts: a form posts
 * whatever a browser was told to post, and the boundary is where that
 * gets checked rather than trusted.
 */
export function sanitiseProposalCustom(raw: unknown): ProposalCustom {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  if (typeof r.clientName !== "string") return {};
  const clientName = r.clientName.trim().slice(0, 120);
  return clientName ? { clientName } : {};
}
