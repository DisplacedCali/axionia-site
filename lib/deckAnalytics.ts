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
  /** Why this person is worth looking at now, in words. Empty means nothing yet. */
  reasons: string[];
}

export interface DeckAnalytics {
  summaries: DeckSummary[];
  people: DeckPerson[];
  daily: { label: string; n: number }[];
  referrers: [string, number][];
  devices: [string, number][];
  staffOpens: number;
  totalOpens: number;
  hasDepth: boolean;
}

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
}

const blank = (): Identity => ({
  name: null,
  email: null,
  org: null,
  label: null,
  staff: false,
});

/** Fill gaps without overwriting. First non-null wins, oldest row first. */
function absorb(into: Identity, r: DeckEventRow) {
  if (!into.email && r.contact_email) into.email = r.contact_email.toLowerCase();
  if (!into.name && r.contact_name) into.name = r.contact_name;
  if (!into.org && r.contact_org) into.org = r.contact_org;
  if (!into.label && r.link_label) into.label = r.link_label;
  if (r.user_id) into.staff = true;
}

export function analyzeDeckEvents(
  rows: DeckEventRow[],
  opts: { days?: number } = {}
): DeckAnalytics {
  const buckets = opts.days ?? 30;

  // Oldest first, so "first seen" and the absorb order are honest.
  const all = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const hasDepth = all.some((r) => r.session_id != null);

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
    staffOpens: all.filter((r) => r.event === "view" && r.user_id).length,
    totalOpens: all.filter((r) => r.event === "view").length,
    hasDepth,
  };
}
