/**
 * The objective set a buyer weights the analysis against.
 *
 * The product position this encodes, and it matters:
 *
 *   Axionia scores the evidence. It does not score the objective.
 *
 * We take no view on whether an employer should prioritise cost, retention,
 * equity or access — that is a question about what the organisation is for, and
 * it isn't ours to answer. What we do is hold the evidence constant, apply the
 * weights the buyer states, and show both. Two employers can receive opposite
 * recommendations from the identical analysis and both be right.
 *
 * That neutrality is also what makes the objective set usable at all. An
 * employer that weights health equity at 40 and one that weights it at 0 get the
 * same quality of analysis and the same visible model. If the framework argued
 * for a position, half the market could never use it — and the transparency
 * claim would be false, because the thumb would be on the scale before the data
 * arrived.
 *
 * IMPORTANT — weights order decisions, they do not monetise outcomes.
 * /methodology commits publicly to not putting a dollar figure on satisfaction,
 * retention or productivity, because those are too confounded by compensation,
 * management and the labour market to attribute honestly. Weighting an objective
 * changes what gets recommended and in what order. It must never be allowed to
 * mean a soft outcome quietly acquired a number.
 *
 * ── The substitution this makes visible ──
 *
 * The clinical and non-clinical halves of a benefit budget compete for the same
 * dollar and are never compared, because they are sold in different units:
 * point solutions in avoided claims, perks in retention and attraction. Nobody
 * in the advice chain crosses that line — perks are largely unbrokered, so
 * there is no commission, no catalogue entry, and no reason for the question to
 * come up. An MSK vendor cannot recommend a fitness stipend instead of itself.
 *
 * Scoring both on the same four axes is what lets a retention-weighted
 * portfolio put them in one order. It bites hardest on high-comp workforces,
 * where claims utilisation is low relative to pay — so the clinical case is
 * weakest exactly where the retention case is strongest.
 *
 * The permitted claim is RANK: under these weights, the fitness stipend
 * outranks the fourth overlapping point solution. The forbidden claim is
 * EQUIVALENCE: that the stipend is worth $X PMPM in retention. The first is
 * what the model supports. The second is the line above, crossed.
 */

export type ObjectiveFamily = {
  family: string;
  note: string;
  items: { name: string; measure: string }[];
};

export const OBJECTIVES: ObjectiveFamily[] = [
  {
    family: "Financial",
    note: "Measurable in dollars, and the only family where we'll put a point estimate on the outcome.",
    items: [
      { name: "Cost reduction", measure: "Net PMPM after adjustment, as a range" },
      { name: "Margin protection", measure: "Exposure to trend and renewal shock" },
      { name: "Growth capacity", measure: "Cost per additional covered life" },
    ],
  },
  {
    family: "People",
    note: "Directionally scored, never assigned a dollar value — too confounded by pay, management and the labour market to attribute honestly.",
    items: [
      { name: "Talent retention", measure: "Fit to the roles you actually compete for" },
      { name: "Employee experience", measure: "Friction in access, navigation and cost-share" },
      { name: "Absence & productivity", measure: "Time-away exposure by role type" },
    ],
  },
  {
    family: "Care",
    note: "Scored on breadth and evidence quality, against your covered population rather than a national base.",
    items: [
      { name: "Access breadth", measure: "Share of the population a program can actually reach" },
      { name: "Clinical outcomes", measure: "Strength of evidence, adjusted for study design" },
      { name: "Mental health", measure: "Coverage depth and time-to-first-appointment" },
      { name: "Women's health & family building", measure: "Coverage completeness across the care pathway" },
    ],
  },
  {
    family: "Coverage & risk",
    note: "Where a portfolio is most often incomplete without anyone having decided it should be.",
    items: [
      { name: "Health equity", measure: "Variation in access and outcomes across the population" },
      { name: "Inclusive coverage", measure: "Completeness of affirming and family-building benefits" },
      { name: "Mandate exposure", measure: "State and federal requirements by work location" },
    ],
  },
];

/** Flat list, for anywhere the grouping isn't wanted. */
export const OBJECTIVE_NAMES = OBJECTIVES.flatMap((f) =>
  f.items.map((i) => i.name)
);
