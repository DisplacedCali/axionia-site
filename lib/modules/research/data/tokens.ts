/**
 * Brand colour tokens, transcribed from axionia_brand_tokens.md.
 *
 * That file is canonical: if anything here ever conflicts with it, it wins and
 * this file is the bug. Kept in the data layer so the research module resolves
 * colours by semantic name and no component carries a raw hex.
 *
 * Rule of thumb from the brand file, worth restating because it is easy to
 * violate at build time: accents are ink, not paint. The warm base does the
 * heavy lifting; colour appears as data, marks, eyebrows and key numbers —
 * never as large filled backgrounds.
 */

/** Categorical palette — the eight radar dimensions, in order (§5). */
export const CATEGORICAL = {
  blue: "#2463EB",
  teal: "#4AC9DC",
  green: "#3CBF6C",
  indigo: "#3D4E8F",
  ocean: "#2E8C9E",
  slate: "#5B7095",
  sage: "#7FA86B",
  /**
   * Substitute for the 8th slot (amber #9C6B1A) whenever amber is also doing
   * semantic work on the same surface — which it is here, for vendor
   * watch-outs. Per the brand file's own instruction.
   */
  sky: "#6FA3DA",
} as const;

/**
 * Semantic colours — RESERVED. Never use decoratively or as a categorical
 * series. Amber means "their claim, unadjusted" and nothing else.
 */
export const SEMANTIC = {
  positive: "#3CBF6C",
  positiveText: "#1E5B38",
  positiveBg: "#EAF7EF",
  caution: "#9C6B1A",
  cautionText: "#5C3F10",
  cautionBg: "#FBF3E6",
  risk: "#B03A2E",
  riskText: "#7A1F18",
  riskBg: "#FCECEA",
  noSignal: "#AEB4BC",
} as const;

/** Warm foundation — the dominant surface. */
export const FOUNDATION = {
  warmWhite: "#F8F6F1",
  sand: "#F0EDE6",
  border: "#E6E2D9",
  stone: "#DDD9D0",
  grayWarm: "#706C63",
  grayCool: "#AEB4BC",
  navy: "#1C2431",
} as const;

export const GRADIENT =
  "linear-gradient(135deg, #4AC9DC 0%, #2463EB 70%, #3CBF6C 130%)";

export const FONTS = {
  /** Display, headlines, voice. Light 300 primary; italic for emphasis. */
  serif: "'Cormorant Garamond', Georgia, serif",
  /** Labels, data, wordmark. All-caps, wide tracking, 9–13px. */
  mono: "'DM Mono', ui-monospace, monospace",
  /** Body and annotations. Light 300. */
  sans: "'DM Sans', system-ui, sans-serif",
} as const;

export type CategoricalToken = keyof typeof CATEGORICAL;
export type SemanticToken = keyof typeof SEMANTIC;

/** Resolve any token name used by the research data layer to a hex value. */
export function resolveToken(
  token: CategoricalToken | SemanticToken | "positive" | "caution" | "risk",
): string {
  if (token in CATEGORICAL) return CATEGORICAL[token as CategoricalToken];
  if (token in SEMANTIC) return SEMANTIC[token as SemanticToken];
  return SEMANTIC.noSignal;
}
