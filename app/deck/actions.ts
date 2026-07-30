"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
