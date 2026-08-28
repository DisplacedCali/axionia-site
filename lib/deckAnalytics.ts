/**
 * What the deck log knows.
 *
 * Pure — no I/O, no Supabase, no React. The page hands it rows and gets back
 * everything the panel renders. Same reasoning as `leadSignal`: the interesting
 * part is the judgement about what counts as attention, and judgement belongs
 * somewhere it can be read in one screen and changed without touching layout.
 *
 * ── The one idea holding this together ──
 *
 * A row is not a person. Someone who arrives on a signed link, reads nine
 * slides, comes back on Thursday and then asks for the PDF leaves rows carrying
 * three different notions of who they are: a link label, nothing at all, and an
 * email address. Counted naively that is three strangers, and the deck looks
 * three times as popular as it is while the one person actually paying
 * attention never rises to the top.
 *
 * So identity is resolved per SESSION first and per row second. Every row in a
 * session inherits the best identity that session ever revealed, and the email
 * someone types at the download gate retroactively names every slide they read
 * before they typed it. That is the same stitch `identifySession` performs on
 * site_events, applied to the one table that was standing outside it.
 *
 * Sessions only exist from migration 036. Rows written before it have a null
 * session_id and fall back to email-then-label keying, which is what this did
 * implicitly before and is merely less good, not wrong.
 */

export type DeckSlugish = string;

export interface DeckEventRow {
  id: string;
  deck: DeckSlugish;
  event: string;
  created_at: string;
  user_id: string | null;
  link_label: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_org: string | null;
  referrer: string | null;
  user_agent: string | null;
  /** Present only once 036 has run. */
  session_id?: string | null;
  max_slide?: number | null;
  total_slides?: number | null;
  /** Present only once 037 has run. */
  company_id?: string | null;
  firm_id?: string | null;
  attribution?: string | null;
  org_name?: string | null;
}

/**
 * An employer or firm that has been reading, and how confidently we know it.
 *
 * `basis` is the strongest source across the rows, and it is shown rather than
 * hidden: a link minted against Invidia and a third-party guess from an IP
 * both produce a company name in the same column, and a page that renders them
 * identically will get one of them believed.
 */
export interface DeckOrg {
  key: string;
  kind: "company" | "firm" | "unmatched";
  id: string | null;
  name: string;
  basis: "link" | "session" | "email" | "ip";
  people: number;
  opens: number;
  prints: number;
  requests: number;
  decks: string[];
  depth: number | null;
  lastAt: string;
}

export interface DeckSummary {
  deck: string;
  /** Opens by anyone who isn't staff. Staff presenting is not traction. */
  opens: number;
  people: number;
  /** Asked for the emailed link. */
  requests: number;
  /** The file actually left. */
  prints: number;
  /** Furthest slide reached, median across sessions that reported one. */
  medianDepth: number | null;
  depthSample: number;
  lastAt: string | null;
}

export interface DeckPerson {
  key: string;
  name: string | null;
  email: string | null;
  org: string | null;
  label: string | null;
  staff: boolean;
  decks: string[];
  opens: number;
  /** Distinct days with an open. Coming back is the signal; clicking twice isn't. */
  days: number;
  requests: number;
  prints: number;
  /** 0–1, furthest reached on the deck they got deepest into. */
  depth: number | null;
  depthDeck: string | null;
  depthLabel: string | null;
  firstAt: string;
  lastAt: string;
  referrer: string | null;
  device: "mobile" | "desktop" | null;
  companyId: string | null;
  firmId: string | null;
  orgName: string | null;
  basis: string | null;
  /** Why this person is worth looking at now, in words. Empty means nothing yet. */
  reasons: string[];
}

export interface DeckAnalytics {
  summaries: DeckSummary[];
  people: DeckPerson[];
  daily: { label: string; n: number }[];
  referrers: [string, number][];
  devices: [string, number][];
  orgs: DeckOrg[];
  staffOpens: number;
  totalOpens: number;
  /** The 036 columns exist. Not "some row used them" — see analyzeDeckEvents. */
  hasDepth: boolean;
  /** The 037 columns exist. Not "some row is attributed" — see attributedOpens. */
  hasAttribution: boolean;
  /** External opens actually tied to an employer or firm. Zero is normal on day one. */
  attributedOpens: number;
  /** External people with no employer resolved at all. */
  unattributed: number;
}

/** Hardest evidence first. Mirrors lib/deckAttribution.ts — keep them in step. */
const BASIS_RANK: Record<string, number> = { link: 4, session: 3, email: 2, ip: 1 };

