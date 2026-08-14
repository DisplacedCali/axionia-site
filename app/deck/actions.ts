"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, deckDownloadLink } from "@/lib/email";
import { mintDownloadGrant, downloadGrantsEnabled } from "@/lib/deckDownload";
import { getSessionId } from "@/lib/analytics";
import { verifyDeckLink, type EntityRef } from "@/lib/deckLinks";
import { resolveAttribution } from "@/lib/deckAttribution";

/**
 * Deck view and print logging.
 *
 * /deck is public and shareable, so self-reported logging is the only signal
 * there is about who looked at it. Two rules hold this together:
 *
 * 1. Identity is resolved SERVER-SIDE from the session, never trusted from the
 *    client. A caller can lie about their name; they can't lie about being
 *    signed in as someone else.
 *
 * 2. No IP is recorded. See migration 012 — that's a privacy-policy decision,
 *    not a technical one, and it hasn't been made yet. Migration 036 adds a
 *    session id, which is NOT a new identifier: it's the same opaque ax_sid
 *    cookie site_events already stores, so this writes down which existing
 *    session an existing event belonged to and collects nothing new.
 */

type Contact = { name?: string; email?: string; org?: string };
export type DeckSlug = "buyer" | "founders" | "investor";

/**
 * Where each deck lives. A map rather than a ternary chain: the ternary was
 * already "founders or else buyer", so adding a third deck to it would have
 * silently routed investor downloads at the public buyer deck — a wrong URL
 * that returns 200 and shows the wrong document.
 */
const DECK_PATH: Record<DeckSlug, string> = {
  buyer: "/deck",
  founders: "/deck/founders",
  investor: "/deck/investor",
};

const clean = (s: string | undefined, max: number) => {
  const v = (s ?? "").trim();
  if (!v) return null;
  return v.slice(0, max);
};

type DeckEventKind = "view" | "print" | "progress" | "request";

/**
 * Postgres codes that mean migration 036 has not been applied here.
 *
 * 42703 is an unknown column — session_id, max_slide, total_slides. 23514 is
 * the event check constraint refusing 'progress' or 'request'. Both are the
 * same fact, and neither is a reason to stop logging: the deck predates 036 and
 * every column it needs is optional. A deployment that ran ahead of the SQL
 * editor should lose depth, not lose the log.
 */
const PRE_036 = new Set(["42703", "23514"]);

/**
 * What a share link says, verified here rather than believed.
 *
 * The callers used to pass `linkLabel` — a string the CLIENT held — straight
 * into the row. Migration 013 states the label "cannot be set by the caller",
 * and in the schema that was true, but the implementation handed it to the
 * browser and took it back: anyone could have posted to this action and
 * attributed their own read to any name they liked, which is a log that lies
 * about exactly the thing it exists to record.
 *
 * So the token travels instead. It is already in the recipient's URL, so
 * nothing is hidden from them, and the signature is re-checked on every event.
 * A forged label now requires forging the HMAC, which is what migration 013
 * always said was the case.
 *
 * Failure is silent and unattributed rather than an error. An expired link
 * still renders the buyer deck — that's the fall-through in /deck — and a read
 * that happened should be recorded even when we can no longer say whose it is.
 */
function fromToken(deck: DeckSlug, token?: string | null) {
  if (!token) return { label: null as string | null, ref: null as EntityRef | null };
  const v = verifyDeckLink(token, deck);
  return v.ok
    ? { label: v.label, ref: v.ref }
    : { label: null as string | null, ref: null as EntityRef | null };
}

async function log(
  event: DeckEventKind,
  deck: DeckSlug,
  contact?: Contact,
  link?: { label: string | null; ref: EntityRef | null },
  depth?: { max: number; total: number }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const h = headers();

  // Best-effort. A logging failure must never take the deck down mid-meeting.
  try {
    const admin = createAdminClient();
    const sessionId = getSessionId();
    const email = clean(contact?.email, 200)?.toLowerCase() ?? null;

    /*
      Not for progress rows. They arrive several times per reader, they group
      by session for every question anyone asks of them, and resolving each one
      would mean three extra queries and a possible vendor call per slide read.
      The view that opened the session already carries the attribution.
    */
    const attribution =
      event === "progress"
        ? null
        : await resolveAttribution(admin, {
            ref: link?.ref ?? null,
            sessionId,
            email,
          });

    const base = {
      deck,
      event,
      user_id: user?.id ?? null,
      link_label: clean(link?.label ?? undefined, 60),
      contact_name: clean(contact?.name, 120),
      contact_email: email,
      contact_org: clean(contact?.org, 160),
      referrer: h.get("referer")?.slice(0, 500) ?? null,
      user_agent: h.get("user-agent")?.slice(0, 400) ?? null,
    };

    const { error } = await admin.from("deck_events").insert({
      ...base,
      session_id: sessionId,
      max_slide: depth?.max ?? null,
      total_slides: depth?.total ?? null,
      ...(attribution ?? {}),
    });

    if (error && PRE_036.has(error.code)) {
      // A progress row IS the depth columns, so there is nothing left of it to
      // retry. Anything else is a real event and gets written in the old shape.
      // Attribution goes too — 037 owns those columns and may not have run
      // either, and the point of this path is that the event survives.
      if (event === "progress") return;
      const legacy = event === "request" ? { ...base, event: "print" } : base;
      await admin.from("deck_events").insert(legacy);
    }
  } catch {
    /* swallowed on purpose */
  }
}

export async function logDeckView(
  deck: DeckSlug = "buyer",
  linkToken?: string | null
) {
  await log("view", deck, undefined, fromToken(deck, linkToken));
}

