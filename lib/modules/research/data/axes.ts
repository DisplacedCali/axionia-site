/**
 * The eight scored dimensions of the Axionia Readiness Radar.
 *
 * COLOUR CHANGE FROM axionia-app, deliberate. The original AXES array in
 * src/App.js used #E85D4A (coral), #A78BFA (purple), #06B6D4 (cyan) and
 * #8B5CF6 (violet) — none of which appear anywhere in axionia_brand_tokens.md
 * — and used #F59E0B for amber rather than the canonical #9C6B1A.
 *
 * axionia_brand_tokens.md §5 defines an ordered eight-slot categorical palette
 * for exactly this chart, so the axes now reference it by token name rather
 * than carrying hex values. Two consequences, both intended:
 *
 *   1. No component hardcodes a colour, so the radar cannot drift from brand.
 *   2. The 8th slot is Sky (#6FA3DA), not amber. The brand file's rule: "If a
 *      chart uses amber semantically, swap the 8th slot for Sky." The report
 *      surface does use amber semantically — vendor watch-outs and vendor
 *      references — and semantic colours are reserved, so a categorical amber
 *      axis sitting next to a semantic amber warning would read as meaning
 *      something it doesn't.
 *
 * WEIGHTING BUG FIXED HERE. The scoring prompt in src/App.js specified:
 *
 *   spend .13 + maturity .13 + alignment .13 + vendor .10 + analytics .10
 *   + cfo .10 + regulatory .11 + appreciation .11
 *
 * which sums to 0.91, not 1.0 — and then instructed the model to "multiply
 * remaining 0.09 proportionally". Asking a language model to redistribute a
 * residual in prose produces a different answer on different runs, so
 * overallScore was not reproducible: the same inputs could yield a different
 * headline number, and cross-company benchmark comparisons were built on it.
 *
 * Fixed by storing integer relative weights and normalising in code.
 * Normalising is exactly what "proportionally" meant, so scores stay on the
 * intended scale — they're just deterministic now.
 */

import type { Axis, AxisKey, ScoreBand } from "./types";

export const AXES: readonly Axis[] = [
  {
    key: "spendEfficiency",
    label: ["Spend", "Efficiency"],
    shortLabel: "Spend Efficiency",
    colorToken: "blue",
    rationaleKey: "spendRationale",
    relativeWeight: 13,
  },
  {
    key: "vendorIndependence",
    label: ["Vendor", "Independence"],
    shortLabel: "Vendor Independence",
    colorToken: "teal",
    rationaleKey: "vendorRationale",
    relativeWeight: 10,
  },
  {
    key: "analyticsReadiness",
    label: ["Analytics", "Readiness"],
    shortLabel: "Analytics Readiness",
    colorToken: "green",
    rationaleKey: "analyticsRationale",
    relativeWeight: 10,
  },
  {
    key: "cfoEngagement",
    label: ["CFO", "Engagement"],
    shortLabel: "CFO Engagement",
    colorToken: "indigo",
    rationaleKey: "cfoRationale",
    relativeWeight: 10,
  },
  {
    key: "workforceAlignment",
    label: ["Workforce", "Alignment"],
    shortLabel: "Workforce Alignment",
    colorToken: "ocean",
    rationaleKey: "alignmentRationale",
    relativeWeight: 13,
  },
  {
    key: "decisionMaturity",
    label: ["Decision", "Maturity"],
    shortLabel: "Decision Maturity",
    colorToken: "slate",
    rationaleKey: "maturityRationale",
    relativeWeight: 13,
  },
  {
    key: "regulatoryReadiness",
    label: ["Regulatory", "Readiness"],
    shortLabel: "Regulatory Readiness",
    colorToken: "sage",
    rationaleKey: "regulatoryRationale",
    relativeWeight: 11,
  },
  {
    key: "appreciationValue",
    label: ["Appreciation", "Value"],
    shortLabel: "Appreciation Value",
    colorToken: "sky",
    rationaleKey: "appreciationRationale",
    relativeWeight: 11,
  },
] as const;

export const AXES_BY_KEY: ReadonlyMap<AxisKey, Axis> = new Map(
  AXES.map((a) => [a.key, a]),
);

/** Map of axis key → the scores field holding its written rationale. */
export const RATIONALE_KEYS: Readonly<Record<AxisKey, string>> = Object.freeze(
  Object.fromEntries(AXES.map((a) => [a.key, a.rationaleKey])) as Record<
    AxisKey,
    string
  >,
);

/**
 * Score bands, per axionia_brand_tokens.md §5.
 *
 * Framing rule from the brand file, enforced here rather than left to whoever
 * writes the copy: the lowest band reads as opportunity, never failure.
 * Axionia informs and nudges — it never shames the buyer.
 */
export const SCORE_BANDS: readonly ScoreBand[] = [
  { band: "Strong",     min: 75, max: 100, colorToken: "positive", framing: "Defend & maintain" },
  { band: "Solid",      min: 60, max: 74,  colorToken: "teal",     framing: "Targeted upside" },
  { band: "Emerging",   min: 45, max: 59,  colorToken: "caution",  framing: "Clear opportunity" },
  { band: "Foundation", min: 0,  max: 44,  colorToken: "risk",     framing: "High opportunity" },
] as const;

export function bandForScore(score: number): ScoreBand {
  const clamped = Math.max(0, Math.min(100, score));
  // Ordered high→low, so the first match wins.
  return SCORE_BANDS.find((b) => clamped >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

/** Sum of the integer relative weights. */
export const TOTAL_RELATIVE_WEIGHT = AXES.reduce((t, a) => t + a.relativeWeight, 0);

/**
 * Normalised weights, guaranteed to sum to 1. Derived rather than transcribed,
 * so adding or reweighting an axis can't silently break the scale.
 */
export const AXIS_WEIGHTS: Readonly<Record<AxisKey, number>> = Object.freeze(
  Object.fromEntries(
    AXES.map((a) => [a.key, a.relativeWeight / TOTAL_RELATIVE_WEIGHT]),
  ) as Record<AxisKey, number>,
);

/**
 * Recompute the overall score from the eight axes.
 *
 * The pipeline asks the model for overallScore, but a model doing weighted
 * arithmetic in prose is not a source of truth — especially with a residual to
 * redistribute. Treat this as authoritative and the model's number as a
 * cross-check.
 *
 * Returns null if any axis is missing, rather than scoring a partial set as if
 * it were complete. A quietly-partial score that still looks like a score is
 * the failure mode worth avoiding: it would enter the benchmark averages.
 */
export function computeOverallScore(
  scores: Partial<Record<AxisKey, number>>,
): number | null {
  let total = 0;
  for (const axis of AXES) {
    const v = scores[axis.key];
    if (typeof v !== "number" || Number.isNaN(v)) return null;
    total += v * AXIS_WEIGHTS[axis.key];
  }
  return Math.round(total * 10) / 10;
}

/**
 * How far the model's own overallScore drifted from the computed one.
 * Useful as a quality signal on a run; a large gap means the model was
 * improvising the arithmetic.
 */
export function overallScoreDrift(
  scores: Partial<Record<AxisKey, number>> & { overallScore?: number },
): number | null {
  const computed = computeOverallScore(scores);
  if (computed === null || typeof scores.overallScore !== "number") return null;
  return Math.round((scores.overallScore - computed) * 10) / 10;
}
