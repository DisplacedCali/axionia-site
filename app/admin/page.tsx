import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  new: { dot: "bg-blue", text: "text-blue", label: "New" },
  in_review: { dot: "bg-caution", text: "text-caution", label: "In review" },
  ready: { dot: "bg-teal", text: "text-teal", label: "Ready to send" },
  sent: { dot: "bg-pos", text: "text-pos", label: "Sent" },
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

export default async function AdminQueue({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const filter = searchParams.status;

  let query = admin
    .from("report_requests")
    .select(
      "id, contact_name, contact_email, company_name, kind, status, created_at, company_id, alignment"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter && filter !== "all") query = query.eq("status", filter);

  const { data: requests } = await query;
  const rows = requests ?? [];

  const { data: allForCounts } = await admin
    .from("report_requests")
    .select("status");

  const counts = (allForCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const total = (allForCounts ?? []).length;

  const openCount = (counts.new ?? 0) + (counts.in_review ?? 0) + (counts.ready ?? 0);
  const overdueCount = rows.filter(isOverdue).length;

  const filters = [
    { id: "all", label: "All", n: total },
    { id: "new", label: "New", n: counts.new ?? 0 },
    { id: "in_review", label: "In review", n: counts.in_review ?? 0 },
    { id: "ready", label: "Ready", n: counts.ready ?? 0 },
    { id: "sent", label: "Sent", n: counts.sent ?? 0 },
  ];

  return (
    <Section className="pt-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-serif font-light text-4xl">Report queue</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {openCount} open · {overdueCount > 0 ? (
              <span className="text-risk">{overdueCount} past 24h</span>
            ) : (
              "all within 24h"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = (filter ?? "all") === f.id;
            return (
              <Link
                key={f.id}
                href={f.id === "all" ? "/admin" : `/admin?status=${f.id}`}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                  active
                    ? "border-navy bg-navy text-base"
                    : "border-border text-gray-warm hover:border-navy"
                }`}
              >
                {f.label} <span className="opacity-60">{f.n}</span>
              </Link>
            );
          })}
        </div>
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
          <div className="hidden md:grid grid-cols-[1.4fr_1.4fr_0.7fr_0.9fr_0.7fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            <span>Contact</span>
            <span>Company</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Age</span>
          </div>

          {rows.map((r) => {
            const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.new;
            const overdue = isOverdue(r);
            return (
              <Link
                key={r.id}
                href={`/admin/requests/${r.id}`}
                className="grid md:grid-cols-[1.4fr_1.4fr_0.7fr_0.9fr_0.7fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
              >
                <span>
                  <span className="block text-[15px] text-navy">
                    {r.contact_name || "—"}
                  </span>
                  <span className="block text-[12px] text-gray-cool">
                    {r.contact_email}
                  </span>
                </span>
                <span className="text-[14px] text-gray-warm self-center">
                  {r.company_name || "—"}
                  {r.alignment === "review" && (
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-caution">
                      ⚑ Verify affiliation
                    </span>
                  )}
                  {r.alignment === "restricted" && (
                    <span className="block mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-risk">
                      Restricted
                    </span>
                  )}
                </span>
                <span className="self-center">
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
                <span className="self-center flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] ${s.text}`}
                  >
                    {s.label}
                  </span>
                </span>
                <span
                  className={`self-center md:text-right font-mono text-[11px] ${
                    overdue ? "text-risk" : "text-gray-cool"
                  }`}
                >
                  {since(r.created_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
