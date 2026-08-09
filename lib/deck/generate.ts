import { createAnthropicClient, completeJson } from "@/lib/modules/research/pipeline/llm";
import { extractJson } from "@/lib/modules/research/pipeline/json";
import { sanitiseCustom, type DeckCustom } from "./custom";

/**
 * The deck customisation agent.
 *
 * ── The one rule that matters ──
 *
 * It reads a COMPLETED, REVIEWED report and nothing else. No web access, no
 * research at deck-generation time, no inference from the company name. Every
 * sentence it writes has to be traceable to something a person already checked.
 *
 * That constraint isn't caution for its own sake. The house rule is that a
 * plausible fabricated row is worse than a missing one, and a slide is the
 * worst possible place to discover one: projected, in a meeting, in front of
 * somebody who knows the category better than you do. A deck that quietly
 * invents a vendor relationship costs the meeting and the referral behind it.
 *
 * So the model is a *writer*, not a researcher. Its whole job is to select
 * from material it was handed and phrase it for a slide.
 */

const SYSTEM = `You write one slide of a sales deck for Axionia, a healthcare benefit decision-intelligence firm.

You will be given an analysis of ONE employer that a human analyst has already completed and reviewed. Write a short, specific opening that shows this employer we understand their situation.

ABSOLUTE RULES
- Use ONLY facts present in the material given to you. If it is not there, you do not know it.
- Invent nothing: no vendor names, no dollar figures, no headcounts, no program names, no dates that do not appear in the material.
- If the material is too thin to say anything specific, return {"context": null}. That is a correct and expected answer, and far better than a plausible guess.
- No superlatives, no hype, no exclamation points. Calm and precise.
- Never imply the employer, their broker or their vendors have done anything wrong. The gap is structural: programs are approved one at a time and nobody owns the union.
- British-neutral plain English. Short sentences.

Return JSON only, in exactly this shape:
{
  "cover": { "headline": "string, max 12 words, may use a full stop mid-line", "sub": "string, 2 sentences max" },
  "context": {
    "eyebrow": "3-5 words",
    "title": "max 12 words",
    "lede": "2 sentences, what we already understand about them",
    "points": [ { "k": "2-4 word label", "v": "one sentence, drawn strictly from the material" } ]
  }
}
Between 2 and 4 points. Omit any field you cannot fill honestly.`;

function userPrompt(args: {
  companyName: string;
  audience: "hr" | "cfo" | "broker" | null;
  material: string;
}) {
  const lens =
    args.audience === "cfo"
      ? "The reader is a CFO. They care about allocation and defensibility, not benefit administration."
      : args.audience === "broker"
        ? "The reader is a broker or consultant. Treat them as a partner; never imply their work is the problem."
        : args.audience === "hr"
          ? "The reader is a benefits or HR leader. They want air cover and leverage, not an audit of past decisions."
          : "The reader may be a benefits leader or a CFO. Keep it useful to both.";

  return `Employer: ${args.companyName}
${lens}

MATERIAL (the completed analysis — this is all you know):
${args.material}`;
}

/**
 * Flatten a report into the only thing the model is allowed to see.
 *
 * Deliberately a whitelist of fields rather than the whole row. Passing the
 * entire object would eventually hand the model an internal note, a routing
 * comment or a half-finished draft and let it quote one back onto a slide.
 */
export function reportMaterial(report: {
  title?: string | null;
  summary?: string | null;
  content?: Record<string, unknown> | null;
}): string {
  const parts: string[] = [];
  if (report.title) parts.push(`Title: ${report.title}`);
  if (report.summary) parts.push(`Summary: ${report.summary}`);

  const c = report.content ?? {};
  for (const key of ["profile", "benefits", "workforce", "financial", "benefitDesign"]) {
    const v = (c as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) {
      parts.push(`${key}: ${v.trim()}`);
    } else if (v && typeof v === "object") {
      const s = JSON.stringify(v);
      if (s.length > 4) parts.push(`${key}: ${s.slice(0, 1800)}`);
    }
  }

  return parts.join("\n\n").slice(0, 9000);
}

export type GenerateResult =
  | { ok: true; custom: DeckCustom }
  | { ok: false; error: string };

export async function generateDeckCustom(args: {
  companyName: string;
  audience: "hr" | "cfo" | "broker" | null;
  material: string;
}): Promise<GenerateResult> {
  if (args.material.trim().length < 200) {
    return {
      ok: false,
      error:
        "The report has too little in it to tailor from. Run or finish the analysis first — an agent asked to personalise from nothing will personalise from nothing.",
    };
  }

  const llm = createAnthropicClient();

  let raw: string;
  try {
    const res = await completeJson(llm, {
      system: SYSTEM,
      user: userPrompt(args),
      maxTokens: 900,
      label: "deck-custom",
    });
    raw = res.text;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
  }

  const parsed = extractJson(raw);
  if (!parsed) {
    return { ok: false, error: "The model didn't return usable JSON. Try again." };
  }

  const custom = sanitiseCustom(parsed);
  if (!custom.cover && !custom.context) {
    return {
      ok: false,
      error:
        "Nothing specific enough to say from this report. That's an honest answer rather than a failure — send the standard deck.",
    };
  }

  return { ok: true, custom };
}
