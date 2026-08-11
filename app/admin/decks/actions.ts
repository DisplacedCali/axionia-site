"use server";

import { requireStaff } from "@/lib/auth";
import { mintDeckLink, type LinkedDeck } from "@/lib/deckLinks";

const PATH: Record<LinkedDeck, string> = {
  buyer: "/deck",
  founders: "/deck/founders",
  investor: "/deck/investor",
};

const ENV_HINT: Record<LinkedDeck, string> = {
  buyer: "DECK_LINK_SECRET",
  founders: "DECK_LINK_SECRET",
  investor: "DECK_LINK_SECRET (INVESTOR_LINK_SECRET overrides it)",
};

const VALID: LinkedDeck[] = ["buyer", "founders", "investor"];

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
 */
export async function createShareLink(
  label: string,
  days: number,
  deck: LinkedDeck = "founders"
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireStaff();

  if (!VALID.includes(deck)) {
    return { ok: false, error: "Unknown deck." };
  }

  const token = mintDeckLink(label, days, deck);
  if (!token) {
    return {
      ok: false,
      error: `${ENV_HINT[deck]} is missing or under 24 characters. Set it in Vercel and .env.local, then reload.`,
    };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
  return {
    ok: true,
    url: `${site}${PATH[deck]}?k=${encodeURIComponent(token)}`,
  };
}
