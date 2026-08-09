/**
 * Pipeline prompts.
 *
 * Ported verbatim from axionia-app src/App.js. Wording is deliberately
 * unchanged — these have been tuned against real output, and rewriting them
 * during a structural port would make any quality regression impossible to
 * attribute.
 *
 * Pure string builders. No I/O, no model calls.
 *
 * One thing preserved on purpose: the truncation limits. callAPI() clipped the
 * user prompt at 6000 chars and the system prompt at 2000. Those caps shaped
 * every output the pipeline has ever produced, so they live in llm.ts rather
 * than quietly disappearing.
 */

export interface CompanyContext {
  name: string;
  industry?: string | null;
  hq?: string | null;
  size?: string | null;
  website?: string | null;
  description?: string | null;
}

/** "Acme Dental — Dental / DSO, Minneapolis MN, ~1,200 employees" */
export function companyLine(co: CompanyContext): string {
  return `${co.name} — ${co.industry ?? ""}, ${co.hq ?? ""}, ${co.size ?? ""}`;
}

/**
 * What the client asked to have examined, plus anything the analyst added.
 *
 * The intake form collects "Programs or vendors you'd like looked at" and a
 * free-text context field, and both were being discarded. They are the single
 * most valuable customisation signal available: the client stating, in their
 * own words, what they want looked at. Appended to the steps where it changes
 * the answer — benefits posture, scoring, and the brief.
 *
 * Returns "" when there is nothing, so callers can concatenate unconditionally
 * without introducing an empty labelled section.
 */
export function clientAskBlock(input: {
  programs?: string | null;
  context?: string | null;
  analystContext?: string | null;
  roleGroups?: string | null;
  portfolio?: {
    funding?: string | null;
    states?: string | null;
    tiers?: string | null;
    categories?: string[] | null;
    vendors?: string | null;
    carriers?: string | null;
  } | null;
}): string {
  const parts: string[] = [];
  if (input.programs?.trim()) {
    parts.push(`Programs or vendors the client specifically asked to have examined: ${input.programs.trim()}`);
  }
  if (input.roleGroups?.trim()) {
    // First-party and specific — it outranks anything inferred from the
    // industry label, which only ever yields a default mix. Said plainly so
    // the model doesn't average it back toward the sector.
    parts.push(
      `The client's own description of their largest role groups (treat as authoritative, and in preference to any assumption drawn from the industry label): ${input.roleGroups.trim()}`,
    );
  }
  const pf = input.portfolio;
  if (pf) {
    // First-party facts. Stated as such so the model stops inferring what it
    // has been told, which is where a sector average silently replaces an
    // employer's actual portfolio.
    const lines = [
      pf.funding && `Funding: ${pf.funding}`,
      pf.states && `States of operation: ${pf.states}`,
      pf.tiers && `Covered lives by tier: ${pf.tiers}`,
      pf.categories?.length && `Programs they run today: ${pf.categories.join(", ")}`,
      pf.vendors && `Vendors named: ${pf.vendors}`,
      pf.carriers && `Carrier / TPA: ${pf.carriers}`,
    ].filter(Boolean);
    if (lines.length) {
      parts.push(
        "The client's own description of their benefit portfolio (treat as authoritative — do not infer or average over anything stated here):\n" +
          lines.join("\n"),
      );
    }
  }
  if (input.context?.trim()) {
    parts.push(`Context the client provided: ${input.context.trim()}`);
  }
  if (input.analystContext?.trim()) {
    // Flagged as analyst-supplied so the model treats it as established fact
    // rather than something to hedge about.
    parts.push(`Analyst notes from source documents (treat as verified): ${input.analystContext.trim()}`);
  }
  return parts.length ? "\n\n" + parts.join("\n") : "";
}

// ── Step 1: validate / identify ─────────────────────────────────────────────

/**
 * Company identification.
 *
 * The ownership rule below is not boilerplate caution. A run on Valtruis — a
 * Welsh Carson portfolio company — returned "subsidiary or affiliate of HCSC",
 * and because HCSC is a very large Chicago insurer and Valtruis is a Chicago
 * value-based-care investor, the guess was plausible enough to survive. It then
 * became load-bearing: the controlled-group analysis, the ALE exposure, the top
 * recommendation and the whole time-sensitivity argument all rested on it.
 *
 * A wrong parent company in a report addressed to that company, from a firm
 * selling analytical rigour, is the most expensive error this pipeline can make.
 * So the instruction is explicit that omitting ownership is the correct answer
 * when it isn't known — a model will not volunteer "I don't know" unless told
 * that doing so is success rather than failure.
 */
