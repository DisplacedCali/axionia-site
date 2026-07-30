import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * First-party analytics.
 *
 * The design constraint that shapes everything here: no IP address is ever
 * stored. Location comes from Vercel's edge headers, which are already resolved
 * to country/region/city by the time the request reaches us — so we can answer
 * "where are they" without keeping the thing that identifies them.
 *
 * Identity works by stitching rather than matching. An anonymous visitor gets
 * an opaque session id in a first-party cookie. When they later submit a form
 * we know who they are, and `identifySession` walks BACKWARDS through that
 * session's earlier rows and stamps them. So the six pages they read before
 * requesting a report become attributable retroactively, which is the thing
 * IP matching is usually reached for and rarely delivers.
 *
 * Clearing cookies genuinely resets it. That's the honest behaviour and the
 * reason this isn't a fingerprint.
 */

export const SESSION_COOKIE = "ax_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export type SiteEvent =
  | "view"
  | "intake_start"
  | "intake_submit"
  | "scorer_request"
  | "contact_submit"
  | "signup";

/** Reads the session id, minting one if this is a first visit. */
export function getSessionId(): string {
  const jar = cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;

  const id = randomUUID();
  // Lax rather than Strict: a visitor arriving from a link in an email should
  // keep the same session, which is exactly the attribution case that matters.
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}

/** Coarse geography from the edge. Never the address it came from. */
function geo() {
  const h = headers();
  const dec = (v: string | null) => {
    if (!v) return null;
    // Vercel percent-encodes city names with non-ASCII characters.
    try {
      return decodeURIComponent(v).slice(0, 80);
    } catch {
      return v.slice(0, 80);
    }
  };
  return {
    country: dec(h.get("x-vercel-ip-country")),
    region: dec(h.get("x-vercel-ip-country-region")),
    city: dec(h.get("x-vercel-ip-city")),
  };
}

const trim = (v: string | null | undefined, n: number) =>
  v ? v.slice(0, n) : null;

/**
 * Records one event. Best-effort by design — analytics must never be able to
 * break a page load, so every failure path here is swallowed.
 */
export async function track(args: {
  event: SiteEvent;
  path: string;
  referrer?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
  userId?: string | null;
  companyId?: string | null;
}) {
  try {
    const sessionId = getSessionId();
    const { country, region, city } = geo();
    const h = headers();

    await createAdminClient()
      .from("site_events")
      .insert({
        session_id: sessionId,
        event: args.event,
        path: trim(args.path, 300) ?? "/",
        referrer: trim(args.referrer, 400),
        utm_source: trim(args.utm?.source, 80),
        utm_medium: trim(args.utm?.medium, 80),
        utm_campaign: trim(args.utm?.campaign, 120),
        country,
        region,
        city,
        user_id: args.userId ?? null,
        company_id: args.companyId ?? null,
        user_agent: trim(h.get("user-agent"), 400),
      });
  } catch {
    /* swallowed on purpose */
  }
}

/**
 * The stitch. Call this the moment a session stops being anonymous — form
 * submit, signup, login.
 *
 * Backfills the whole session rather than only rows from here on. The pages
 * someone read BEFORE they identified themselves are the interesting ones:
 * what they read on the way to converting is the question this table exists to
 * answer, and it's unanswerable if identity only applies going forward.
 */
export async function identifySession(args: {
  userId?: string | null;
  companyId?: string | null;
}) {
  if (!args.userId && !args.companyId) return;

  try {
    const sessionId = cookies().get(SESSION_COOKIE)?.value;
    if (!sessionId) return;

    const patch: Record<string, string> = {};
    if (args.userId) patch.user_id = args.userId;
    if (args.companyId) patch.company_id = args.companyId;

    await createAdminClient()
      .from("site_events")
      .update(patch)
      .eq("session_id", sessionId)
      // Don't clobber an identity already resolved for this session — a shared
      // machine would otherwise rewrite the previous person's history.
      .is(args.userId ? "user_id" : "company_id", null);
  } catch {
    /* swallowed on purpose */
  }
}
