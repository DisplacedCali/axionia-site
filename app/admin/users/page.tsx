import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";
import UserRow from "@/components/admin/UserRow";
import ReviewSweep from "@/components/admin/ReviewSweep";
import { assessAccount } from "@/lib/accountReview";

export const dynamic = "force-dynamic";

/**
 * Three views, because the list has three populations now.
 *
 * `people` is the default and hides everything marked spam — the working list,
 * scannable again. `review` holds accounts the heuristic suspects but nobody
 * has judged, with a bulk action. `hidden` is what was swept, always one click
 * from coming back, because nothing is deleted.
 */
export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  // Staff can read the user list; only the owner can change a role. Gating the
  // whole page on owner would hide company assignment from analysts, which
  // they legitimately need.
  const { user: currentUser, profile } = await requireStaff();
  const canEditRoles = profile.role === "owner";
  const canReview = ["admin", "owner"].includes(profile.role);
  const view = searchParams.view === "review" || searchParams.view === "hidden"
    ? searchParams.view
    : "people";
  const admin = createAdminClient();

  const [{ data: profiles }, { data: companies }, { data: requestRows }, authList] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, company_name, role, company_id, created_at, review_state")
        .order("created_at", { ascending: false }),
      admin.from("companies").select("id, domain, name").order("domain"),
      admin.from("report_requests").select("user_id"),
      // Verification lives on auth.users, not profiles, and it's the strongest
      // signal available — an account that never confirmed is an account
      // nobody wanted, often including the person whose address was used.
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }).catch(() => null),
    ]);

  const confirmed = new Map<string, string | null>(
    (authList?.data?.users ?? []).map((u) => [u.id, u.email_confirmed_at ?? null]),
  );
  const requestCounts = new Map<string, number>();
  for (const r of requestRows ?? []) {
    if (r.user_id) requestCounts.set(r.user_id, (requestCounts.get(r.user_id) ?? 0) + 1);
  }

  const all = profiles ?? [];
  const assessed = all.map((p) => ({
    p,
    review: (p.review_state ?? "unreviewed") as string,
    suspicion: assessAccount({
      fullName: p.full_name,
      companyName: p.company_name,
      email: p.email,
      emailConfirmedAt: confirmed.get(p.id) ?? null,
      createdAt: p.created_at,
      hasCompany: Boolean(p.company_id),
      requestCount: requestCounts.get(p.id) ?? 0,
    }),
  }));

  // Staff are never swept and never suspected, whatever the heuristic says.
  const isStaffRow = (r: string) => ["analyst", "admin", "owner"].includes(r);

  const suspected = assessed.filter(
    (a) =>
      a.review === "unreviewed" && a.suspicion.suspect && !isStaffRow(a.p.role),
  );
  const hidden = assessed.filter((a) => a.review === "spam");
  const people = assessed.filter((a) => a.review !== "spam");

  const shown =
    view === "review" ? suspected : view === "hidden" ? hidden : people;

  const rows = shown.map((a) => a.p);
  const staffCount = all.filter((r) => isStaffRow(r.role)).length;

  const tabs = [
    { id: "people", label: "People", n: people.length },
    { id: "review", label: "Needs review", n: suspected.length },
    { id: "hidden", label: "Hidden", n: hidden.length },
  ];

  return (
    <Section className="pt-12 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif font-light text-4xl">Users</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {people.length} people · {staffCount} staff
            {hidden.length > 0 ? ` · ${hidden.length} hidden` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.id === "people" ? "/admin/users" : `/admin/users?view=${t.id}`}
              className={`px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5 ${
                view === t.id
                  ? "border-navy bg-navy text-base"
                  : "border-border text-gray-warm hover:border-navy"
              }`}
            >
              {t.label}
              {t.n > 0 && (
                <span className={view === t.id ? "opacity-70" : "text-gray-cool"}>
                  {t.n}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {view === "review" && (
        <ReviewSweep
          count={suspected.length}
          userIds={suspected.map((a) => a.p.id)}
          canReview={canReview}
        />
      )}

      <div className="border border-border">
        <div className="hidden md:grid grid-cols-[1.5fr_1.3fr_1.2fr_0.8fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          <span>User</span>
          <span>Company</span>
          <span>Assigned company</span>
          <span className="text-right">Role</span>
        </div>

        {shown.map(({ p, review, suspicion }) => (
          <UserRow
            key={p.id}
            profile={{
              id: p.id,
              email: p.email,
              fullName: p.full_name,
              companyName: p.company_name,
              role: p.role,
              companyId: p.company_id,
              reviewState: review,
              reasons: suspicion.reasons,
            }}
            companies={(companies ?? []).map((c) => ({
              id: c.id,
              label: c.name ? `${c.name} (${c.domain})` : c.domain,
            }))}
            isSelf={p.id === currentUser.id}
            canEditRoles={canEditRoles}
            canReview={canReview}
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
