import { looksGenerated } from "@/lib/accountReview";
import { domainFromEmail } from "@/lib/company";

/**
 * Whether an inquiry was written by a person.
 *
 * Separate from `leadSignal`, which asks how much a REAL inquiry is worth
 * looking at. This asks the prior question — is there anybody there — and the
 * two must not be one score. Collapsing them would mean a spam submission and
 * a quiet real one differ only by degree, and the quiet real one is exactly
 * what gets lost at the bottom of a single ranked list.
 *
 * Derived at read time and never stored, the same choice `accountReview` and
 * `leadSignal` made. The inputs change: somebody who submits junk today and
 * opens the deck from a corporate address next week should stop being filtered
 * without anybody recomputing a column, and a rule tightened next month should
 * re-judge the whole history rather than only what arrives after the deploy.
 *
 * ── THE BIAS ──
 *
 * A false positive here is worse than a false negative, and by a lot. Missing
 * a spam row costs three seconds of skimming; hiding a real inquiry costs a
 * client who thinks they were ignored. So the vetoes below run FIRST and are
 * absolute, the threshold needs several independent signals agreeing, and
 * everything filtered stays one click away rather than being deleted.
 *
 * Pure. No I/O — the caller supplies the cross-referenced counts.
 */

export interface AuthenticitySignals {
  email: string;
  fullName: string | null;
  companyName: string | null;
  message: string | null;
  /** Times this exact message text appears across the inbox. */
  duplicateMessages?: number;
  /** They opened a deck. Strong evidence of a person. */
  deckOpens?: number;
  /** They requested a report. Same. */
  requests?: number;
}

export interface Authenticity {
  fake: boolean;
  score: number;
  reasons: string[];
}

/**
 * Addresses that exist to be thrown away.
 *
 * Deliberately short and only the unambiguous ones. A long list scraped from
 * somewhere would eventually include a provider somebody uses for real, and
 * this list's whole job is to be the part nobody has to second-guess.
 */
const DISPOSABLE = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "spam4.me",
  "mohmal.com",
  "emailondeck.com",
]);

/**
 * What bulk submitters are selling, said plainly.
 *
 * Matched as whole words against a lowercased message. Substring matching put
 * "seo" inside "seosomething" and, worse, inside ordinary words — and a
 * benefits consultancy gets messages about plan design that should never trip
 * a spam rule because of a coincidence inside a longer word.
 */
const PITCH = [
  "seo",
  "backlink",
  "backlinks",
  "guest post",
  "guest posting",
  "link building",
  "web design services",
  "increase your traffic",
  "first page of google",
  "crypto",
  "bitcoin",
  "forex",
  "casino",
  "loan offer",
];

const urlCount = (s: string) => (s.match(/https?:\/\/|www\./gi) ?? []).length;

/** Latin text with Cyrillic or Greek letters mixed in — homoglyph spam. */
const mixedScript = (s: string | null) =>
  Boolean(s && /[a-z]/i.test(s) && /[Ѐ-ӿͰ-Ͽ]/.test(s));

export function assessLead(s: AuthenticitySignals): Authenticity {
  /*
    ── VETOES ──

    Evidence that a person was here, checked before anything else and returning
    immediately. These are actions rather than assertions: a name and a message
    can be typed by anything, but opening a deck or requesting a report means
    somebody went somewhere and did something.

    First rather than as negative points, so no accumulation of weak suspicion
    can ever outvote them. That ordering is the safety property — a scoring
    system where enough small doubts can bury a real action is one that will
    eventually hide a client.
  */
  if ((s.deckOpens ?? 0) > 0) {
    return { fake: false, score: 0, reasons: ["Opened a deck"] };
  }
  if ((s.requests ?? 0) > 0) {
    return { fake: false, score: 0, reasons: ["Requested a report"] };
  }

  const reasons: string[] = [];
  let score = 0;

  const message = s.message?.trim() ?? "";
  const lower = message.toLowerCase();
  const domain = domainFromEmail(s.email);

  /*
    A disposable address, on its own, decides it.

    Returned rather than scored, because there is no combination of other
    evidence that should rescue it and no combination that should be required
    alongside it: an address engineered to stop existing is not one somebody
    wants a reply at. The vetoes above already ran, so anyone who actually
    opened a deck or requested a report never reaches this line.
  */
  if (domain && DISPOSABLE.has(domain)) {
    return { fake: true, score: 99, reasons: ["Disposable email address"] };
  }

  // ── Machine-generated text in the identity fields ──
  if (looksGenerated(s.fullName)) {
    score += 3;
    reasons.push("Name looks machine-generated");
  }
  if (looksGenerated(s.companyName)) {
    score += 2;
    reasons.push("Company looks machine-generated");
  }

  // A URL in a NAME field. There is no innocent version of this.
  if (s.fullName && urlCount(s.fullName) > 0) {
    score += 4;
    reasons.push("Name field contains a link");
  }

  // Latin and Cyrillic inside one name is spoofing, essentially always. Real
  // multilingual names are written in ONE script; the mix is what's diagnostic.
  if (mixedScript(s.fullName) || mixedScript(s.companyName)) {
    score += 4;
    reasons.push("Mixed alphabets in the name");
  }

  // ── The message ──
  if (message) {
    const words = message.split(/\s+/).filter(Boolean);

    // Long and wordless. A real message contains spaces, because it contains
    // words; a random string is long without being one.
    if (message.length >= 20 && words.length === 1) {
      score += 3;
      reasons.push("Message is one long string");
    }

    const pitched = PITCH.filter((p) =>
      new RegExp(`\\b${p.replace(/ /g, "\\s+")}\\b`, "i").test(lower)
    );
    /*
      Two terms, not one. A single word carries almost no information here —
      Axionia sells to employers, and an employer may perfectly well be a
      crypto firm writing about benefits for their staff. Two of these terms
      in one short cold message is a pitch.
    */
    if (pitched.length > 0) {
      score += pitched.length >= 2 ? 4 : 2;
      reasons.push(`Selling something — mentions ${pitched.slice(0, 2).join(", ")}`);
    }

    // One link is a person sharing something. Two or more in a cold inquiry is
    // a campaign.
    if (urlCount(message) >= 2) {
      score += 3;
      reasons.push("Several links in the message");
    }

    if (mixedScript(message)) {
      score += 2;
      reasons.push("Mixed alphabets in the message");
    }

    // The same text more than twice across the inbox. Twice can be one person
    // who resubmitted because nothing appeared to happen.
    if ((s.duplicateMessages ?? 0) > 2) {
      score += 4;
      reasons.push(`Same message sent ${s.duplicateMessages} times`);
    }
  }

  /*
    There is deliberately no discount for a corporate-looking domain.

    The obvious one — `isCorporateDomain` — only asks whether the domain is
    absent from a list of free mail providers, so growthhackerz.biz and a
    throwaway .ru both qualify as "corporate" and every bulk sender would have
    been handed the same credit as a real employer. A domain is the cheapest
    thing on this form to fake, and crediting it would have quietly cancelled
    the signals above for exactly the submissions they were written for.

    The evidence that somebody is real lives in the vetoes at the top, and it
    is evidence of an ACTION rather than of a string.
  */
  return { fake: score >= 4, score, reasons };
}