/**
 * How far someone got.
 *
 * A separate event rather than an update to the view row, because deck_events
 * is an append-only audit trail and because updating would mean handing the
 * client a row id it could then aim at somebody else's row. The reader is
 * derived at read time as MAX(max_slide) per session, so extra rows cost
 * storage and nothing else.
 *
 * `total` travels with every row because deck length changes. 9/13 before four
 * slides are cut and 9/13 after are different readings, and a percentage
 * computed here would throw away the ability to tell them apart later.
 *
 * Called from the first slide onward, not only once somebody advances. A deck
 * that was opened and abandoned on slide one is the most important thing this
 * measures, and recording depth only for readers who moved would produce a
 * median describing the people who stayed.
 */
export async function logDeckProgress(
  deck: DeckSlug,
  maxSlide: number,
  totalSlides: number,
  linkToken?: string | null
) {
  const max = Math.round(maxSlide);
  const total = Math.round(totalSlides);
  // Nonsense in, nothing out — a client-supplied depth past the end of the deck
  // would skew every median on the admin page and cost nothing to drop.
  if (!Number.isFinite(max) || !Number.isFinite(total)) return;
  if (max < 1 || total < 1 || max > total || total > 200) return;

  await log("progress", deck, undefined, fromToken(deck, linkToken), { max, total });
}

/**
 * Records a print. Anonymous callers pass contact details; signed-in ones
 * don't need to, because the session already says who they are.
 *
 * Deliberately unverified — at this volume friction costs more than junk rows.
 * When junk becomes the problem, rate-limit here rather than adding a
 * confirmation step.
 */
export async function logDeckPrint(
  contact?: Contact,
  deck: DeckSlug = "buyer",
  linkToken?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const link = fromToken(deck, linkToken);

  // A signed link already names its recipient, so don't make them type it
  // again — we know more about them than a self-reported form would tell us.
  if (!user && !link.label) {
    const email = clean(contact?.email, 200);
    // Not validation so much as a typo check — anything past this is accepted.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { ok: false, error: "A work email, so we know who has the deck." };
    }
    if (!clean(contact?.name, 120)) {
      return { ok: false, error: "A name, please." };
    }
  }

  await log("print", deck, contact, link);

  // Anonymous printers are also a lead. Kept separate from the event log:
  // deck_events is an append-only audit trail; leads is a list you work.
  // Column names are the schema's (full_name / company_name / interest), and
  // 'interest' is constrained to ^[a-z0-9-]{1,40}$ by migration 006 — a value
  // outside that pattern would throw and silently cost the lead.
  if (!user && contact?.email) {
    try {
      await createAdminClient()
        .from("leads")
        .insert({
          email: clean(contact.email, 200)!.toLowerCase(),
          full_name: clean(contact.name, 120) ?? "Unknown",
          company_name: clean(contact.org, 160),
          interest: `${deck}-deck`,
        });
    } catch {
      /* a lead we failed to record must not block the download */
    }
  }

  return { ok: true };
}

/**
 * Request a download link for a deck.
 *
 * Replaces "type a name and we'll believe you" with one round trip through
 * email. Clicking the link proves control of the address, which is the same
 * proof an OTP gives without the ceremony — and it makes the watermark mean
 * something, because the name stamped on every page is the name that was
 * signed rather than the name someone typed.
 *
 * The lead is recorded on REQUEST, not on verification. Someone who asks and
 * never clicks is still someone who wanted the deck, and losing that would be
 * throwing away the signal this whole path exists to improve. `verified` on
 * the deck_event distinguishes the two.
 *
 * Honest about email being down: `sendEmail` reports `skipped` while
 * RESEND_API_KEY is unset, and this passes that through rather than claiming
 * to have sent something. A gate that silently swallows the request looks
 * identical to a broken site.
 */
export async function requestDeckDownload(args: {
  deck: DeckSlug;
  name: string;
  email: string;
  org?: string;
}): Promise<{ ok: true; sent: boolean } | { ok: false; error: string }> {
  const name = clean(args.name, 120);
  const email = clean(args.email, 200)?.toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "A work email — we'll send the link there." };
  }
  if (!name) return { ok: false, error: "A name, please." };

  if (!downloadGrantsEnabled()) {
    return {
      ok: false,
      error:
        "Downloads aren't available right now. Email tom@axionia.com and we'll send it directly.",
    };
  }

  const token = mintDownloadGrant(args.deck, {
    name,
    email,
    org: clean(args.org, 160) ?? "",
  });
  if (!token) return { ok: false, error: "Could not create a download link." };

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
  const path = DECK_PATH[args.deck];
  const url = `${site}${path}?dl=${token}`;

  // Recorded before the send, so a mail failure doesn't lose the lead.
  try {
    await createAdminClient().from("leads").insert({
      email,
      full_name: name,
      company_name: clean(args.org, 160),
      interest: `${args.deck}-deck`,
    });
  } catch {
    /* a lead we failed to record must not block the download */
  }

  /*
    'request', not 'print'.

    This row and the row logDeckPrint writes when the emailed link is finally
    used were both 'print', so one download journey logged two of them: the
    admin page reported every completed download twice, and reported every
    request nobody acted on as a download that never happened. Migration 036
    adds the kind and backfills the existing rows.

    Kept as an event at all — rather than waiting for the print — for the
    reason in the header: somebody who asks and never clicks still wanted the
    deck, and that is a thing worth being able to see.
  */
  await log("request", args.deck, { name, email, org: args.org });

  const mail = deckDownloadLink(name, url, args.deck);
  const res = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    template: `deck_download_${args.deck}`,
  });

  return { ok: true, sent: res.ok };
}
