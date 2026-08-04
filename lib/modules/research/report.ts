/**
 * Report assembly: raw research + admin edits → what gets rendered.
 *
 * Pure. No I/O. Same module boundary as data/ and pipeline/.
 *
 * The central rule: `content` is never mutated. Admin corrections live in
 * `edits` and are applied here, at render time. That keeps every correction
 * reversible and keeps the model's actual output inspectable — which is what
 * "we expose the entire model" requires in practice, not just in copy.
 */

import {
  AXES,
  bandForScore,
  computeOverallScore,
  getMandatesForStates,
  getSelfInsuredMandates,
  type AxisKey,
  type Mandate,
} from "./data";
import type { ResearchResult, ScoreSet } from "./pipeline/types";

export type ReportView = "summary" | "full";

export type SectionId =
  | "scorecard"
  | "findings"
  | "profile"
  | "regulatory"
  | "workforce"
  | "benefitDesign"
  | "brief";

/** Mirrors public.report_sections. Kept in sync deliberately — see migration 010. */
export const SECTIONS: ReadonlyArray<{
  id: SectionId;
  label: string;
  order: number;
  inSummary: boolean;
}> = [
  { id: "scorecard",     label: "Readiness Scorecard",    order: 10, inSummary: true },
  { id: "findings",      label: "Key Findings",           order: 20, inSummary: true },
  { id: "profile",       label: "Company Profile",        order: 30, inSummary: true },
  { id: "regulatory",    label: "Regulatory Exposure",    order: 40, inSummary: true },
  { id: "workforce",     label: "Workforce Intelligence", order: 50, inSummary: false },
  { id: "benefitDesign", label: "Benefit Design",         order: 60, inSummary: false },
  { id: "brief",         label: "Pre-Meeting Brief",      order: 70, inSummary: false },
] as const;

/** Admin overrides. Every field optional — absent means "use the model's". */
/**
 * Why a score was overridden, and by whom.
 *
 * Required on any score that differs from the model — enforced in
 * `saveReportEdits`, not just the form. An unexplained override is exactly the
 * hidden assumption this product exists to oppose, and it is worse than the
 * model's original number because at least that one was reproducible.
 *
 * Scoped to scores deliberately. A prose edit is self-documenting: you can read
 * what changed. A score moving 55 → 80 is opaque without a reason, and it is
 * the number that drives the headline.
 *
 * Per-axis rather than per-save: `editedBy` at the top of the overlay records
 * only the last writer, which stops being true the moment more than one person
 * touches a report. See docs/PAID_REVIEW_DESIGN.md.
 */
export interface ScoreNote {
  rationale: string;
  /** auth.users id of whoever set it. */
  by: string;
  at: string;
  /** Reviewer discipline, once contracted reviewers exist. Unused today. */
  discipline?: string;
}

export interface ReportEdits {
  scores?: Partial<Record<AxisKey, number>>;
  /** Keyed by axis. See ScoreNote. */
  scoreNotes?: Partial<Record<AxisKey, ScoreNote>>;
  narrative?: {
    summary?: string;
    findings?: string[];
    profile?: string;
    regulatory?: string;
    brief?: string;
    /** Replaces the model's topOpportunity. */
    topOpportunity?: string;
    urgencySignal?: string;
  };
  /** Sections hidden regardless of client_view. */
  hiddenSections?: SectionId[];
  editedAt?: string;
  editedBy?: string;
}

export interface Finding {
  text: string;
  /** True when this line came from the admin rather than the model. */
  edited: boolean;
}

export interface AssembledReport {
  company: string;
  industry: string | null;
  hq: string | null;
  size: string | null;

  scores: ScoreSet;
  /** Axis-level detail for the radar and the score table. */
  axes: Array<{
    key: AxisKey;
    label: string;
    shortLabel: string;
    colorToken: string;
    score: number | null;
    rationale: string;
    /** True when the admin overrode the model's score. */
    adjusted: boolean;
    modelScore: number | null;
  }>;
  overallScore: number | null;
  band: { band: string; framing: string } | null;
  /** True if any score was hand-adjusted — must be surfaced, see note below. */
  anyScoreAdjusted: boolean;

  /** Short synthesis. Distinct from findings — see assembleReport. */
  summary: string;
  findings: Finding[];
  /**
   * What to do next. The pipeline generates conversationHook on every run and
   * nothing rendered it, so every report ended without an ask.
   */
  callToAction: { headline: string; question: string } | null;
  profile: string;
  regulatory: string;
  brief: string;
  topOpportunity: string;
  urgencySignal: string;

  workforce: ResearchResult["workforceData"];
  statesData: ResearchResult["statesData"];

