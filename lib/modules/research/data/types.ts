/**
 * Axionia Research module — data contracts.
 *
 * These describe the proprietary benefit intelligence library: the curated
 * benefit/segment/vendor tables and the state mandate library. This is the
 * defensible spine of the product, so it is typed rather than left as loose
 * JSON — a bad ID or a missing segment reference should fail at build time.
 *
 * Ported from axionia-app src/App.js. No behaviour change: values are
 * byte-identical to the source, extracted programmatically.
 */

/** 1–5 value scores used throughout the benefit library. */
export type Score1to5 = 1 | 2 | 3 | 4 | 5;

/** How common an offering is in the market. */
export type BenefitType = "Standard" | "Differentiated" | "Customized";

export type Urgency = "High" | "Medium" | "Low";

/**
 * Evidence quality for a vendor claim. Deliberately coarse: 3 = independent
 * or peer-reviewed, 2 = vendor-reported, 1 = emerging/anecdotal. The whole
 * value-attribution moat depends on never treating 2 as if it were 3.
 */
export type EvidenceQuality = 1 | 2 | 3;

export interface Benefit {
  id: string;
  name: string;
  category: string;
  type: BenefitType;
  /** Free-text description of which populations this serves. */
  segments: string;
  /** Perceived value to employees. */
  perceived: Score1to5;
  /** Financial leverage for the employer. */
  financial: Score1to5;
  /** Retention / attraction impact. */
  retention: Score1to5;
  /** Clinical impact. */
  clinical: Score1to5;
  /** Axionia's independent point of view. Opinionated by design. */
  axioniaPOV: string;
}

/**
 * The dimensions that actually determine benefit economics.
 *
 * The original five segments were named after healthcare roles, which conflated
 * "highly paid and hard to replace" with "clinical" — so a portfolio manager
 * matched nothing, despite wanting broadly what a surgeon wants: income
 * protection above group caps, premium access, tax-advantaged structures.
 *
 * Keying on dimensions instead means matching by inference rather than role
 * vocabulary, and a new industry needs no new keyword list.
 */
export type CompLevel = "low" | "medium" | "high" | "very_high";
export type WorkModel = "shift" | "field" | "onsite" | "hybrid" | "remote";
export type Replaceability = "easy" | "moderate" | "hard";

export interface SegmentDimensions {
  comp: CompLevel;
  /** Primary work model. Segments can serve adjacent models. */
  work: WorkModel[];
  replaceability: Replaceability;
  /** Licensure or credential is a gate to the role. */
  licensed: boolean;
  /** Clinical work. Distinguishes a surgeon from an investment principal. */
  clinical: boolean;
  /**
   * People-leadership responsibility.
   *
   * The dimension that separates a shift supervisor from a maintenance
   * technician — same pay band, same shift work, different benefit needs. Team
   * leaders are the retention bridge between frontline and management, which is
   * a distinct economic position.
   */
  supervisory?: boolean;
}

export interface Segment {
  id: string;
  name: string;
  compensationLevel: string;
  workModel: string;
  industryExamples: string;
  /**
   * Structured dimensions. Optional on the type so the five original segments
   * stayed valid while being tagged, but every segment now carries them.
   */
  dimensions?: SegmentDimensions;
  /** Benefit IDs, high → low value for this segment. */
  highValueBenefits: string[];
  mediumValueBenefits: string[];
  lowValueBenefits: string[];
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Market momentum, 1–5. */
  momentum: Score1to5;
  /** Company stability, 1–5. */
  stability: Score1to5;
  bestFit: string;
  evidenceQuality: EvidenceQuality;
  url: string;
  /** Known caveats. Never omitted from client-facing output. */
  redFlags: string;

  /**
   * A relationship between Axionia and this vendor that a sceptical reader
   * would want to know about before weighing anything else we say about it.
   *
   * Set this rather than removing a vendor. Knowing a vendor well is an asset —
   * it's why the profile is richer — and the honest response to that is to say
   * so, not to pretend to a distance we don't have. Undisclosed is the only
   * version that's actually a problem.
   *
   * MUST be rendered anywhere the vendor is named in client-facing output.
   * That is the whole point of the field and it is not optional at render time,
   * whatever the type says.
   */
  disclosure?: string;

  // ── Extended profile (optional) ───────────────────────────────────────────
  // Present only where Axionia has done a deep dive. Currently VEN_WIN.