export const VALIDATE_SYSTEM =
  "You are a company identification assistant. Given a company name, optional website, and industry hint, identify and verify the company. Return JSON with fields: name (official), industry (standardized), hq (City, State), size (e.g. ~1,200 employees), description (2-3 sentences relevant to HR and benefits decisions), website (confirmed URL), confidence (high/medium/low), ownership (parent, investor or corporate group — or null), ownershipConfidence (high/medium/low/unknown), stateOfOperations (array of state abbreviations where they operate).\n\n" +
  "OWNERSHIP RULE — read carefully. Do NOT infer a parent company, investor or corporate affiliation from geography, sector, name similarity or plausibility. If you do not specifically know who owns this company, set ownership to null and ownershipConfidence to \"unknown\". That is a correct and expected answer, not a failure. A confidently wrong parent is far worse than an absent one, because everything downstream will be built on it.\n\n" +
  "The description must not assert corporate structure, parent companies or affiliations unless ownershipConfidence is \"high\". Describe what the company does instead.";

export function validateUser(input: {
  companyName: string;
  website?: string | null;
  industry?: string | null;
  /**
   * Operator instructions. Routed here as well as to the LinkedIn step, because
   * this is where identity is decided — and an instruction like "this is not
   * affiliated with X" is useless if it only reaches a later step that has
   * already inherited the wrong premise.
   */
  notes?: string | null;
}): string {
  const parts = [`Company: ${input.companyName.trim()}`];
  if (input.website?.trim()) parts.push(`Website: ${input.website.trim()}`);
  if (input.industry?.trim()) parts.push(`Industry: ${input.industry.trim()}`);
  if (input.notes?.trim()) {
    parts.push(
      `Operator instructions — these come from a human who knows this company and OVERRIDE your own assumptions, including any assumption about ownership or affiliation: ${input.notes.trim()}`,
    );
  }
  return parts.join("\n");
}

// ── Wave 1a: LinkedIn intel + company profile ───────────────────────────────

export const LINKEDIN_SYSTEM = `You are a research analyst. Return 6-8 concise bullet points (start each with -) covering:
1. HR/benefits leadership — CHRO, VP Total Rewards, Benefits Director names and tenure if findable
2. C-suite and key executives relevant to benefits decisions (CEO, CFO, COO) — background and priorities
3. Investors and ownership — PE firm, major investors, board members, recent funding rounds or ownership changes. State only what you specifically know. If you cannot name the owner, write "- Ownership: not established from available sources" and move on. Never infer a parent or affiliate from shared geography, shared sector or a similar name.
4. Advisors or board members with HR/benefits relevance
5. Recent HR hires, departures, or org changes
6. Benefits-related job postings or signals
Be specific with names and roles where findable — and say so plainly where they are not. An honest "not established" is worth more here than a plausible guess, because everything downstream treats these bullets as fact.`;

export function linkedinUser(co: CompanyContext, notes?: string | null): string {
  let s = `Company: ${companyLine(co)}`;
  if (co.website) s += `\nWebsite: ${co.website}`;
  if (notes?.trim()) s += `\nNotes: ${notes.trim()}`;
  return s;
}

export const PROFILE_SYSTEM =
  "You are a B2B analyst. Give 4 bullet points (plain text, start each with -) about this company: workforce composition, business model, ownership structure, HR characteristics. No headers or bold.";

export function profileUser(co: CompanyContext): string {
  return `Company: ${companyLine(co)}\n${co.description ?? ""}`;
}

// ── Wave 1b: benefits posture + financial posture ───────────────────────────

export const BENEFITS_SYSTEM =
  "You are a benefits expert. Give 4 bullet points (plain text, start each with -) about this company's likely benefits situation: programs, broker/vendor relationships, workforce needs, pain points. No headers or bold. " +
  "If the client named specific programs or vendors, address those directly in at least two bullets — say what the program is typically worth to an employer of this type and what to be sceptical about in the vendor's own claims. Be specific rather than generic.";

export const FINANCIAL_SYSTEM =
  "You are a financial analyst. Give 4 bullet points (plain text, start each with -) about financial posture relevant to benefits: margins, ownership, workforce stability, urgency signals. No headers or bold.";

export function contextOnlyUser(
  co: CompanyContext,
  ask: string = "",
): string {
  return `Company: ${companyLine(co)}${ask}`;
}

// ── Wave 2a: states detection, then regulatory ──────────────────────────────

export const STATES_SYSTEM =
  "Identify all US states this company likely has significant operations in. Return JSON with fields: states (array of state abbreviations), primaryState (string), rationale (string).";

