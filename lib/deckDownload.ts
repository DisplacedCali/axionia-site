import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed download grants for a deck.
 *
 * The old print gate asked for a name and email and believed whatever it was
 * told. That's fine as a courtesy and worthless as a control: the PDF left
 * with no proof of who took it, and the resulting `leads` row was
 * self-reported, which is exactly why the inbox ranking had to treat "opened
 * the deck" as a soft signal.
 *
 * This proves the address instead. They type it, we email a signed link, and
 * clicking it demonstrates they control the mailbox. No account, no OTP
 * screen — one round trip through email, which is the same proof an OTP gives
 * with none of the ceremony.
 *
 * THE IDENTITY IS INSIDE THE SIGNATURE, not just the deck. That's what makes
 * the watermark trustworthy: the name stamped on every page is the name that
 * was signed, so a recipient can't edit the URL to put someone else's name on
 * a copy they're about to forward.
 *
 * Separate secret from deckLinks and reportLinks for the same reason those are
 * separate from each other — revoking one class of link must not revoke the
 * others.
 */

const SEP = "~";

function secret(): string | null {
  const s =
    process.env.DECK_DOWNLOAD_SECRET ||
    process.env.DECK_LINK_SECRET ||
    process.env.REPORT_LINK_SECRET;
  if (!s || s.length < 24) return null;
  return s;
}

export function downloadGrantsEnabled() {
  return secret() !== null;
}

const clean = (s: string, max: number) =>
  s.trim().slice(0, max).replace(/[^\w\s.@&'+-]/g, "");

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 32);
}

export interface DownloadIdentity {
  name: string;
  email: string;
  org: string;
}

export function mintDownloadGrant(
  deck: string,
  id: DownloadIdentity,
  days = 7,
): string | null {
  const key = secret();
  if (!key) return null;

  const name = clean(id.name, 80);
  const email = clean(id.email, 200).toLowerCase();
  const org = clean(id.org ?? "", 120);
  if (!name || !email) return null;

  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const payload = [deck, name, email, org, exp].join(SEP);
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload, key)}`;
}

export type GrantCheck =
  | { ok: true; identity: DownloadIdentity }
  | { ok: false; reason: "disabled" | "malformed" | "bad-signature" | "expired" | "wrong-deck" };

export function verifyDownloadGrant(deck: string, token?: string): GrantCheck {
  const key = secret();
  if (!key) return { ok: false, reason: "disabled" };
  if (!token) return { ok: false, reason: "malformed" };

  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return { ok: false, reason: "malformed" };

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const parts = payload.split(SEP);
  if (parts.length !== 5) return { ok: false, reason: "malformed" };
  const [d, name, email, org, expRaw] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return { ok: false, reason: "malformed" };

  // Signature first — a forger shouldn't learn whether their guessed deck or
  // expiry was plausible.
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad-signature" };
  }

  if (d !== deck) return { ok: false, reason: "wrong-deck" };
  if (exp * 1000 < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, identity: { name, email, org } };
}

/** The line stamped on every printed page. */
export function watermarkLine(id: DownloadIdentity): string {
  const when = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const who = id.org ? `${id.name}, ${id.org}` : id.name;
  return `Prepared for ${who} · ${id.email} · ${when} · Confidential`;
}
