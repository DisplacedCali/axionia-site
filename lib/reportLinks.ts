import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed share links for a client report.
 *
 * Same shape as lib/deckLinks.ts and deliberately a separate module, because
 * the two protect different things and should be revocable independently.
 * Rotating the deck secret at 2am because a deck leaked must not also lock
 * every client out of their report.
 *
 * THE ID IS IN THE PAYLOAD. A deck link only had to prove "you may see the
 * deck"; there is one deck. A report link has to prove "you may see THIS
 * report", so the signature covers the report id — otherwise a link minted for
 * one employer would open every other employer's analysis by swapping the id
 * in the URL. That is the single most important difference between the two
 * files.
 *
 * A report is a named employer's benefit programs and spend. Links are short-
 * lived by default for that reason, and every view is logged against the label
 * so a forwarded link still tells you whose copy travelled.
 */

const SEP = ".";

function secret(): string | null {
  // Falls back to the deck secret so links work before a second env var is
  // set, but prefers its own — see the revocation note above.
  const s = process.env.REPORT_LINK_SECRET || process.env.DECK_LINK_SECRET;
  if (!s || s.length < 24) return null;
  return s;
}

/** Whether link minting is available at all. Surfaced in the admin UI. */
export function reportLinksEnabled() {
  return secret() !== null;
}

const b64u = (b: Buffer) => b.toString("base64url");

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 32);
}

/**
 * @param reportId  bound into the signature — see the note above.
 * @param label     who this is for. Not a secret; recorded on every view.
 * @param days      lifetime. 14 by default: a report link outliving the
 *                  conversation it belongs to has no upside and real downside.
 */
export function mintReportLink(
  reportId: string,
  label: string,
  days = 14,
): string | null {
  const key = secret();
  if (!key) return null;
  if (!reportId) return null;

  const clean = label.trim().slice(0, 80).replace(/[^\w\s.@&'-]/g, "");
  if (!clean) return null;

  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const payload = `${reportId}${SEP}${clean}${SEP}${exp}`;
  const encoded = b64u(Buffer.from(payload, "utf8"));
  return `${encoded}${SEP}${sign(payload, key)}`;
}

export type ReportLinkCheck =
  | { ok: true; label: string }
  | {
      ok: false;
      reason: "disabled" | "malformed" | "bad-signature" | "expired" | "wrong-report";
    };

/**
 * Verify a token AGAINST A SPECIFIC REPORT. The caller must pass the id from
 * the route, so a valid signature for report A cannot be replayed at report B.
 */
export function verifyReportLink(
  reportId: string,
  token: string | undefined,
): ReportLinkCheck {
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

  const first = payload.indexOf(SEP);
  const last = payload.lastIndexOf(SEP);
  if (first < 1 || last <= first) return { ok: false, reason: "malformed" };

  const id = payload.slice(0, first);
  const label = payload.slice(first + 1, last);
  const exp = Number(payload.slice(last + 1));
  if (!Number.isFinite(exp)) return { ok: false, reason: "malformed" };

  // Signature first: an attacker shouldn't learn whether a forged token's
  // embedded id or date was plausible.
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad-signature" };
  }

  if (id !== reportId) return { ok: false, reason: "wrong-report" };
  if (exp * 1000 < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, label };
}