export function statesUser(
  co: CompanyContext,
  profile: string,
  linkedinData: string,
): string {
  return `Company: ${companyLine(co)}\nProfile: ${profile}\nLinkedIn: ${linkedinData ?? ""}`;
}

/**
 * The regulatory section.
 *
 * Two structural fixes over the original, which produced five pages for one
 * company.
 *
 * FEDERAL OVERLAY WAS ASKED FOR PER STATE. ACA employer-mandate status, ERISA,
 * FMLA and MHPAEA parity are federal by definition — requesting them "for each
 * state" made the model write the same paragraph once per state. It's now one
 * section, asked once.
 *
 * STATES ARE NO LONGER EQUAL. Only the two or three with real exposure get a
 * paragraph; the rest get a line. See `rankStatesByExposure` for how that's
 * decided and why uncovered states aren't promoted.
 *
 * The prompt is also told the curated mandate table renders alongside it, and
 * not to restate what a table carries better. That instruction is doing as
 * much work as the state limit — the model was spending its budget
 * transcribing statute numbers and effective dates the report already shows.
 */
export function regulatorySystem(focusStates: string, otherStates: string): string {
  return `You are a healthcare employment law and benefits compliance expert advising an employer on its benefit program.

IMPORTANT CONTEXT: the report this text appears in ALREADY renders a curated table of state mandates, with statute names, effective dates and ERISA self-insured reach for each. Do not restate those. A table carries them better than prose does. Your job is the employer-specific read the table cannot give: what this actually means for them, what to do, and what to watch.

Return plain bullet points starting with -. No preamble, no closing summary.

Structure exactly as follows.

## Federal overlay
ONE section, not repeated per state. ACA employer mandate status, ERISA obligations, FMLA and MHPAEA parity — only as they bear on THIS employer's size and funding structure. 4 bullets maximum. Skip anything that is merely true of all employers.

${
  focusStates
    ? `## Priority states — ${focusStates}
A short section per state, in that order. These carry the highest exposure. For each, 3-4 bullets covering: where state law reaches a self-insured plan despite ERISA preemption, paid leave obligations with real operational consequences, and any pending change creating near-term urgency. Lead with the exposure, not the citation.`
    : ""
}

${
  otherStates
    ? `## Other states — ${otherStates}
ONE bullet per state. Name the single most consequential obligation and nothing else. If there is nothing materially different from the federal baseline, say exactly that in one clause.`
    : ""
}

Be specific to this employer. Bold anything that reaches a self-insured plan — that is the fact most likely to be missed, because employers assume preemption covers them and for most mandates it does.`;
}

export function regulatoryUser(
  co: CompanyContext,
  stateList: string,
  profile: string,
  financial: string,
): string {
  return `Company: ${companyLine(co)}\nStates: ${stateList}\nWorkforce: ${profile}\nFinancial: ${financial}`;
}

// ── Wave 2b: workforce segmentation ─────────────────────────────────────────

export const WORKFORCE_SYSTEM = `You are a health economist specializing in workforce benefit valuation. Analyze this company's specific workforce and return JSON only.

Analyze the ACTUAL workforce of this specific company — use their real role types, not generic dental or clinical labels.

Key principles: Highly licensed professionals value professional development and premium health access over standard benefits. Frontline/hourly workers value immediate, usable, low-friction benefits. Administrative staff value financial wellness and career development.

Return JSON with these fields only:
- segments: array of 3-5 workforce segments specific to THIS company (use actual role names like 'Home Health Aides', 'Care Coordinators', 'Retail Associates', 'Warehouse Workers' etc), each with:
  name, description, headcountEstimate,
  retentionRisk: "high"|"medium"|"low",
  retentionRiskDrivers: array of 2-3 specific factors for THIS company and market,
  replacementComplexity: "high"|"medium"|"low",
  replacementNote: one sentence on fill difficulty without dollar figures,
  utilization: which benefit types this segment uses,
  topBenefit: single most valued benefit for this segment,
  premiumBenefits: array of {benefit, rationale},
  insight: sharp economic insight specific to this segment and company
- summaryBullets: array of 4-5 sharp bullets about benefit ROI and retention risk
- overallInsight: 2-sentence synthesis
- axioniaPitch: most compelling economic argument for Axionia`;

export function workforceUser(co: CompanyContext, profile: string): string {
  return `Company: ${companyLine(co)}\nProfile: ${profile}`;
}

