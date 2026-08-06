/**
 * Company identity is derived from the email domain.
 *
 * Critical guard: personal/free email providers must never become a
 * "company" — otherwise every gmail.com requester collapses into a single
 * shared org and would see each other's reports.
 */

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "fastmail.com",
  "hey.com",
  "duck.com",
  "tutanota.com",
  "163.com",
  "qq.com",
]);

/**
 * Normalise anything domain-shaped into a bare host.
 *
 * A company row appeared as `www.allstarservicesnow.com` because nothing ever
 * stripped the prefix — and since `domain` is the key everything joins on,
 * `www.x.com` and `x.com` became two companies for one employer. Handles
 * pasted URLs too, because the admin form takes a domain and people paste what
 * their browser shows them.
 *
 * `www.` only. Other subdomains are NOT stripped: `internal.invidia-capital.com`
 * may genuinely be a different tenant, and guessing wrong merges two employers'
 * reports. Those are resolved deliberately, by merging companies.
 */
export function normaliseDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // scheme
  d = d.split("/")[0].split("?")[0].split("#")[0]; // path, query, fragment
  d = d.replace(/^www\./, "");
  d = d.replace(/\.$/, ""); // trailing dot on a fully-qualified name
  d = d.split(":")[0]; // port
  return d.length > 0 && d.includes(".") ? d : null;
}

export function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  return normaliseDomain(email.slice(at + 1));
}

/** True when the domain can legitimately represent an employer. */
export function isCorporateDomain(domain: string | null): boolean {
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

/** "acme-corp.com" → "Acme Corp" — a fallback label only. */
export function companyNameFromDomain(domain: string): string {
  // Normalise first, or a pasted "www.acme.com" labels the company "Www".
  const root = (normaliseDomain(domain) ?? domain).split(".")[0] ?? domain;
  return root
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Resolve a domain to the company it currently belongs to, following a merge.
 *
 * Duplicates are aliased, not deleted (migration 023) — `domain` is the key
 * every lookup joins on, so a deleted row is recreated by the next email from
 * that domain and you merge the same employer again next month.
 *
 * Every caller that resolves a company from an email MUST use this. Reading
 * `companies` by domain directly returns the alias, and work then lands on a
 * row that is no longer a company: invisible, and only noticed when a report
 * fails to appear for someone who should see it.
 *
 * Single hop. `mergeCompanies` resolves to the head before writing, so chains
 * can't form — and not looping here means a bad row can't hang the site.
 */
export async function resolveCompanyByDomain(
  admin: { from: (t: string) => any },
  domain: string | null,
): Promise<{ id: string; name: string | null } | null> {
  const d = normaliseDomain(domain);
  if (!d || !isCorporateDomain(d)) return null;

  const { data } = await admin
    .from("companies")
    .select("id, name, merged_into")
    .eq("domain", d)
    .maybeSingle();

  if (!data) return null;
  if (!data.merged_into) return { id: data.id, name: data.name ?? null };

  const { data: head } = await admin
    .from("companies")
    .select("id, name")
    .eq("id", data.merged_into)
    .maybeSingle();

  return head ? { id: head.id, name: head.name ?? null } : { id: data.id, name: data.name ?? null };
}
