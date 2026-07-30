import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin gate for route handlers.
 *
 * Separate from requireAdmin() in lib/auth.ts on purpose: that one calls
 * redirect(), which throws NEXT_REDIRECT. In a fetch-driven API route that
 * surfaces to the caller as an opaque 500 rather than a 401/403, so the client
 * can't tell "sign in again" from "something broke".
 *
 * Returns either the caller's identity or a JSON response to return directly.
 */
export async function requireAdminJson(): Promise<
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse }
> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not signed in." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin only." }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, email: profile.email ?? user.email ?? null };
}
