import { headers } from "next/headers";

/**
 * Resolving a request to an organisation without keeping the address.
 *
 * ── READ THIS BEFORE TURNING IT ON ──
 *
 * This module is dark unless IP_ORG_LOOKUP is set, and it should stay dark
 * until /privacy has been amended and someone qualified has read it. The site
 * currently publishes "no third-party analytics", and this sends the visitor's
 * address to a third party. That is a policy change, not a deploy.
 *
 * ── WHAT IT DOES AND DOES NOT DO ──
 *
 * It answers "which organisation is this request coming from", and it is not
 * very good at it. Published 2026 match rates for reverse-IP company
 * resolution run 30–65%, with 80–90% precision on the subset that does match,
 * and the trend is downward: remote work replaced clean corporate ranges with
 * residential ones, Apple Private Relay removes the origin entirely, corporate
 * VPN and SASE attribute everyone to the provider, and agent traffic arrives
 * from datacentres. The dangerous failure is not the miss — it is the stale
 * mapping, which returns a confident and wrong company name.
 *
 * So its output is labelled 'ip' in `deck_events.attribution` and ranks below
 * every other source. It is the answer of last resort, for anonymous traffic on
 * the public buyer deck where there is nothing better. For the gated decks a
 * link was minted against a real row, and that is exact — do not let this
 * overwrite it.
 *
 * ── WHAT IT NEVER DOES ──
 *
 * It never returns the address, never stores it, and never logs it. The address
 * exists as a local inside one function and leaves as an organisation name.
 * That is the same bargain 014 struck for geography — Vercel resolves at the
 * edge, the city is kept, the address is discarded — and it is the reason
 * `deck_events` still has no IP column after three migrations that touched it.
 */

export interface ResolvedOrg {
  name: string;
  domain: string | null;
  asn: string | null;
}

/** On only when explicitly switched on AND credentialed. Both, deliberately. */
export function orgLookupEnabled(): boolean {
  return process.env.IP_ORG_LOOKUP === "on" && Boolean(process.env.IPINFO_TOKEN);
}

/**
 * The client address, from the proxy headers Vercel sets.
 *
 * Private and local ranges are dropped rather than sent: they resolve to
 * nothing, and a development machine should not be making billed calls to a
 * vendor because somebody loaded a deck on localhost.
 */
function clientAddress(): string | null {
  const h = headers();
  // x-forwarded-for is a chain; the client is the first entry. Taking the last
  // would return our own proxy, which resolves to Vercel on every single row.
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip")?.trim() || null;
  if (!ip) return null;

  if (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return null;
  }
  return ip;
}

/*
  A small in-process cache.

  One person reading a thirteen-slide deck generates a view and several
  progress rows, and resolving the same address for each is a bill and a
  latency spike for an answer that cannot have changed. Bounded and keyed on
  the address, which means the address lives in memory for the life of the
  process — acceptable because it is never written down, and the alternative
  is calling a vendor five times per reader.

  Cleared wholesale rather than per-entry: precision here is not worth a
  timestamp per key, and the process is short-lived on serverless anyway.
*/
const cache = new Map<string, { org: ResolvedOrg | null; at: number }>();
const TTL = 6 * 3600 * 1000;
const MAX = 500;

/**
 * IPinfo's shape. Kept behind this function so swapping vendors is one edit —
 * the field names below are the only thing in the codebase that knows which
 * vendor is in use.
 *
 * `type` is the load-bearing field. Without it every Comcast subscriber
 * resolves to "Comcast Cable Communications" and the admin page fills with
 * ISPs presented as employers, which looks like data and is noise. Only
 * business and education are accepted; isp and hosting are dropped.
 */
async function askVendor(ip: string): Promise<ResolvedOrg | null> {
  const token = process.env.IPINFO_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(token)}`,
    {
      // A deck must render whether or not a vendor is having a bad afternoon.
      signal: AbortSignal.timeout(1500),
      headers: { accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;

  const j = (await res.json()) as {
    company?: { name?: string; domain?: string; type?: string };
    asn?: { asn?: string; name?: string; type?: string };
    org?: string;
    bogon?: boolean;
  };
  if (j.bogon) return null;

  const type = j.company?.type ?? j.asn?.type ?? null;
  if (type && type !== "business" && type !== "education") return null;

  const name = j.company?.name ?? j.asn?.name ?? null;
  // `org` on the free tier is "AS15169 Google LLC" — no type field comes with
  // it, so it cannot be filtered to businesses and is not trusted here. An
  // unfiltered fallback is how the ISP names get in.
  if (!name) return null;

  return {
    name: name.slice(0, 160),
    domain: j.company?.domain?.toLowerCase().slice(0, 160) ?? null,
    asn: j.asn?.asn?.slice(0, 20) ?? null,
  };
}

/**
 * Resolve the current request to an organisation, or null.
 *
 * Never throws. A vendor outage, a timeout, a malformed response and a
 * genuinely unresolvable address are all the same answer to the caller —
 * "no attribution" — because there is nothing useful any of them could do
 * differently, and an analytics dependency must not be able to break a deck.
 */
export async function resolveOrg(): Promise<ResolvedOrg | null> {
  if (!orgLookupEnabled()) return null;

  try {
    const ip = clientAddress();
    if (!ip) return null;

    const hit = cache.get(ip);
    if (hit && Date.now() - hit.at < TTL) return hit.org;

    const org = await askVendor(ip);

    if (cache.size >= MAX) cache.clear();
    cache.set(ip, { org, at: Date.now() });

    return org;
  } catch {
    return null;
  }
}
