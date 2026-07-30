import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed share links for the founders deck.
 *
 * The founders deck carries a $250K number and terms that aren't public, so it
 * can't sit at an open URL like the buyer deck. It also has to reach ten people
 * who don't have accounts, so a login gate would be useless. A signed,
 * expiring, per-recipient link is the shape that satisfies both.
 *
 * Properties that matter:
 *
 * - Per-recipient. Each link carries a label, so a forwarded link still tells
 *   you whose copy travelled. That's the whole reason not to mint one shared
 *   link and be done with it.
 * - Expiring. A link that works forever is a leak with a delay on it.
 * - Revocable in bulk. Rotating DECK_LINK_SECRET invalidates every outstanding
 *   link at once, which is the control you want at 2am.
 * - Stateless. No table to keep in sync, and no lookup on a hot path.
 *
 * The label is NOT a secret and is not trying to be — it's in the payload in
 * plain base64url so it can be logged after verification. The signature is what
 * grants access.
 */

const SEP = ".";

function secret(): string | null {
  const s = process.env.DECK_LINK_SECRET;
  // A short secret is worse than none, because it looks like protection.
  if (!s || s.length < 24) return null;
  return s;
}

/** Whether link minting is available at all. Surfaced in the admin UI. */
export function linksEnabled() {
  return secret() !== null;
}

const b64u = (b: Buffer) => b.toString("base64url");

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 32);
}

/**
 * @param label  who this link is for — a name or company, shown to nobody but
 *               recorded on every view.
 * @param days   lifetime. Short by default; a deck link outliving the
 *               conversation it belongs to has no upside.
 */
export function mintDeckLink(label: string, days = 30): string | null {
  const key = secret();
  if (!key) return null;

  const clean = label.trim().slice(0, 60).replace(/[^\w\s.@&'-]/g, "");
  if (!clean) return null;

  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const payload = `${clean}${SEP}${exp}`;
  const encoded = b64u(Buffer.from(payload, "utf8"));
  return `${encoded}${SEP}${sign(payload, key)}`;
}

export type LinkCheck =
  | { ok: true; label: string }
  | { ok: false; reason: "disabled" | "malformed" | "bad-signature" | "expired" };

export function verifyDeckLink(token: string | undefined): LinkCheck {
  const key = secret();
  if (!key) return { ok: false, reason: "disabled" };
  if (!token) return { ok: false, reason: "malformed" };

  const parts = token.split(SEP);
  if (parts.length !== 2) return { ok: false, reason: "malformed" };

  const [encoded, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const idx = payload.lastIndexOf(SEP);
  if (idx < 1) return { ok: false, reason: "malformed" };

  const label = payload.slice(0, idx);
  const exp = Number(payload.slice(idx + 1));
  if (!Number.isFinite(exp)) return { ok: false, reason: "malformed" };

  // Signature BEFORE expiry: an attacker shouldn't learn whether a forged
  // token's embedded date was plausible.
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(sig);
  if (
    expected.length !== given.length ||
    !timingSafeEqual(expected, given)
  ) {
    return { ok: false, reason: "bad-signature" };
  }

  if (exp * 1000 < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, label };
}
