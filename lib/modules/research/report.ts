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

import { AXES, bandForScore, computeOverallScore, type AxisKey } from "./data";
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
export interface ReportEdits {
  scores?: Partial<Record<AxisKey, number>>;
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

  summary: string;
  findings: Finding[];
  profile: string;
  regulatory: string;
  brief: string;
  topOpportunity: string;
  urgencySignal: string;

  workforce: ResearchResult["workforceData"];
  statesData: ResearchResult["statesData"];

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
  if (s?.topOpportunity) out.push(String(s.topOpportunity));
  if (s?.urgencySignal) out.push(String(s.urgencySignal));
  for (const b of result.workforceData?.summaryBullets ?? []) {
    if (out.length >= 5) break;
    if (b?.trim()) out.push(b.trim());
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

    summary: pick(edits.narrative?.summary, String(modelScores.topOpportunity ?? "")),
    findings: deriveFindings(c, edits),
    profile: pick(edits.narrative?.profile, c.profile),
    regulatory: pick(edits.narrative?.regulatory, c.regulatory),
    brief: pick(edits.narrative?.brief, c.brief),
    topOpportunity: pick(edits.narrative?.topOpportunity, String(modelScores.topOpportunity ?? "")),
    urgencySignal: pick(edits.narrative?.urgencySignal, String(modelScores.urgencySignal ?? "")),

    workforce: c.workforceData ?? null,
    statesData: c.statesData ?? null,

    visibleSections: visible,
    withheldSections: withheld,

    isFallback: Boolean(modelScores._fallback),
  };
}

/**
 * Whether a report is safe to release.
 *
 * Deliberately strict about fallback scores. The pipeline substitutes estimated
 * defaults when scoring fails, and those are flagged `_fallback` and excluded
 * from the benchmark views — but nothing stops them being shown to a client as
 * if they were a real assessment. That would be the single most damaging
 * failure available to a product selling analytical rigour, so it blocks
 * release rather than warning.
 */
export function releaseBlockers(args: {
  content: ResearchResult | null;
  edits?: ReportEdits;
  reviewedAt?: string | null;
}): string[] {
  const problems: string[] = [];
  const c = args.content;

  if (!c) return ["No research output attached to this report."];

  if (c.scores?._fallback) {
    problems.push(
      "Scores are estimated fallbacks, not a real assessment. Re-run the scoring step before releasing.",
    );
  }

  const missingAxes = AXES.filter((a) => typeof c.scores?.[a.key] !== "number");
  if (missingAxes.length) {
    problems.push(`Missing scores for: ${missingAxes.map((a) => a.shortLabel).join(", ")}.`);
  }

  if (!c.profile?.trim()) problems.push("Company profile is empty.");
  if (!args.reviewedAt) problems.push("Not yet marked as reviewed.");

  return problems;
}
