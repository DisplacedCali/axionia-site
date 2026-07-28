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

export function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain.length > 0 && domain.includes(".") ? domain : null;
}

/** True when the domain can legitimately represent an employer. */
export function isCorporateDomain(domain: string | null): boolean {
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

/** "acme-corp.com" → "Acme Corp" — a fallback label only. */
export function companyNameFromDomain(domain: string): string {
  const root = domain.split(".")[0] ?? domain;
  return root
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
