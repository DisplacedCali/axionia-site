import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed share links for the gated decks.
 *
 * The founders deck carries a $250K number and terms that aren't public, and
 * the investor deck carries a raise, a valuation and a seven-year model. Neither
 * can sit at an open URL like the buyer deck. Both have to reach people who
 * don't have accounts, so a login gate would be useless. A signed, expiring,
 * per-recipient link is the shape that satisfies both.
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
 *
 * ── Why the key is derived per deck, and why founders is the exception ──
 *
 * Two gated decks signed with one secret would be one deck with two URLs: the
 * payload is a label and an expiry with nothing naming the deck, so a founders
 * link would verify on /deck/investor and hand a founding member the raise.
 * Same reasoning as reportLinks binding the report id.
 *
 * So every deck signs with HMAC(secret, "deck:<slug>") — a distinct key per
 * deck, from one configured secret. Founders keeps using the bare secret,
 * unchanged: deriving a key for it too would have been tidier and would have
 * invalidated every outstanding founders link the moment this deployed, which
 * is a live recipient hitting a 404 during a conversation. The asymmetry is
 * ugly and it is the reason nothing breaks.
 *
 * INVESTOR_LINK_SECRET overrides the derivation entirely when set, so an
 * investor leak can be revoked without cutting off the founding members.
 */

const SEP = ".";

/**
 * Decks a link can be minted for.
 *
 * "Gated" would be the wrong word now that buyer is here. For founders and
 * investor the signature IS the access control — no valid link, no page. For
 * the buyer deck it controls nothing: /deck is public and stays public, and a
 * link only attaches a name to the view.
 *
 * That distinction lives in the two page components, not here, and it is the
 * one thing not to get backwards. A buyer link that fails to verify must fall
 * through to the ordinary public deck; a founders link that fails must 404.
 */
export type LinkedDeck = "buyer" | "founders" | "investor";

function baseSecret(): string | null {
  const s = process.env.DECK_LINK_SECRET;
  // A short secret is worse than none, because it looks like protection.
  if (!s || s.length < 24) return null;
  return s;
}

/**
 * The signing key for one deck.
 *
 * Founders returns the base secret verbatim — see the header. Everything else
 * gets its own secret if one is configured, and a derived key otherwise.
 */
function secret(deck: LinkedDeck = "founders"): string | null {
  const base = baseSecret();

  if (deck === "investor") {
    const own = process.env.INVESTOR_LINK_SECRET;
    if (own && own.length >= 24) return own;
    if (!base) return null;
    return createHmac("sha256", base).update("deck:investor").digest("hex");
  }

  // Buyer gets its own derived key for the same reason investor does, even
  // though nothing here is being protected: a buyer link that verified on
  // /deck/investor would turn a label you handed a prospect into a key to the
  // raise. The derivation costs nothing and removes the question.
  if (deck === "buyer") {
    if (!base) return null;
    return createHmac("sha256", base).update("deck:buyer").digest("hex");
  }

  return base;
}

/** Whether link minting is available for a deck. Surfaced in the admin UI. */
export function linksEnabled(deck: LinkedDeck = "founders") {
  return secret(deck) !== null;
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
 * @param deck   which deck the link opens. A token minted for one will not
 *               verify for the other.
 */
export function mintDeckLink(
  label: string,
  days = 30,
  deck: LinkedDeck = "founders"
): string | null {
  const key = secret(deck);
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

export function verifyDeckLink(
  token: string | undefined,
  deck: LinkedDeck = "founders"
): LinkCheck {
  const key = secret(deck);
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