/** Lighter retry when the main workforce step fails to parse. */
export const WORKFORCE_FALLBACK_SYSTEM = `You are a workforce analyst. For this specific company, identify 3-4 workforce segments and return JSON only.
Return: { segments: [ { name, description, headcountEstimate, retentionRisk, retentionRiskDrivers, replacementComplexity, replacementNote, topBenefit, premiumBenefits, insight } ], summaryBullets, overallInsight, axioniaPitch }
Use the actual role types for this company. Keep each field concise.`;

export function workforceFallbackUser(co: CompanyContext, profile: string): string {
  return `Company: ${companyLine(co)}
Industry: ${co.industry ?? ""}
Size: ${co.size ?? ""}
Profile: ${profile?.slice(0, 400) ?? ""}`;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Built from the canonical axis weights rather than hardcoded.
 *
 * The original prompt listed weights summing to 0.91 and told the model to
 * "multiply remaining 0.09 proportionally" — which made overallScore
 * non-reproducible across runs. The model is no longer asked to compute the
 * total at all: computeOverallScore() in data/axes.ts is the source of truth,
 * and the model is asked only for the eight component scores.
 */
export const SCORING_SYSTEM = `You are a scoring engine for Axionia. Score this company 0-100 on EIGHT dimensions. Return ONLY valid JSON, no markdown.

Dimensions:
1. spendEfficiency - ROI from benefit spend
2. decisionMaturity - strategic vs reactive decisions
3. workforceAlignment - benefits match workforce composition
4. vendorIndependence - freedom from vendor capture
5. analyticsReadiness - evidence-based decision capability
6. cfoEngagement - CFO involvement in benefit decisions
7. regulatoryReadiness - preparedness for current and pending compliance (score LOW if gaps found)
8. appreciationValue - how well benefits match what this workforce actually values (score LOW if premium segment needs unmet)

Return JSON with these exact fields: spendEfficiency, decisionMaturity, workforceAlignment, vendorIndependence, analyticsReadiness, cfoEngagement, regulatoryReadiness, appreciationValue, readinessLabel (Foundation Only/Emerging/Structured/Strategic/Optimized), spendRationale, maturityRationale, alignmentRationale, vendorRationale, analyticsRationale, cfoRationale, regulatoryRationale, appreciationRationale, topOpportunity, urgencySignal, conversationHook, weakestAxis.

Do NOT return overallScore — it is computed from the eight dimensions using fixed weights. Score each dimension independently on its own merits.`;

export function scoringUser(args: {
  co: CompanyContext;
  profile: string;
  benefits: string;
  financial: string;
  regulatory: string;
  workforceInsight: string;
  ask?: string;
}): string {
  return `Company: ${companyLine(args.co)}
Profile: ${args.profile}
Benefits: ${args.benefits}
Financial: ${args.financial}
Regulatory: ${args.regulatory}
Workforce: ${args.workforceInsight || "not available"}${args.ask ?? ""}`;
}

// ── Synthesis: pre-meeting brief ────────────────────────────────────────────

export const SYNTHESIS_SYSTEM = `Write a sharp internal pre-meeting brief with sections:
## Company Snapshot
## Benefits Intelligence
## Financial & Workforce Context
## Radar Diagnosis
## Conversation Hooks
## Watch-Outs
2-4 bullets per section. Direct and opinionated. Include regulatory and workforce appreciation angles.

If the client named specific programs or vendors, answer that question explicitly in Conversation Hooks — they asked it, so leaving it unaddressed is the one thing they will notice.`;

export function synthesisUser(args: {
  co: CompanyContext;
  profile: string;
  benefits: string;
  financial: string;
  regulatory: string;
  workforceInsight: string;
  scores: Record<string, unknown>;
  ask?: string;
}): string {
  const s = args.scores as Record<string, number | string>;
  return `Company: ${companyLine(args.co)}
Profile: ${args.profile}
Benefits: ${args.benefits}
Financial: ${args.financial}
Regulatory: ${args.regulatory}
Workforce: ${args.workforceInsight ?? ""}
Radar: Spend ${s.spendEfficiency} | Maturity ${s.decisionMaturity} | Alignment ${s.workforceAlignment} | Vendor ${s.vendorIndependence} | Analytics ${s.analyticsReadiness} | CFO ${s.cfoEngagement} | Regulatory ${s.regulatoryReadiness} | Appreciation ${s.appreciationValue}
Label: ${s.readinessLabel}${args.ask ?? ""}`;
}

/** Appended when a step must return JSON. Ported from askJSON(). */
export const JSON_ONLY_SUFFIX =
  "\n\nRespond with ONLY valid JSON. No markdown fences, no explanation, no text outside the JSON object.";
