import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Role gates for /admin.
 *
 * Middleware blocks anonymous users, but role is checked here — middleware
 * runs on the edge without a DB round trip, so it can't be trusted for
 * authorization on its own.
 *
 * The boundary that matters is RELEASE. Everything upstream of it is
 * recoverable: a research run can be re-run, an edit lives in the reversible
 * overlay, a status can be set back. Release leaves the building and emails
 * the client. So the gates are:
 *
 *   analyst  → run research, edit reports, work the queue
 *   admin    → all of the above, plus release
 *   owner    → all of the above, plus assign roles
 *
 * Every server action that mutates must call one of these itself. A page-level
 * gate protects the page, not the action — server actions are independently
 * addressable POST endpoints and are only as safe as their own first line.
 */

export type Role = "client" | "analyst" | "admin" | "owner";

export const STAFF_ROLES: Role[] = ["analyst", "admin", "owner"];
export const RELEASE_ROLES: Role[] = ["admin", "owner"];

export type StaffProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

async function loadProfile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  return { user, profile: (data ?? null) as StaffProfile | null };
}

/** Any staff role. The gate for reading the admin at all. */
export async function requireStaff() {
  const { user, profile } = await loadProfile();
  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect("/dashboard");
  return { user, profile };
}

/**
 * Releasing a report, or anything else that reaches the client.
 *
 * Sends an analyst back to the admin rather than to /dashboard — they belong
 * here, they just can't do this particular thing, and bouncing them out of the
 * tool entirely reads as a bug.
 */
export async function requireRelease() {
  const { user, profile } = await loadProfile();
  if (!profile) redirect("/dashboard");
  if (!RELEASE_ROLES.includes(profile.role)) redirect("/admin?denied=release");
  return { user, profile };
}

/** Role assignment. Owner only — otherwise any admin can promote themselves. */
export async function requireOwner() {
  const { user, profile } = await loadProfile();
  if (!profile) redirect("/dashboard");
  if (profile.role !== "owner") redirect("/admin?denied=owner");
  return { user, profile };
}

/**
 * Pre-011 name, kept so existing call sites keep compiling. It is a STAFF
 * gate, not a release gate — anything that reaches the client must call
 * requireRelease() explicitly rather than relying on this.
 *
 * @deprecated Use requireStaff, requireRelease or requireOwner.
 */
export const requireAdmin = requireStaff;
