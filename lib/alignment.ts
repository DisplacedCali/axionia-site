/**
 * Does the company someone asked us to research plausibly match the email
 * domain they asked from?
 *
 * The purpose is not security — it's a triage signal. A broker researching a
 * prospect, or someone pulling competitive intelligence on a rival, will
 * usually trip this. A real HR leader at the company usually won't.
 *
 * Deliberately biased toward flagging: a false flag costs one glance in the
 * admin queue, a false pass means we research the wrong relationship. Nothing
 * here blocks a request — it routes it to a human.
 */

const CORPORATE_SUFFIXES = new Set([
  "inc", "incorporated", "llc", "l", "corp", "corporation", "co", "company",
  "ltd", "limited", "plc", "lp", "llp", "group", "holdings", "holding",
  "partners", "the", "and", "of", "intl", "international", "usa", "us",
  "gmbh", "sa", "nv", "bv", "ag", "pty", "solutions", "services", "systems",
  "technologies", "enterprises",
]);

// Not the registrable domain — just enough to drop the public suffix.
const PUBLIC_SUFFIXES = new Set([
  "com", "net", "org", "edu", "gov", "mil", "int", "io", "co", "us", "uk",
  "ca", "au", "de", "fr", "nl", "se", "no", "dk", "fi", "es", "it", "ie",
  "biz", "info", "health", "care", "ai", "app", "dev",
]);

export type Alignment = "matched" | "review";

export type AlignmentResult = {
  status: Alignment;
  reason: string;
  /** Domain labels considered, e.g. ["aya","yale"] for aya.yale.edu */
  labels: string[];
};

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !CORPORATE_SUFFIXES.has(t));
}

/** Domain labels minus the public suffix: aya.yale.edu → ["aya","yale"] */
function domainLabels(domain: string): string[] {
  return domain
    .toLowerCase()
    .split(".")
    .filter((l) => l && !PUBLIC_SUFFIXES.has(l))
    .flatMap((l) => [l, ...l.split("-")])
    .filter((l) => l.length > 0);
}

export function checkAlignment(
  companyName: string | null | undefined,
  domain: string | null | undefined
): AlignmentResult {
  if (!domain) {
    return { status: "review", reason: "No email domain to compare against.", labels: [] };
  }
  if (!companyName || !companyName.trim()) {
    return { status: "review", reason: "No company name given.", labels: domainLabels(domain) };
  }

  const tokens = tokenize(companyName);
  const labels = domainLabels(domain);

  if (tokens.length === 0) {
    return {
      status: "review",
      reason: "Company name is only generic terms — nothing to match on.",
      labels,
    };
  }

  const joinedTokens = tokens.join("");
  const joinedLabels = labels.join("");

  // 1. whole-name containment either direction ("acmecorp" vs "acme")
  if (
    joinedLabels.includes(joinedTokens) ||
    joinedTokens.includes(joinedLabels)
  ) {
    return { status: "matched", reason: "Company name matches the email domain.", labels };
  }

  // 2. any substantial token appears in a domain label.
  // The token-contains-label direction is only allowed for labels of 4+ chars —
  // otherwise a two-letter label like "ge" matches any token containing "ge"
  // ("Regeneron" vs ge.com), which is a false pass in the costly direction.
  const strong = tokens.filter((t) => t.length >= 4);
  for (const t of strong) {
    if (labels.some((l) => l.includes(t) || (l.length >= 4 && t.includes(l)))) {
      return {
        status: "matched",
        reason: `"${t}" appears in the email domain.`,
        labels,
      };
    }
  }

  // 3. acronym: "General Electric" → "ge"
  const acronym = tokens.map((t) => t[0]).join("");
  if (acronym.length >= 2 && labels.some((l) => l === acronym)) {
    return {
      status: "matched",
      reason: `Domain matches the company acronym "${acronym}".`,
      labels,
    };
  }

  return {
    status: "review",
    reason: `"${companyName}" doesn't resemble the email domain "${domain}".`,
    labels,
  };
}