  /** Axionia's internal assessment. Not necessarily client-facing. */
  axioniaNotes?: string;
  /** Diligence questions to put to the vendor. Discovery-call material. */
  hardQuestions?: readonly string[];
  /** Fit by industry, keyed by lowercase industry slug. */
  fitByIndustry?: Readonly<Record<string, string>>;
}

/** Join row: which vendors serve which benefit. */
export interface BenefitVendor {
  benefitId: string;
  vendorId: string;
  vendorName: string;
  offeringNote: string;
  evidenceQuality: EvidenceQuality;
}

/**
 * How far a mandate reaches into self-insured ERISA plans.
 *
 * THREE states, not two. This is the single most consequential field in the
 * mandate library and collapsing it to a boolean misstates exposure in both
 * directions:
 *
 *   true      Reaches self-insured plans. Rare and significant — ERISA
 *             preemption does not save the employer (CA SB 729).
 *   false     Fully insured only. ERISA preempts; a self-insured employer can
 *             set it aside.
 *   "partial" Reaches self-insured plans only in part — typically where a
 *             federal floor (MHPAEA parity) already applies and the state adds
 *             enforcement or reporting on top. Currently the two mental-health
 *             parity mandates, MN §62Q.47 and CA SB 855.
 *
 * Reporting "partial" as true overstates the obligation; as false understates
 * it. Either error is the kind of thing that costs credibility with a CFO.
 */
export type SelfInsuredReach = true | false | "partial";

/**
 * A state benefit mandate.
 *
 * Most state mandates are preempted by ERISA for self-insured plans, so a
 * mandate that DOES reach self-insured plans is a materially different
 * compliance fact from one that doesn't. See SelfInsuredReach.
 */
export interface Mandate {
  id: string;
  /** Two-letter state code. */
  state: string;
  category: string;
  benefit: string;
  /** Statute or bill reference. */
  law: string;
  /** ISO date. */
  effectiveDate: string;
  /** Reach into self-insured ERISA plans. Three-valued — see SelfInsuredReach. */
  selfInsured: SelfInsuredReach;
  /** Plain-language ERISA applicability note. */
  erisa: string;
  urgency: Urgency;
  description: string;
  /** Axionia's take — what an employer should actually do about it. */
  axioniaTake: string;
  tags: string[];
}

/** Fertility / family-forming vendor comparison. */
export interface FertilityVendor {
  id: string;
  name: string;
  focus: string;
  strength: string;
  gap: string;
  fit: string;
  /** Evidence quality, same scale as Vendor.evidenceQuality. */
  eq: EvidenceQuality;
  featured?: boolean;
}

/** The eight scored dimensions of the readiness radar. */
export type AxisKey =
  | "spendEfficiency"
  | "vendorIndependence"
  | "analyticsReadiness"
  | "cfoEngagement"
  | "workforceAlignment"
  | "decisionMaturity"
  | "regulatoryReadiness"
  | "appreciationValue";

/**
 * Brand categorical palette slot. Names map to axionia_brand_tokens.md §5 —
 * the presentation layer resolves them to hex, so no component hardcodes a
 * colour and the palette can never drift from the brand reference.
 */
export type ColorToken =
  | "blue"
  | "teal"
  | "green"
  | "indigo"
  | "ocean"
  | "slate"
  | "sage"
  | "sky";

export interface Axis {
  key: AxisKey;
  /** Two-line label for the radar vertex. */
  label: [string, string];
  /** Single-line label for tables and summaries. */
  shortLabel: string;
  colorToken: ColorToken;
  /** Field on the scores object holding this axis's written rationale. */
  rationaleKey: string;
  /**
   * Relative weight, as an integer. Normalised at computation time rather than
   * stored pre-divided, so the numbers stay readable and no rounding drift
   * creeps in. Use AXIS_WEIGHTS for the normalised values.
   */
  relativeWeight: number;
}

/** Score band, per axionia_brand_tokens.md §5. */
export interface ScoreBand {
  band: "Strong" | "Solid" | "Emerging" | "Foundation";
  min: number;
  max: number;
  colorToken: "positive" | "teal" | "caution" | "risk";
  /** The lowest band always reads as opportunity, never failure. */
  framing: string;
}

export interface SegmentBenefits {
  segment: Segment | null;
  high: Benefit[];
  medium: Benefit[];
  low: Benefit[];
}

export interface BenefitVendorWithVendor extends BenefitVendor {
  vendor: Vendor;
}
