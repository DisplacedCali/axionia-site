"use server";

import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normaliseDomain, companyNameFromDomain } from "@/lib/company";
import {
  mintDeckLink,
  type LinkedDeck,
  type EntityRef,
  type Entity,
} from "@/lib/deckLinks";

const PATH: Record<LinkedDeck, string> = {
  buyer: "/deck",
  founders: "/deck/founders",
  investor: "/deck/investor",
  proposal: "/deck/proposal",
};

const ENV_HINT: Record<LinkedDeck, string> = {
  buyer: "DECK_LINK_SECRET",
  founders: "DECK_LINK_SECRET",
  investor: "DECK_LINK_SECRET (INVESTOR_LINK_SECRET overrides it)",
  proposal: "DECK_LINK_SECRET (PROPOSAL_LINK_SECRET overrides it)",
};

const VALID: LinkedDeck[] = ["buyer", "founders", "investor", "proposal"];

/**
 * Search companies and firms together, for the mint form.
 *
 * One list rather than two pickers, because at the moment of minting you are
 * thinking about a recipient and not about which table they live in. Firms
 * sort first: the gated decks are the ones worth attributing, and their
 * recipients are firms far more often than employers.
 *
 * Aliases are excluded. 023 turned merged duplicates into pointers, and
 * minting against one would attribute a read to a row that is no longer a
 * company — invisible, and noticed only when a firm's opens fail to appear.
 */
export async function searchEntities(q: string): Promise<Entity[]> {
  await requireStaff();

  const term = q.trim().slice(0, 80);
  if (term.length < 2) return [];

  const admin = createAdminClient();
  const like = `%${term.replace(/[%_]/g, "")}%`;

  const [firms, companies] = await Promise.all([
    admin.from("firms").select("id, name, domain, kind").or(`name.ilike.${like},domain.ilike.${like}`).limit(8),
    admin
      .from("companies")
      .select("id, name, domain")
      .is("merged_into", null)
      .or(`name.ilike.${like},domain.ilike.${like}`)
      .limit(8),
  ]);

  return [
    ...(firms.data ?? []).map((f) => ({
      kind: "firm" as const,
      id: f.id as string,
      name: (f.name as string) ?? "Unnamed firm",
      domain: (f.domain as string) ?? null,
      firmKind: (f.kind as string) ?? null,
    })),
    ...(companies.data ?? []).map((c) => ({
      kind: "company" as const,
      id: c.id as string,
      name: (c.name as string) || companyNameFromDomain((c.domain as string) ?? ""),
      domain: (c.domain as string) ?? null,
    })),
  ];
}

/**
 * Create the row you're about to mint against.
 *
 * Exists so an unrecognised recipient doesn't stop you mid-conversation. The
 * alternative — refuse to mint until somebody has been added elsewhere — is
 * how you end up with a free-text label again, except now it's a workaround
 * instead of a feature.
 *
 * A company REQUIRES a domain, because `companies.domain` is not null and is
 * the key every lookup joins on; a firm doesn't, because 024 made
 * `firms.domain` nullable precisely for a firm you know about through a
 * portfolio company and have never had an email from.
 */
export async function createEntity(args: {
  kind: "company" | "firm";
  name: string;
  domain?: string;
  firmKind?: "investor" | "operator";
}): Promise<{ ok: true; entity: Entity } | { ok: false; error: string }> {
  await requireStaff();

  const name = args.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "A name." };

  const domain = normaliseDomain(args.domain);
  const admin = createAdminClient();

  if (args.kind === "company") {
    if (!domain) {
      return { ok: false, error: "A company needs a domain — it's the key everything joins on." };
    }
    // Already there? Return it rather than colliding on the unique index. The
    // person minting wants a link, not a lecture about a duplicate.
    const { data: existing } = await admin
      .from("companies")
      .select("id, name, domain, merged_into")
      .eq("domain", domain)
      .maybeSingle();

    if (existing) {
      const id = (existing.merged_into as string) ?? (existing.id as string);
      return {
        ok: true,
        entity: {
          kind: "company",
          id,
          name: (existing.name as string) || companyNameFromDomain(domain),
          domain,
        },
      };
    }

    const { data, error } = await admin
      .from("companies")
      .insert({ domain, name })
      .select("id, name, domain")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Could not create the company." };
    return { ok: true, entity: { kind: "company", id: data.id, name: data.name ?? name, domain } };
  }

  if (domain) {
    const { data: existing } = await admin
      .from("firms")
      .select("id, name, domain, kind")
      .eq("domain", domain)
      .maybeSingle();
    if (existing) {
      return {
        ok: true,
        entity: {
          kind: "firm",
          id: existing.id as string,
          name: existing.name as string,
          domain,
          firmKind: existing.kind as string,
        },
      };
    }
  }

  const { data, error } = await admin
    .from("firms")
    .insert({ name, domain, kind: args.firmKind ?? "investor" })
    .select("id, name, domain, kind")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create the firm." };
  return {
    ok: true,
    entity: {
      kind: "firm",
      id: data.id,
      name: data.name,
      domain: data.domain ?? null,
      firmKind: data.kind,
    },
  };
}

