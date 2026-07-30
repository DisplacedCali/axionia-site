"use server";

import { requireStaff } from "@/lib/auth";
import { mintDeckLink } from "@/lib/deckLinks";

/**
 * Mints a share link for the founders deck.
 *
 * Staff-gated even though the token itself is unguessable: minting is how a
 * $250K deck leaves the building, and it should sit inside the same access
 * boundary as everything else that does.
 */
export async function createShareLink(
  label: string,
  days: number
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireStaff();

  const token = mintDeckLink(label, days);
  if (!token) {
    return {
      ok: false,
      error:
        "DECK_LINK_SECRET is missing or under 24 characters. Set it in Vercel and .env.local, then reload.",
    };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";
  return { ok: true, url: `${site}/deck/founders?k=${encodeURIComponent(token)}` };
}