/** Events that mean somebody reached the deck. `progress` revises a view. */
const ACCESS = new Set(["view", "print", "request"]);

const dayKey = (iso: string) => iso.slice(0, 10);

/** Bare host, so a referrer reads as "linkedin.com" rather than a query string. */
export function host(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    // Our own pages aren't where a deck came from; they're where it lives.
    return h.endsWith("axionia.com") || h === "localhost" ? null : h;
  } catch {
    return null;
  }
}

/**
 * Coarse on purpose. A deck read on a phone was skimmed between meetings and a
 * deck read on a desktop was sat with, and no finer distinction than that
 * changes what you'd do about it.
 */
function device(ua: string | null | undefined): "mobile" | "desktop" | null {
  if (!ua) return null;
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

interface Identity {
  name: string | null;
  email: string | null;
  org: string | null;
  label: string | null;
  staff: boolean;
  companyId: string | null;
  firmId: string | null;
  orgName: string | null;
  /** Strongest attribution source seen for this person. */
  basis: string | null;
}

const blank = (): Identity => ({
  name: null,
  email: null,
  org: null,
  label: null,
  staff: false,
  companyId: null,
  firmId: null,
  orgName: null,
  basis: null,
});

/** Fill gaps without overwriting. First non-null wins, oldest row first. */
function absorb(into: Identity, r: DeckEventRow) {
  if (!into.email && r.contact_email) into.email = r.contact_email.toLowerCase();
  if (!into.name && r.contact_name) into.name = r.contact_name;
  if (!into.org && r.contact_org) into.org = r.contact_org;
  if (!into.label && r.link_label) into.label = r.link_label;
  if (r.user_id) into.staff = true;

  /*
    Attribution is taken by STRENGTH, not by recency. One person's rows can
    carry several sources — an anonymous open resolved from an IP, then the
    same session later identified by the email they typed at the gate — and
    the last row written is not the one that knows most. Letting recency win
    would let a third-party guess overwrite an address they gave us.
  */
  const rank = BASIS_RANK[r.attribution ?? ""] ?? 0;
  if (rank > (BASIS_RANK[into.basis ?? ""] ?? 0)) {
    into.basis = r.attribution ?? null;
    if (r.company_id) into.companyId = r.company_id;
    if (r.firm_id) into.firmId = r.firm_id;
  }
  // Firm can arrive on a row that carries no company, and vice versa.
  if (!into.companyId && r.company_id) into.companyId = r.company_id;
  if (!into.firmId && r.firm_id) into.firmId = r.firm_id;
  if (!into.orgName && r.org_name) into.orgName = r.org_name;
}

/**
 * Which columns the caller managed to read.
 *
 * The fetch in /admin/decks already walks FULL → DEPTH → BASE on error, so it
 * knows exactly which migrations are present. Until 2026-08-27 it threw that
 * away and this function guessed instead, by asking whether any row carried a
 * value — which answers a different question and gets it wrong in the ordinary
 * case. A migration that has just been run leaves every existing row null, so
 * the page told Tom to run a migration he had already run, and would have gone
 * on saying it until somebody opened a deck through an attributable path.
 */
export type DeckSchema = "full" | "depth" | "base";

export function analyzeDeckEvents(
  rows: DeckEventRow[],
  opts: { days?: number; schema?: DeckSchema } = {}
): DeckAnalytics {
  const buckets = opts.days ?? 30;

  // Oldest first, so "first seen" and the absorb order are honest.
  const all = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

  /*
    Fall back to the old inference only when the caller didn't say. A row
    carrying a value proves the column exists; the absence of one proves
    nothing either way.
  */
  const schema = opts.schema;
  const hasDepth =
    schema != null ? schema !== "base" : all.some((r) => r.session_id != null);

  /*
    Pass 1 — what each session eventually turned out to be.

    Deliberately NOT keyed on anything a caller controls. A session id is
    server-set and opaque; a contact email is typed by whoever is at the
    keyboard. So the session is the container and the email is a label that
    lands in it, never the other way around, and someone typing a colleague's
    address at the download gate renames only their own session.
  */
  const sessions = new Map<string, Identity>();
  for (const r of all) {
    if (!r.session_id) continue;
    let id = sessions.get(r.session_id);
    if (!id) sessions.set(r.session_id, (id = blank()));
    absorb(id, r);
  }

  /*
    Pass 2 — collapse rows onto people.

    Precedence is email, then link label, then session, then the row itself.
    Email outranks the label because a label is who a link was ISSUED to and an
    email is who turned up: they differ exactly when a link was forwarded, and
    the person who turned up is the one worth listing.
  */
  interface Acc {
    id: Identity;
    decks: Set<string>;
    days: Set<string>;
    opens: number;
    requests: number;
    prints: number;
    depth: Map<string, { reached: number; total: number }>;
    firstAt: string;
    lastAt: string;
    referrer: string | null;
    device: "mobile" | "desktop" | null;
  }

  const people = new Map<string, Acc>();

  for (const r of all) {
    const sess = r.session_id ? sessions.get(r.session_id) : undefined;
    const email = sess?.email ?? r.contact_email?.toLowerCase() ?? null;
    const label = sess?.label ?? r.link_label ?? null;

    const key = email
      ? `e:${email}`
      : label
      ? `l:${label}`
      : r.session_id
      ? `s:${r.session_id}`
      : r.user_id
      ? `u:${r.user_id}`
      : `r:${r.id}`;

    let p = people.get(key);
    if (!p) {
      p = {
        id: blank(),
        decks: new Set(),
        days: new Set(),
        opens: 0,
        requests: 0,
        prints: 0,
        depth: new Map(),
        firstAt: r.created_at,
        lastAt: r.created_at,
        referrer: null,
        device: null,
      };
      people.set(key, p);
    }

    absorb(p.id, r);
    p.lastAt = r.created_at;
    if (!p.referrer) p.referrer = host(r.referrer);
    if (!p.device) p.device = device(r.user_agent);

    if (ACCESS.has(r.event)) p.decks.add(r.deck);
    if (r.event === "view") {
      p.opens += 1;
      p.days.add(dayKey(r.created_at));
    }
    if (r.event === "request") p.requests += 1;
    if (r.event === "print") p.prints += 1;

    // Depth is a high-water mark, so the largest wins regardless of arrival
    // order — a progress row can land after a later view when a tab is
    // restored from the back/forward cache.
    if (r.event === "progress" && r.max_slide && r.total_slides) {
      const cur = p.depth.get(r.deck);
      if (!cur || r.max_slide > cur.reached) {
        p.depth.set(r.deck, { reached: r.max_slide, total: r.total_slides });
      }
    }
  }

  const list: DeckPerson[] = [...people.entries()].map(([key, p]) => {
    let depth: number | null = null;
    let depthDeck: string | null = null;
    let depthLabel: string | null = null;
    for (const [deck, d] of p.depth) {
      const pct = d.reached / d.total;
      if (depth === null || pct > depth) {
        depth = pct;
        depthDeck = deck;
        depthLabel = `${d.reached}/${d.total}`;
      }
    }

    /*
      Why this person, in words rather than a colour.

      One visual weight and a stated reason, the same choice `leadSignal` made:
      three shades of urgency is a legend to learn, and the only question this
      table answers is whether to write to someone today.
    */
    const reasons: string[] = [];
    if (p.prints > 0) reasons.push("Has the PDF");
    if (p.requests > 0 && p.prints === 0) reasons.push("Asked, never collected");
    if (p.days.size > 1) reasons.push(`Came back ${p.days.size} days`);
    if (depth !== null && depth >= 0.75) reasons.push("Read it through");
    if (p.decks.size > 1) reasons.push(`${p.decks.size} decks`);

    return {
      key,
      name: p.id.name,
      email: p.id.email,
      org: p.id.org,
      label: p.id.label,
      staff: p.id.staff,
      decks: [...p.decks].sort(),
      opens: p.opens,
      days: p.days.size,
      requests: p.requests,
      prints: p.prints,
      depth,
      depthDeck,
      depthLabel,
      firstAt: p.firstAt,
      lastAt: p.lastAt,
      referrer: p.referrer,
      device: p.device,
      companyId: p.id.companyId,
      firmId: p.id.firmId,
      orgName: p.id.orgName,
      basis: p.id.basis,
      reasons,
    };
  });

  // Most recent first. Recency is the right default here in a way it wasn't for
  // the inbox: the inbox is a queue you work down, this is a room you look
  // around, and the reasons column carries the ranking the eye needs.
  list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const external = list.filter((p) => !p.staff);

  // ── Per deck ──
  const decks = [...new Set(all.filter((r) => ACCESS.has(r.event)).map((r) => r.deck))];

  const summaries: DeckSummary[] = decks.map((deck) => {
    const mine = all.filter((r) => r.deck === deck && !r.user_id);

    // Depth per session, then the median across sessions — not the mean. One
    // person who read every slide twice shouldn't move the number that answers
    // "how far does a typical reader get".
    const perSession = new Map<string, number>();
    for (const r of mine) {
      if (r.event !== "progress" || !r.max_slide || !r.total_slides) continue;
      const k = r.session_id ?? r.id;
      const pct = r.max_slide / r.total_slides;
      if (pct > (perSession.get(k) ?? 0)) perSession.set(k, pct);
    }

    const views = mine.filter((r) => r.event === "view");
    return {
      deck,
      opens: views.length,
      people: external.filter((p) => p.decks.includes(deck)).length,
      requests: mine.filter((r) => r.event === "request").length,
      prints: mine.filter((r) => r.event === "print").length,
      medianDepth: median([...perSession.values()]),
      depthSample: perSession.size,
      lastAt: views.length ? views[views.length - 1].created_at : null,
    };
  });

  summaries.sort((a, b) => b.opens - a.opens);

  // ── Opens per day, oldest first, staff excluded ──
  const day = 864e5;
  const start = new Date(Date.now() - (buckets - 1) * day).setHours(0, 0, 0, 0);
  const daily = Array.from({ length: buckets }, (_, i) => ({
    label: new Date(start + i * day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    n: 0,
  }));
  for (const r of all) {
    if (r.event !== "view" || r.user_id) continue;
    const i = Math.floor((new Date(r.created_at).getTime() - start) / day);
    if (i >= 0 && i < buckets) daily[i].n += 1;
  }

  /*
    Roll people up to the organisation that will actually decide something.

    Firm first where there is one. A portfolio company reading the investor
    deck because Invidia sent it to them is Invidia paying attention, and
    listing the two separately splits one conversation into two rows that each
    look half as interesting as the thing really is.

    An org resolved only by IP and matching no row we hold still gets a line,
    keyed by name — "somebody at Meridian Manufacturing opened this" is worth
    seeing, and inventing a company record from a vendor string is how a guess
    becomes a permanent fact.
  */
  const orgMap = new Map<string, DeckOrg & { _people: Set<string>; _depths: number[] }>();

  for (const p of external) {
    const kind: DeckOrg["kind"] = p.firmId ? "firm" : p.companyId ? "company" : "unmatched";
    const id = p.firmId ?? p.companyId ?? null;
    if (!id && !p.orgName) continue;

    const key = id ? `${kind}:${id}` : `name:${p.orgName!.toLowerCase()}`;
    let o = orgMap.get(key);
    if (!o) {
      o = {
        key,
        kind,
        id,
        // Resolved to a real row but the name comes from the caller's lookup,
        // so a placeholder until the page joins it. Never the org string.
        name: id ? "" : p.orgName!,
        basis: (p.basis as DeckOrg["basis"]) ?? "ip",
        people: 0,
        opens: 0,
        prints: 0,
        requests: 0,
        decks: [],
        depth: null,
        lastAt: p.lastAt,
        _people: new Set(),
        _depths: [],
      };
      orgMap.set(key, o);
    }

    o._people.add(p.key);
    o.opens += p.opens;
    o.prints += p.prints;
    o.requests += p.requests;
    for (const d of p.decks) if (!o.decks.includes(d)) o.decks.push(d);
    if (p.depth !== null) o._depths.push(p.depth);
    if (p.lastAt > o.lastAt) o.lastAt = p.lastAt;
    if ((BASIS_RANK[p.basis ?? ""] ?? 0) > (BASIS_RANK[o.basis] ?? 0)) {
      o.basis = p.basis as DeckOrg["basis"];
    }
  }

  const orgs: DeckOrg[] = [...orgMap.values()]
    .map(({ _people, _depths, ...o }) => ({
      ...o,
      people: _people.size,
      decks: o.decks.sort(),
      depth: _depths.length ? Math.max(..._depths) : null,
    }))
    .sort((a, b) => b.opens - a.opens || b.lastAt.localeCompare(a.lastAt));

  const tally = (xs: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  };

  return {
    summaries,
    people: external,
    daily,
    referrers: tally(external.map((p) => p.referrer)),
    devices: tally(external.map((p) => p.device)),
    orgs,
    staffOpens: all.filter((r) => r.event === "view" && r.user_id).length,
    totalOpens: all.filter((r) => r.event === "view").length,
    hasDepth,
    hasAttribution:
      schema != null ? schema === "full" : all.some((r) => r.attribution != null),
    attributedOpens: external.filter((p) => p.companyId || p.firmId || p.orgName)
      .length,
    unattributed: external.filter((p) => !p.companyId && !p.firmId && !p.orgName).length,
  };
}
