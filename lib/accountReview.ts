/**
 * Whether an account looks automated.
 *
 * Derived at read time, never stored — see migration 021. Freezing a guess
 * into a column means the guess goes stale and starts getting treated as a
 * fact, and the inputs here genuinely change: an account unverified for an
 * hour is unremarkable, the same account unverified for a week is not.
 *
 * The point is to make triage cheap, not to be right on its own. Anything this
 * flags is offered to a person, never acted on automatically.
 *
 * Pure. No I/O.
 */

export interface ReviewSignals {
  fullName: string | null;
  companyName: string | null;
  email: string;
  emailConfirmedAt: string | null;
  createdAt: string;
  hasCompany: boolean;
  requestCount: number;
}

export interface Suspicion {
  suspect: boolean;
  score: number;
  reasons: string[];
}

/**
 * Random-string detector.
 *
 * Exported because `leadAuthenticity` needs the same judgement about a name on
 * a contact form. One implementation rather than two: a second copy would
 * drift, and the two would then disagree about the same person depending on
 * which screen you were looking at.
 *
 * Real names have vowels in ordinary proportion, one or two words, and
 * consistent case. "WvYttuKSYRdMTRVRId" has none of that. Tuned to be quiet
 * rather than clever — a false positive here costs a real person their
 * account visibility, so it takes several signals agreeing before anything
 * gets flagged.
 */
export function looksGenerated(s: string | null): boolean {
  if (!s) return false;
  const t = s.trim();
  if (t.length < 10 || t.includes(" ")) return false;

  const letters = t.replace(/[^a-z]/gi, "");
  if (letters.length < 10) return false;

  const vowels = (letters.match(/[aeiou]/gi) ?? []).length / letters.length;
  // English names sit around 0.35–0.45. Below 0.30 across ten-plus letters
  // with no space is very hard to do by accident.
  const vowelPoor = vowels < 0.3;

  // Case flipping mid-word more than a couple of times: dRvKzQxA.
  const flips = (t.match(/[a-z][A-Z]/g) ?? []).length;
  return vowelPoor && flips >= 3;
}

const FREEMAIL = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "aol.com", "outlook.com",
  "icloud.com", "mac.com", "me.com", "optonline.net", "comcast.net",
  "live.com", "msn.com", "protonmail.com", "proton.me", "gmx.com",
  "mail.com", "yandex.com", "zoho.com",
]);

export function assessAccount(s: ReviewSignals): Suspicion {
  const reasons: string[] = [];
  let score = 0;

  const ageHours = (Date.now() - new Date(s.createdAt).getTime()) / 36e5;

  /*
    Never verified, and old enough that they've had every chance to.
    The single strongest signal: Supabase creates the auth user when the code
    is REQUESTED, not when it's entered, so an account that never confirmed is
    an account nobody ever wanted — including, often, the person whose address
    was used.
  */
  if (!s.emailConfirmedAt && ageHours > 24) {
    score += 3;
    reasons.push("Never verified the email");
  }

  if (looksGenerated(s.fullName)) {
    score += 2;
    reasons.push("Name looks machine-generated");
  }
  if (looksGenerated(s.companyName)) {
    score += 2;
    reasons.push("Company looks machine-generated");
  }

  const domain = s.email.split("@")[1]?.toLowerCase() ?? "";
  // Weak on its own — plenty of real early conversations start from a personal
  // address — so it only counts alongside something else.
  if (FREEMAIL.has(domain) && score > 0) {
    score += 1;
    reasons.push("Personal email domain");
  }

  // Did anything, so a person was here. Outweighs the rest.
  if (s.requestCount > 0 || s.hasCompany) {
    return { suspect: false, score: 0, reasons: ["Requested a report or is linked to a company"] };
  }

  return { suspect: score >= 4, score, reasons };
}