  /** Curated mandates for the detected states — the spine of the regulatory section. */
  mandates: {
    all: Mandate[];
    selfInsuredFull: Mandate[];
    selfInsuredPartial: Mandate[];
    /** States the model detected that the library doesn't cover yet. */
    uncoveredStates: string[];
  };

  /** Sections to render, in order, after view + overrides. */
  visibleSections: SectionId[];
  /** Sections withheld — the renderer can show these as locked. */
  withheldSections: SectionId[];

  /** Set when the pipeline substituted estimated scores. */
  isFallback: boolean;
}

function pick(edited: string | undefined, original: string | undefined): string {
  const e = edited?.trim();
  return e && e.length ? e : (original ?? "");
}

/**
 * Which sections render, given the client view and any explicit hides.
 * Mirrors public.report_visible_sections so the two can't disagree.
 */
export function resolveSections(
  view: ReportView,
  hidden: SectionId[] = [],
): { visible: SectionId[]; withheld: SectionId[] } {
  const hiddenSet = new Set(hidden);
  const visible: SectionId[] = [];
  const withheld: SectionId[] = [];

  for (const s of [...SECTIONS].sort((a, b) => a.order - b.order)) {
    const byView = view === "full" ? true : s.inSummary;
    if (byView && !hiddenSet.has(s.id)) visible.push(s.id);
    else withheld.push(s.id);
  }
  return { visible, withheld };
}

/**
 * Derive the findings list.
 *
 * The pipeline doesn't produce a discrete "findings" array — it produces
 * summaryBullets on the workforce step plus scoring's topOpportunity and
 * urgencySignal. Rather than add another model call, findings are assembled
 * from what already exists, with the admin free to replace them wholesale.
 */
function deriveFindings(result: ResearchResult, edits: ReportEdits): Finding[] {
  const edited = edits.narrative?.findings?.filter((f) => f.trim().length);
  if (edited?.length) return edited.map((text) => ({ text, edited: true }));

  const out: string[] = [];
  const s = result.scores;

  // topOpportunity leads the findings; the summary uses overallInsight instead,
  // so the two no longer print the same sentence.
  if (s?.topOpportunity) out.push(String(s.topOpportunity));
  if (s?.urgencySignal) out.push(String(s.urgencySignal));

  const seen = new Set(out.map((t) => t.trim().toLowerCase()));
  for (const b of result.workforceData?.summaryBullets ?? []) {
    if (out.length >= 5) break;
    const t = b?.trim();
    // Guard against the model repeating itself across steps.
    if (t && !seen.has(t.toLowerCase())) {
      out.push(t);
      seen.add(t.toLowerCase());
    }
  }
  return out.slice(0, 5).map((text) => ({ text, edited: false }));
}

/**
 * Assemble a renderable report from the stored research payload, the admin's
 * edit overlay, and the chosen client view.
 *
 * Overall score is always RECOMPUTED from the effective axis scores. If the
 * admin nudges one axis, the headline number follows — a stored total that no
 * longer matches its components is worse than no total.
 */
