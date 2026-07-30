import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES, type Role } from "@/lib/auth";

/**
 * Staff gate for route handlers.
 *
 * Separate from requireStaff() in lib/auth.ts on purpose: that one calls
 * redirect(), which throws NEXT_REDIRECT. In a fetch-driven API route that
 * surfaces to the caller as an opaque 500 rather than a 401/403, so the client
 * can't tell "sign in again" from "something broke".
 *
 * Checks membership in STAFF_ROLES rather than equality with 'admin'. The
 * equality check was correct until migration 011 introduced 'owner' and
 * promoted every existing admin to it — at which point the only operator on
 * the system would have started getting 403 from every research route while
 * the admin UI kept loading fine.
 *
 * Returns either the caller's identity or a JSON response to return directly.
 */
export async function requireAdminJson(): Promise<
  | { ok: true; userId: string; email: string | null; role: Role }
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

  const role = profile?.role as Role | undefined;

  if (!role || !STAFF_ROLES.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Staff only." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
    email: profile?.email ?? user.email ?? null,
    role,
  };
}
