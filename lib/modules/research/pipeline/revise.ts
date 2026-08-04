/**
 * Revise: rewrite one section of a report from an analyst's comment.
 *
 * The eleventh step, and the only one that isn't part of the research DAG. It
 * runs after review, on demand, one section at a time.
 *
 * The design point worth stating: your comment is the INSTRUCTION, not the
 * output. You write "the CFO engagement read is too generous — they've never
 * seen a claims file" and the model rewrites the section accordingly. That's
 * better than hand-typing replacement prose, because the correction is the part
 * that needs your judgement and the prose is the part that doesn't.
 *
 * Results land in the `edits` overlay, never in `content`. So a section can be
 * regenerated repeatedly, the original stays visible beside it, and nothing is
 * ever destroyed — the same rule that already governs score overrides.
 *
 * Pure except for the model call. Server only.
 */

import { extractJson } from "./json";
import type { LlmClient } from "./llm";
import type { ResearchResult } from "./types";

export type RevisableSection =
  | "summary"
  | "findings"
  | "topOpportunity"
  | "profile"
  | "regulatory"
  | "brief";

export const SECTION_BRIEF: Record<RevisableSection, string> = {
  summary:
    "The report's opening paragraph. One tight paragraph: the headline finding, " +
    "why it matters economically, and what to do about it. No preamble.",
  findings:
    "Three to five findings, one per line, no bullet characters. Each is a single " +
    "sentence stating something specific and defensible. No hedging.",
  topOpportunity:
    "The 'Where to start' recommendation. ONE paragraph naming the single action " +
    "worth taking first and why it pays back — plain language a CFO would use, " +
    "not benefits jargon. No preamble, no list, no hedging.",
  profile:
    "Four bullet points starting with '-': workforce composition, business model, " +
    "ownership structure, HR characteristics.",
  regulatory:
    "State mandate exposure. Use ## headers per state. Bold mandate names. State " +
    "explicitly whether each mandate reaches self-insured ERISA plans — that " +
    "distinction is the whole point of the section.",
  brief:
    "Internal pre-meeting brief with ## sections: Company Snapshot, Benefits " +
    "Intelligence, Financial & Workforce Context, Radar Diagnosis, Conversation " +
    "Hooks, Watch-Outs. 2-4 bullets each. Direct and opinionated.",
};

/**
 * Voice constraints, taken from axionia_brand_tokens.md §6.
 *
 * Included in the prompt rather than left to chance: the revise step is the one
 * that writes client-facing prose, so it's where voice drift would actually
 * reach a reader.
 */
const VOICE = `Voice: serves HR (warmth) and CFO (authority) at once. Confident, not arrogant. Plain over jargon. Opinionated, then transparent about the reasoning. Calm — no exclamation points, no "game-changing", no hype. Respectful of the reader: inform and nudge, never talk down.
Dollar impacts as ranges, never single point figures. Vendor claims described as unverified rather than wrong. The lowest score band reads as opportunity, never failure.`;

export interface ReviseArgs {
  section: RevisableSection;
  /** What the section currently says — model output or a previous revision. */
  current: string;
  /** The analyst's correction. This is the instruction. */
  comment: string;
  /** The research the section is drawn from, so the rewrite stays grounded. */
  content: ResearchResult;
  llm: LlmClient;
}

export interface ReviseResult {
  text: string;
  /** What the model changed and why — shown in the UI so the edit is auditable. */
  note: string;
}

function groundingFor(section: RevisableSection, c: ResearchResult): string {
  const scores = c.scores ?? {};
  const radar = [
    `Spend ${scores.spendEfficiency}`,
    `Maturity ${scores.decisionMaturity}`,
    `Alignment ${scores.workforceAlignment}`,
    `Vendor ${scores.vendorIndependence}`,
    `Analytics ${scores.analyticsReadiness}`,
    `CFO ${scores.cfoEngagement}`,
    `Regulatory ${scores.regulatoryReadiness}`,
    `Appreciation ${scores.appreciationValue}`,
  ].join(" | ");

  const base = `Company: ${c.company} — ${c.industry ?? ""}, ${c.hq ?? ""}, ${c.size ?? ""}
Radar: ${radar}
Overall: ${scores.overallScore ?? "n/a"} (${scores.readinessLabel ?? "n/a"})`;

  // Only the material the section actually draws on. Sending everything wastes
  // the prompt budget and invites the model to wander into other sections.
  switch (section) {
    case "summary":
    case "findings":
    // The recommendation draws on the same material as the summary — it's the
    // action the findings imply, so it needs the findings' grounding.
    case "topOpportunity":
      return `${base}
Top opportunity: ${scores.topOpportunity ?? ""}
Urgency signal: ${scores.urgencySignal ?? ""}
Workforce insight: ${c.workforceData?.overallInsight ?? ""}
Benefits posture: ${c.benefits}`;
    case "profile":
      return `${base}
Current profile research: ${c.profile}
Financial posture: ${c.financial}`;
    case "regulatory":
      return `${base}
States: ${c.statesData?.states?.join(", ") ?? "unknown"}
Current regulatory research: ${c.regulatory}`;
    case "brief":
      return `${base}
Profile: ${c.profile}
Benefits: ${c.benefits}
Financial: ${c.financial}
Regulatory: ${c.regulatory}
Workforce: ${c.workforceData?.overallInsight ?? ""}`;
  }
}

export async function reviseSection(args: ReviseArgs): Promise<ReviseResult> {
  const system = `You are revising one section of a benefit intelligence report for Axionia.

The analyst has reviewed the draft and left a correction. Their correction is authoritative — they have context the research does not, and they may be fixing a factual error the model made. Apply it.

${VOICE}

Section format required:
${SECTION_BRIEF[args.section]}

Return ONLY valid JSON: { "text": "<the rewritten section>", "note": "<one sentence on what you changed and why>" }

Rules:
- Rewrite the whole section, not a diff.
- Keep everything the analyst did not object to. This is a correction, not a fresh draft.
- If the correction contradicts the research, the analyst wins — but do not invent supporting detail to justify it.
- Never add a figure, name, or claim that is not in the research or the analyst's comment.`;

  const user = `Research this section draws on:
${groundingFor(args.section, args.content)}

Current text of the section:
${args.current || "(empty)"}

Analyst's correction:
${args.comment}`;

  const res = await args.llm.complete({
    system,
    user,
    label: `revise:${args.section}`,
    maxTokens: 2500,
  });

  const parsed = extractJson<{ text?: string; note?: string }>(res.text);

  if (parsed?.text?.trim()) {
    return { text: parsed.text.trim(), note: parsed.note?.trim() || "Revised." };
  }

  // The model ignored the JSON envelope but may still have produced usable
  // prose. Better to accept it than to lose the call — the analyst is going to
  // read the result anyway, which is the whole point of this step.
  const fallback = res.text.trim();
  if (fallback.length > 20) {
    return { text: fallback, note: "Revised (model did not return structured output)." };
  }

  throw new Error("Revision produced no usable text.");
}