export function assembleReport(args: {
  content: ResearchResult;
  edits?: ReportEdits;
  view: ReportView;
}): AssembledReport {
  const { content: c } = args;
  const edits = args.edits ?? {};
  const modelScores = (c.scores ?? {}) as ScoreSet;

  const effectiveScores: ScoreSet = { ...modelScores };
  let anyAdjusted = false;

  for (const axis of AXES) {
    const override = edits.scores?.[axis.key];
    if (typeof override === "number" && !Number.isNaN(override)) {
      effectiveScores[axis.key] = Math.max(0, Math.min(100, override));
      if (override !== modelScores[axis.key]) anyAdjusted = true;
    }
  }

  const overall = computeOverallScore(effectiveScores as Partial<Record<AxisKey, number>>);
  if (overall !== null) effectiveScores.overallScore = overall;

  const axes = AXES.map((axis) => {
    const model = typeof modelScores[axis.key] === "number" ? (modelScores[axis.key] as number) : null;
    const effective =
      typeof effectiveScores[axis.key] === "number" ? (effectiveScores[axis.key] as number) : null;
    return {
      key: axis.key,
      label: axis.shortLabel,
      shortLabel: axis.shortLabel,
      colorToken: axis.colorToken,
      score: effective,
      rationale: String(modelScores[axis.rationaleKey] ?? ""),
      adjusted: model !== null && effective !== null && model !== effective,
      modelScore: model,
    };
  });

  const { visible, withheld } = resolveSections(args.view, edits.hiddenSections);

  return {
    company: c.company,
    industry: c.industry ?? null,
    hq: c.hq ?? null,
    size: c.size ?? null,

    scores: effectiveScores,
    axes,
    overallScore: overall,
    band: overall !== null
      ? { band: bandForScore(overall).band, framing: bandForScore(overall).framing }
      : null,
    anyScoreAdjusted: anyAdjusted,

    // Summary is the workforce synthesis, NOT topOpportunity.
    //
    // Both used to read topOpportunity, so the summary and findings[0] printed
    // the same sentence twice — which is why the summary read long and made no
    // point. overallInsight is a genuine synthesis and a different sentence.
    summary: pick(
      edits.narrative?.summary,
      c.workforceData?.overallInsight || String(modelScores.topOpportunity ?? ""),
    ),
    findings: deriveFindings(c, edits),
    callToAction:
      modelScores.topOpportunity || modelScores.conversationHook
        ? {
            headline: String(edits.narrative?.topOpportunity ?? modelScores.topOpportunity ?? ""),
            question: String(modelScores.conversationHook ?? ""),
          }
        : null,
    profile: pick(edits.narrative?.profile, c.profile),
    regulatory: pick(edits.narrative?.regulatory, c.regulatory),
    brief: pick(edits.narrative?.brief, c.brief),
    topOpportunity: pick(edits.narrative?.topOpportunity, String(modelScores.topOpportunity ?? "")),
    urgencySignal: pick(edits.narrative?.urgencySignal, String(modelScores.urgencySignal ?? "")),

    workforce: c.workforceData ?? null,
    statesData: c.statesData ?? null,
    mandates: (() => {
      const states = c.statesData?.states ?? [];
      const all = getMandatesForStates(states);
      const si = getSelfInsuredMandates(states);
      const covered = new Set(all.map((m) => m.state.toUpperCase()));
      return {
        all,
        selfInsuredFull: si.full,
        selfInsuredPartial: si.partial,
        uncoveredStates: states
          .map((x) => x.toUpperCase())
          .filter((x) => !covered.has(x)),
      };
    })(),

    visibleSections: visible,
    withheldSections: withheld,

    isFallback: Boolean(modelScores._fallback),
  };
}

/**
 * Whether a report is safe to release.
 *
 * Blockers carry a severity, because the four are not the same kind of problem.
 *
 * **hard** — the report looks finished and isn't. Fallback scores and missing
 * axes both render as a complete assessment while being estimates or gaps, and
 * a client has no way to tell from the page. Showing those as real analysis is
 * the single most damaging failure available to a product selling analytical
 * rigour, so `releaseReport()` refuses on them server-side. A disabled button is
 * not a guarantee: a stale tab, a double submit or a future call path all reach
 * the action without passing the UI.
 *
 * **soft** — the report is visibly incomplete rather than quietly wrong. An
 * empty profile is obvious on sight, and "not reviewed" is a process checkbox,
 * not a defect in the artifact. These warn in the admin and don't block, which
 * is what keeps the hard gate from acquiring an override flag — and an override
 * used routinely is UI-only enforcement with extra steps.
 */
export type BlockerSeverity = "hard" | "soft";
export interface ReleaseBlocker {
  message: string;
  severity: BlockerSeverity;
}

function computeBlockers(args: {
  content: ResearchResult | null;
  edits?: ReportEdits;
  reviewedAt?: string | null;
}): ReleaseBlocker[] {
  const problems: ReleaseBlocker[] = [];
  const c = args.content;

  if (!c) {
    return [
      { message: "No research output attached to this report.", severity: "hard" },
    ];
  }

  if (c.scores?._fallback) {
    problems.push({
      message:
        "Scores are estimated fallbacks, not a real assessment. Re-run the scoring step before releasing.",
      severity: "hard",
    });
  }

  const missingAxes = AXES.filter((a) => typeof c.scores?.[a.key] !== "number");
  if (missingAxes.length) {
    problems.push({
      message: `Missing scores for: ${missingAxes.map((a) => a.shortLabel).join(", ")}.`,
      severity: "hard",
    });
  }

  if (!c.profile?.trim()) {
    problems.push({ message: "Company profile is empty.", severity: "soft" });
  }
  if (!args.reviewedAt) {
    problems.push({ message: "Not yet marked as reviewed.", severity: "soft" });
  }

  return problems;
}

/** Everything worth showing the admin before they release. */
export function releaseBlockers(args: {
  content: ResearchResult | null;
  edits?: ReportEdits;
  reviewedAt?: string | null;
}): string[] {
  return computeBlockers(args).map((b) => b.message);
}

/**
 * The subset the release action refuses on. Derived from the same computation
 * as `releaseBlockers` on purpose — two independent lists would drift, and the
 * one that drifts silently is the one that stops blocking.
 */
export function hardReleaseBlockers(args: {
  content: ResearchResult | null;
  edits?: ReportEdits;
  reviewedAt?: string | null;
}): string[] {
  return computeBlockers(args)
    .filter((b) => b.severity === "hard")
    .map((b) => b.message);
}
