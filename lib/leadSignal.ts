import { isCorporateDomain, domainFromEmail } from "@/lib/company";

/**
 * How much a given inquiry is worth looking at.
 *
 * The inbox sorted by recency, which treats "This is amazing!" from a named
 * person at a real company exactly the same as a submission full of random
 * strings. At two real inquiries and dozens of junk ones, recency is the wrong
 * order — the whole list gets skimmed and the one that mattered gets skimmed
 * with it.
 *
 * Derived, never stored, for the same reason as `accountReview`: the inputs
 * change. Someone who submits a form today and prints the deck tomorrow should
 * rank higher tomorrow without anyone recomputing a column.
 *
 * Pure. No I/O — the caller supplies the cross-referenced counts.
 */

export interface LeadSignals {
  email: string;
  fullName: string | null;
  companyName: string | null;
  message: string | null;
  interest: string;
  /** Times this address appears in deck_events. */
  deckOpens: number;
  /** Report requests from this address. */
  requests: number;
}

export type Heat = "high" | "warm" | "cool";

export interface LeadScore {
  heat: Heat;
  score: number;
  reasons: string[];
}

/**
 * Interests that mean someone is asking to spend money, as opposed to asking
 * a question. `general` is deliberately absent — it's the default on the form,
 * so it carries no information at all.
 */
const HIGH_INTENT = new Set([
  "founding-member",
  "performance-pricing",
  "on-prem",
  "third-party-research",
  "scenario-modeling",
  "workforce-strategy",
  "benefit-design",
]);

/**
 * Did a human write this?
 *
 * Not length alone — a random string is long. Real messages contain spaces,
 * because they contain words.
 */
function humanWrote(message: string | null): boolean {
  const m = message?.trim() ?? "";
  if (m.length < 4) return false;
  const words = m.split(/\s+/).filter(Boolean);
  return words.length >= 2 || (words.length === 1 && /[.!?]$/.test(m));
}

export function scoreLead(s: LeadSignals): LeadScore {
  const reasons: string[] = [];
  let score = 0;

  // Strongest single signal available without talking to them: they came back.
  if (s.deckOpens > 0) {
    score += 4;
    reasons.push(s.deckOpens > 1 ? `Opened the deck ${s.deckOpens}×` : "Opened the deck");
  }
  if (s.requests > 0) {
    score += 4;
    reasons.push("Requested a report");
  }

  if (HIGH_INTENT.has(s.interest)) {
    score += 3;
    reasons.push("Asked about something specific");
  }

  if (humanWrote(s.message)) {
    score += 2;
    reasons.push("Wrote a real message");
  }

  const domain = domainFromEmail(s.email);
  if (domain && isCorporateDomain(domain)) {
    score += 2;
    reasons.push("Corporate email");
  }

  // A name with a space in it is a name. Weak on its own, so it only counts
  // toward a total that already has something in it.
  if (score > 0 && s.fullName && s.fullName.trim().includes(" ")) {
    score += 1;
  }

  const heat: Heat = score >= 6 ? "high" : score >= 3 ? "warm" : "cool";
  return { heat, score, reasons };
}
