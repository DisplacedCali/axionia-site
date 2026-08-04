import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";
import AssignControl from "@/components/admin/AssignControl";
import ArchiveControl from "@/components/admin/ArchiveControl";

export const dynamic = "force-dynamic";

/**
 * Three states you set — New, In review, Archived — and two the system sets.
 *
 * `sent` reads as "Released" because that's what the action is called and what
 * it means: the report left the building and now lives on the company. `ready`
 * is legacy and no longer settable; it meant "ready to be released" and sat
 * next to a Release button, which is exactly the ambiguity that made
 * graduating a file unintuitive. Kept here so old rows still render.
 */
const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  new: { dot: "bg-blue", text: "text-blue", label: "New" },
  in_review: { dot: "bg-caution", text: "text-caution", label: "In review" },
  ready: { dot: "bg-teal", text: "text-teal", label: "Ready to send" },
  sent: { dot: "bg-pos", text: "text-pos", label: "Released" },
  archived: { dot: "bg-gray-cool", text: "text-gray-warm", label: "Archived" },
};

function since(ts: string) {
  const hours = (Date.now() - new Date(ts).getTime()) / 36e5;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Past the 24-hour promise and not yet sent. */
function isOverdue(r: { created_at: string; status: string }) {
  return (
    r.status !== "sent" &&
    r.status !== "archived" &&
    Date.now() - new Date(r.created_at).getTime() > 24 * 36e5
  );
}

const isOpen = (r: { status: string }) =>
  r.status !== "sent" && r.status !== "archived";

export default async function AdminQueue({
  searchParams,
}: {
  searchParams: { status?: string; view?: string; denied?: string };
}) {
  const { user, profile } = await requireStaff();
  const admin = createAdminClient();

  const filter = searchParams.status;
  const view = searchParams.view ?? "open";

  let query = admin
    .from("report_requests")
    .select(
      "id, contact_name, contact_email, company_name, kind, status, created_at, company_id, alignment, origin, assigned_to"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter && filter !== "all") query = query.eq("status", filter);

  const { data: requests } = await query;
  let rows = requests ?? [];

  /*
    View and status are separate axes on purpose. Status is where a request is
    in the workflow; view is whose problem it is. Collapsing them into one
    filter strip made "unassigned and new" — the thing you actually open this
    page to find — unreachable.
  */
  /*
    Asking for a terminal status overrides the open view.

    Otherwise selecting Released or Archived while the default view is "open"
    returns nothing — the view filter strips exactly the rows the status filter
    just asked for, and the strip looks broken rather than empty. An explicit
    status is a more specific request than an inherited default, so it wins.
  */
  const terminalFilter = filter === "sent" || filter === "archived";

  if (view === "unassigned") rows = rows.filter((r) => !r.assigned_to && isOpen(r));
  else if (view === "mine") rows = rows.filter((r) => r.assigned_to === user.id);
  else if (view === "open" && !terminalFilter) rows = rows.filter(isOpen);

  const { data: allForCounts } = await admin
    .from("report_requests")
    .select("status, assigned_to");

  const all = allForCounts ?? [];
  const counts = all.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const openCount = all.filter(isOpen).length;
  const unassignedCount = all.filter((r) => !r.assigned_to && isOpen(r)).length;
  const mineCount = all.filter((r) => r.assigned_to === user.id).length;
  const overdueCount = rows.filter(isOverdue).length;

  // Staff list for the assignment dropdown.
  const { data: staff } = await admin
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", ["analyst", "admin", "owner"])
    .order("email");

  const staffOptions = (staff ?? []).map((s) => ({
    id: s.id,
    label: s.full_name || s.email,
  }));

  const views = [
    { id: "open", label: "Open", n: openCount },
    { id: "unassigned", label: "Unassigned", n: unassignedCount },
    { id: "mine", label: "Mine", n: mineCount },
    { id: "all", label: "All", n: all.length },
  ];

  /*
    Released and Archived are both out of the default open view but findable
    here — archiving is now a one-click row action, so a row you archive by
    mistake has to be reachable without knowing the URL.

    'Ready' only appears while legacy rows still hold it. A filter that always
    returns nothing is a filter that teaches you to ignore the strip.
  */
  const filters = [
    { id: "all", label: "Any status", n: all.length },
    { id: "new", label: "New", n: counts.new ?? 0 },
    { id: "in_review", label: "In review", n: counts.in_review ?? 0 },
    ...(counts.ready ? [{ id: "ready", label: "Ready", n: counts.ready }] : []),
    { id: "sent", label: "Released", n: counts.sent ?? 0 },
    { id: "archived", label: "Archived", n: counts.archived ?? 0 },
  ];

  const qs = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { view, status: filter, ...next };
    if (merged.view && merged.view !== "open") p.set("view", merged.view);
    if (merged.status && merged.status !== "all") p.set("status", merged.status);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <Section className="pt-12 pb-24">
      {searchParams.denied && (
        <div className="mb-8 border-l-2 border-caution bg-amber-light px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
            Not permitted
          </p>
          <p className="mt-1.5 text-[14px] text-gray-warm">
            {searchParams.denied === "release"
              ? "Releasing a report requires the admin or owner role. Everything up to release is available to you."
              : "Role assignment is restricted to the owner."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="font-serif font-light text-4xl">Report queue</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {openCount} open · {unassignedCount} unclaimed ·{" "}
            {overdueCount > 0 ? (
              <span className="text-risk">{overdueCount} past 24h</span>
            ) : (
              "all within 24h"
            )}
          </p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-cool border border-border px-2.5 py-1.5">
          {profile.role}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {views.map((v) => {
          const active = view === v.id;
          return (
            <Link
              key={v.id}
              href={qs({ view: v.id })}
              className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                active
                  ? "border-navy bg-navy text-base"
                  : "border-border text-gray-warm hover:border-navy"
              }`}
            >
              {v.label} <span className="opacity-60">{v.n}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {filters.map((f) => {
          const active = (filter ?? "all") === f.id;
          return (
            <Link
              key={f.id}
              href={qs({ status: f.id })}
              className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] border transition-colors ${
                active
                  ? "border-blue text-blue"
                  : "border-border text-gray-cool hover:border-navy hover:text-gray-warm"
              }`}
            >
              {f.label} <span className="opacity-60">{f.n}</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="border border-border p-12 text-center">
          <p className="font-serif text-2xl text-gray-warm">Nothing here yet.</p>
          <p className="mt-2 text-[14px] text-gray-cool">
            Requests submitted from the site land in this queue.
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_0.6fr_0.85fr_0.9fr_0.6fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            <span>Contact</span>
            <span>Company</span>
            <span>Type</span>
            <span>Status</span>
            <span>Owner</span>
            <span className="text-right">Age</span>
          </div>

          {rows.map((r) => {
            const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.new;
            const overdue = isOverdue(r);
            return (
              /*
                The row is a div with a stretched link rather than a <Link>
                wrapper: the assignment control is interactive and can't be
                nested inside an anchor without the click being swallowed.
              */
              <div
                key={r.id}
                className="relative grid md:grid-cols-[1.3fr_1.3fr_0.6fr_0.85fr_0.9fr_0.6fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
              >
                <Link
                  href={`/admin/requests/${r.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Open request from ${r.contact_name || r.company_name || r.contact_email}`}
                />
                <span className="relative z-10 pointer-events-none">
                  {r.origin === "admin" ? (
                    <>
                      <span className="block text-[15px] text-navy">
                        Internal research
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-blue mt-0.5">
                        Admin-initiated · no requester
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-[15px] text-navy">
                        {r.contact_name || "—"}
                      </span>
                      <span className="block text-[12px] text-gray-cool">
                        {r.contact_email}
                      </span>
                    </>
                  )}
                </span>
                <span className="relative z-10 pointer-events-none text-[14px] text-gray-warm self-center">
                  {r.company_name || "—"}
                  {r.alignment === "review" && (
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-caution">
                      ⚑ Classify — likely third-party
                    </span>
                  )}
                  {r.alignment === "third_party" && (
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-blue">
                      Paid research
                    </span>
                  )}
                  {r.alignment === "restricted" && (
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-risk">
                      Declined
                    </span>
                  )}
                </span>
                <span className="relative z-10 pointer-events-none self-center">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border ${
                      r.kind === "refresh"
                        ? "border-caution/40 text-caution bg-amber-light"
                        : "border-border text-gray-warm"
                    }`}
                  >
                    {r.kind}
                  </span>
                </span>
                <span className="relative z-10 pointer-events-none self-center flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] ${s.text}`}
                  >
                    {s.label}
                  </span>
                </span>
                <span className="relative z-10 self-center">
                  <AssignControl
                    requestId={r.id}
                    assignedTo={r.assigned_to}
                    currentUserId={user.id}
                    staff={staffOptions}
                  />
                </span>
                <span className="relative z-10 self-center md:text-right flex md:justify-end items-center gap-3">
                  <span
                    className={`pointer-events-none font-mono text-[11px] ${
                      overdue ? "text-risk" : "text-gray-cool"
                    }`}
                  >
                    {since(r.created_at)}
                  </span>
                  <ArchiveControl requestId={r.id} status={r.status} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