/**
 * Mints a share link for one deck.
 *
 * Staff-gated even though the token itself is unguessable: minting is how a
 * $250K offer or a priced round leaves the building, and it should sit inside
 * the same access boundary as everything else that does. The buyer link grants
 * nothing, but it goes through the same door — a second, looser path to the
 * same function is the one that gets forgotten when the rules change.
 *
 * The deck argument is validated rather than trusted. It arrives from a client
 * component, and an unchecked value would reach mintDeckLink and be signed —
 * producing a working link to a path that doesn't exist, which fails as a 404
 * in front of the recipient rather than here.
 *
 * ── WHY THE ENTITY IS SIGNED IN ──
 *
 * The label used to be the whole record of who a link was for, which made
 * attribution a string-matching problem: "Invidia" and "Invidia Capital" are
 * one firm and two labels, and neither is a join. Carrying the id inside the
 * signature means an open attributes to a row with certainty — not inference —
 * and a recipient editing the URL to credit their read to somebody else would
 * have to forge the HMAC.
 *
 * The entity is validated here against the real tables rather than trusted
 * from the form. A signed id pointing at nothing would attribute every open to
 * a company that doesn't exist, and it would be signed, so nothing downstream
 * would ever question it.
 *
 * ── WHY EVERY LINK IS WRITTEN DOWN (043) ──
 *
 * Tokens are stateless, so before 043 a link existed only in whatever email it
 * was pasted into. Every mint path in the admin ends here, which makes this
 * the one place a log write can't be forgotten by a fourth path added later.
 *
 * The log write is best-effort on purpose. The link is valid the moment it's
 * signed, whether or not the row lands, and refusing to hand it over because
 * 043 hasn't been run would stop you mid-conversation over bookkeeping. So a
 * failed write comes back as `warning`, which both mint forms show, rather
 * than as a failure or a console line nobody reads.
 *
 * `versionId` is proposal-only. It's checked here rather than trusted from
 * mintProposalLink because this is a server action a client can call
 * directly: an unchecked id would put a URL in the log for a version that
 * belongs to a different company than the one signed into the token.
 */
export async function createShareLink(
  label: string,
  days: number,
  deck: LinkedDeck = "founders",
  entity?: { kind: "company" | "firm"; id: string } | null,
  versionId?: string | null
): Promise<{ ok: true; url: string; warning?: string } | { ok: false; error: string }> {
  const { user } = await requireStaff();

  if (!VALID.includes(deck)) {
    return { ok: false, error: "Unknown deck." };
  }

  let ref: EntityRef | null = null;
  if (entity) {
    const admin = createAdminClient();
    if (entity.kind === "company") {
      const { data } = await admin
        .from("companies")
        .select("id, merged_into")
        .eq("id", entity.id)
        .maybeSingle();
      if (!data) return { ok: false, error: "That company no longer exists." };
      // Follow the merge at MINT time rather than at read time. The link
      // outlives this moment, and attributing a year of opens to an alias is
      // the failure 023 exists to prevent.
      ref = { kind: "company", id: (data.merged_into as string) ?? (data.id as string) };
    } else {
      const { data } = await admin.from("firms").select("id").eq("id", entity.id).maybeSingle();
      if (!data) return { ok: false, error: "That firm no longer exists." };
      ref = { kind: "firm", id: data.id as string };
    }
  }

  // A proposal link without a version 404s for the recipient (see
  // /deck/proposal), and a version on any other deck means nothing. Both are
  // caller mistakes worth refusing before anything is signed.
  if (deck === "proposal" && !versionId) {
    return { ok: false, error: "A proposal link needs a version." };
  }
  if (deck !== "proposal" && versionId) {
    return { ok: false, error: "Only proposal links carry a version." };
  }
  if (versionId) {
    if (!UUID_RE.test(versionId)) return { ok: false, error: "That version id isn't valid." };
    if (ref?.kind !== "company") {
      return { ok: false, error: "A proposal link has to be minted against its company." };
    }
    const { data: v } = await createAdminClient()
      .from("deck_versions")
      .select("id")
      .eq("id", versionId)
      .eq("deck", "proposal")
      .eq("company_id", ref.id)
      .maybeSingle();
    if (!v) return { ok: false, error: "That version isn't on this company." };
  }

  const token = mintDeckLink(label, days, deck, ref);
  if (!token) {
    return {
      ok: false,
      error: `${ENV_HINT[deck]} is missing or under 24 characters. Set it in Vercel and .env.local, then reload.`,
    };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
  const url =
    `${site}${PATH[deck]}?k=${encodeURIComponent(token)}` +
    (versionId ? `&v=${versionId}` : "");

  // Recomputed from `days` rather than decoded from the token: mintDeckLink
  // stamps `now + days` in the same tick, so the two agree to the second.
  const expiresAt = new Date(Date.now() + days * 86400 * 1000).toISOString();

  const { error: logError } = await createAdminClient()
    .from("deck_links")
    .insert({
      deck,
      // Same sanitiser mintDeckLink applied, so the logged label is the one
      // deck_events.link_label will record on every open of this link.
      label: label.trim().slice(0, 60).replace(/[^\w\s.@&'-]/g, ""),
      company_id: ref?.kind === "company" ? ref.id : null,
      firm_id: ref?.kind === "firm" ? ref.id : null,
      version_id: versionId ?? null,
      url,
      expires_at: expiresAt,
      created_by: user.id,
    });

  if (logError) {
    return {
      ok: true,
      url,
      warning:
        // 42P01 from Postgres, PGRST205 from PostgREST's schema cache — which
        // one arrives depends on whether the cache has been reloaded since.
        logError.code === "42P01" || logError.code === "PGRST205"
          ? "Link works, but it wasn't saved to the company page. Run migration 043 in Supabase."
          : `Link works, but it wasn't saved to the company page: ${logError.message}`,
    };
  }

  return { ok: true, url };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
