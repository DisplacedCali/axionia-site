import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";
import UserRow from "@/components/admin/UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  // Staff can read the user list; only the owner can change a role. Gating the
  // whole page on owner would hide company assignment from analysts, which
  // they legitimately need.
  const { user: currentUser, profile } = await requireStaff();
  const canEditRoles = profile.role === "owner";
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, company_name, role, company_id, created_at")
    .order("created_at", { ascending: false });

  const { data: companies } = await admin
    .from("companies")
    .select("id, domain, name")
    .order("domain");

  const rows = profiles ?? [];
  const staffCount = rows.filter((r) =>
    ["analyst", "admin", "owner"].includes(r.role)
  ).length;

  return (
    <Section className="pt-12 pb-24">
      <div className="mb-10">
        <h1 className="font-serif font-light text-4xl">Users</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
          {rows.length} total · {staffCount} staff
        </p>
      </div>

      <div className="border border-border">
        <div className="hidden md:grid grid-cols-[1.5fr_1.3fr_1.2fr_0.8fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          <span>User</span>
          <span>Company</span>
          <span>Assigned company</span>
          <span className="text-right">Role</span>
        </div>

        {rows.map((p) => (
          <UserRow
            key={p.id}
            profile={{
              id: p.id,
              email: p.email,
              fullName: p.full_name,
              companyName: p.company_name,
              role: p.role,
              companyId: p.company_id,
            }}
            companies={(companies ?? []).map((c) => ({
              id: c.id,
              label: c.name ? `${c.name} (${c.domain})` : c.domain,
            }))}
            isSelf={p.id === currentUser.id}
            canEditRoles={canEditRoles}
          />
        ))}
      </div>

      <p className="mt-5 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Company assignment controls who shares a report. Everyone assigned to the same
        company sees that company&rsquo;s released reports — so only assign a user to a
        company you&rsquo;ve confirmed they work for.
      </p>
      <p className="mt-3 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        <strong className="font-normal text-gray-warm">Analyst</strong> runs research
        and edits reports but cannot release one.{" "}
        <strong className="font-normal text-gray-warm">Admin</strong> adds release —
        the action that emails the client.{" "}
        <strong className="font-normal text-gray-warm">Owner</strong> adds role
        assignment, and is the only role that can grant it.
        {!canEditRoles && " Roles are read-only for you."}
      </p>
    </Section>
  );
}
