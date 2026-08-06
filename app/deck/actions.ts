"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, deckDownloadLink } from "@/lib/email";
import { mintDownloadGrant, downloadGrantsEnabled } from "@/lib/deckDownload";

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
 *    not a technical one, and it hasn't been made yet.
 */

type Contact = { name?: string; email?: string; org?: string };
export type DeckSlug = "buyer" | "founders";

const clean = (s: string | undefined, max: number) => {
  const v = (s ?? "").trim();
  if (!v) return null;
  return v.slice(0, max);
};

async function log(
  event: "view" | "print",
  deck: DeckSlug,
  contact?: Contact,
  linkLabel?: string | null
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const h = headers();

  // Best-effort. A logging failure must never take the deck down mid-meeting.
  try {
    await createAdminClient()
      .from("deck_events")
      .insert({
        deck,
        event,
        user_id: user?.id ?? null,
        link_label: clean(linkLabel ?? undefined, 60),
        contact_name: clean(contact?.name, 120),
        contact_email: clean(contact?.email, 200)?.toLowerCase() ?? null,
        contact_org: clean(contact?.org, 160),
        referrer: h.get("referer")?.slice(0, 500) ?? null,
        user_agent: h.get("user-agent")?.slice(0, 400) ?? null,
      });
  } catch {
    /* swallowed on purpose */
  }
}

export async function logDeckView(
  deck: DeckSlug = "buyer",
  linkLabel?: string | null
) {
  await log("view", deck, undefined, linkLabel);
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
  linkLabel?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A signed link already names its recipient, so don't make them type it
  // again — we know more about them than a self-reported form would tell us.
  if (!user && !linkLabel) {
    const email = clean(contact?.email, 200);
    // Not validation so much as a typo check — anything past this is accepted.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { ok: false, error: "A work email, so we know who has the deck." };
    }
    if (!clean(contact?.name, 120)) {
      return { ok: false, error: "A name, please." };
    }
  }

  await log("print", deck, contact, linkLabel);

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
  const path = args.deck === "founders" ? "/deck/founders" : "/deck";
  const url = `${site}${path}?dl=${token}`;

  // Recorded before the send, so a mail failure doesn't lose the lead.
  try {
    const admin = createAdminClient();
    await admin.from("leads").insert({
      email,
      full_name: name,
      company_name: clean(args.org, 160),
      interest: `${args.deck}-deck`,
    });
    await admin.from("deck_events").insert({
      deck: args.deck,
      event: "print",
      contact_name: name,
      contact_email: email,
      contact_org: clean(args.org, 160),
    });
  } catch {
    /* a lead we failed to record must not block the download */
  }

  const mail = deckDownloadLink(name, url, args.deck);
  const res = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    template: `deck_download_${args.deck}`,
  });

  return { ok: true, sent: res.ok };
}
