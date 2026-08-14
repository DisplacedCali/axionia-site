import { resolveCompanyByDomain, domainFromEmail, normaliseDomain } from "@/lib/company";
import { resolveOrg } from "@/lib/deckOrg";
import type { EntityRef } from "@/lib/deckLinks";

/**
 * Which employer or firm a deck open belongs to.
 *
 * Four sources, tried hardest-evidence first, and the winner is recorded so
 * the admin page can say how it knows. That last part is the point: an id
 * signed into a share link and a 30%-accurate third-party guess are both a
 * company name in the same column, and a number you cannot qualify is a number
 * you will eventually over-trust.
 *
 *   link     you chose the recipient when you minted the link. Exact.
 *   session  this browser already identified itself by submitting a form,
 *            so site_events carries a company_id. The 014 stitch.
 *   email    the address given at the download gate resolves by domain.
 *            Self-reported, unverified until the emailed link is clicked.
 *   ip       an organisation resolved by a third party, address discarded.
 *            Dark by default. Wrong roughly as often as it is missing.
 *
 * Everything returned here is denormalised onto the event and never updated
 * afterwards, the same choice `report_events` made: attribution is a statement
 * about what was known at the moment somebody opened a deck, and a company
 * later merging into another must not silently rewrite who read the founders
 * deck in March.
 */

export interface Attribution {
  company_id: string | null;
  firm_id: string | null;
  attribution: "link" | "session" | "email" | "ip" | null;
  org_name: string | null;
  org_domain: string | null;
  org_asn: string | null;
}

const NOTHING: Attribution = {
  company_id: null,
  firm_id: null,
  attribution: null,
  org_name: null,
  org_domain: null,
  org_asn: null,
};

type Admin = { from: (t: string) => any };

/**
 * A company's firm, so a portfolio company's read also counts for the firm
 * that sent them. Reads `merged_into` too, because 024 forbids an alias from
 * carrying a firm_id — an alias's firm lives on the survivor.
 */
async function firmOfCompany(admin: Admin, companyId: string): Promise<string | null> {
  const { data } = await admin
    .from("companies")
    .select("firm_id, merged_into")
    .eq("id", companyId)
    .maybeSingle();
  if (!data) return null;
  if (data.firm_id) return data.firm_id as string;
  if (!data.merged_into) return null;

  const { data: head } = await admin
    .from("companies")
    .select("firm_id")
    .eq("id", data.merged_into)
    .maybeSingle();
  return (head?.firm_id as string) ?? null;
}

export async function resolveAttribution(
  admin: Admin,
  args: {
    ref?: EntityRef | null;
    sessionId?: string | null;
    email?: string | null;
  }
): Promise<Attribution> {
  try {
    // ── 1. The link said so ──
    if (args.ref) {
      if (args.ref.kind === "firm") {
        return { ...NOTHING, firm_id: args.ref.id, attribution: "link" };
      }
      return {
        ...NOTHING,
        company_id: args.ref.id,
        firm_id: await firmOfCompany(admin, args.ref.id),
        attribution: "link",
      };
    }

    // ── 2. This session already told us who it was ──
    /*
      Newest first. A shared machine, or one person who moved employers, can
      leave a session pointing at two companies over its lifetime, and the most
      recent identification is the one that describes who is reading now.
    */
    if (args.sessionId) {
      const { data } = await admin
        .from("site_events")
        .select("company_id")
        .eq("session_id", args.sessionId)
        .not("company_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      const companyId = data?.[0]?.company_id as string | undefined;
      if (companyId) {
        return {
          ...NOTHING,
          company_id: companyId,
          firm_id: await firmOfCompany(admin, companyId),
          attribution: "session",
        };
      }
    }

    // ── 3. The address they typed ──
    /*
      resolveCompanyByDomain, never a direct read of `companies` by domain: it
      follows a merge, and reading directly returns the alias — which 023 made
      into a pointer, so attribution would land on a row that is no longer a
      company. Free-mail domains are refused inside it, which is what stops
      every gmail.com reader collapsing into one enormous employer.
    */
    if (args.email) {
      const company = await resolveCompanyByDomain(admin, domainFromEmail(args.email));
      if (company) {
        return {
          ...NOTHING,
          company_id: company.id,
          firm_id: await firmOfCompany(admin, company.id),
          attribution: "email",
        };
      }
    }

    // ── 4. Last resort, and it knows it ──
    /*
      Returns null unless IP_ORG_LOOKUP is on. The organisation is recorded
      whether or not it matches a row we hold: "somebody at Invidia Capital
      opened this" is worth having even when there is no Invidia company
      record, and inventing one from a vendor string is how a guess becomes a
      permanent fact about a company.
    */
    const org = await resolveOrg();
    if (org) {
      const known = await resolveCompanyByDomain(admin, normaliseDomain(org.domain));
      return {
        company_id: known?.id ?? null,
        firm_id: known ? await firmOfCompany(admin, known.id) : null,
        attribution: "ip",
        org_name: org.name,
        org_domain: org.domain,
        org_asn: org.asn,
      };
    }

    return NOTHING;
  } catch {
    // Attribution is an enrichment. Failing to work out who somebody is must
    // never cost the record that somebody was here.
    return NOTHING;
  }
}
