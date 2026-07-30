import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * Page-view sink.
 *
 * A route handler rather than a server action because it's called on every
 * navigation: actions are POSTs into the React tree and carry re-render
 * machinery this doesn't need. It also has to set the session cookie, which
 * needs a real response.
 *
 * Always returns 204, including on failure. A visitor's browser has nothing
 * useful to do with an analytics error, and a noisy console on a marketing
 * site looks like a broken product.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path : "/";

    // Bots and prefetches would otherwise inflate every number on the
    // dashboard. Next sends purpose: prefetch on <Link> prefetches.
    const purpose = req.headers.get("purpose") ?? req.headers.get("x-purpose");
    if (purpose === "prefetch") return new NextResponse(null, { status: 204 });

    // Identify if there's already a session. Doesn't create one.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let companyId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();
      companyId = profile?.company_id ?? null;
    }

    await track({
      event: "view",
      path,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      utm: {
        source: typeof body.utm_source === "string" ? body.utm_source : null,
        medium: typeof body.utm_medium === "string" ? body.utm_medium : null,
        campaign: typeof body.utm_campaign === "string" ? body.utm_campaign : null,
      },
      userId: user?.id ?? null,
      companyId,
    });
  } catch {
    /* swallowed — see above */
  }

  return new NextResponse(null, { status: 204 });
}
