import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";
import { STAGE_TONE } from "@/lib/crm";

export const dynamic = "force-dynamic";

/** A follow-up dated today is due, not late. */
const isOverdue = (d: string) => new Date(d) < new Date(new Date().toDateString());

export default async function AdminCompanies() {
  await requireStaff();
  const admin = createAdminClient();

  const { data: companies } = await admin
    .from("companies")
    .select("id, domain, name, created_at, stage, next_action, next_action_at")
    .order("created_at", { ascending: false });

  const list = companies ?? [];

  // counts per company, fetched in bulk rather than per row
  const [{ data: reports }, { data: requests }, { data: people }, { data: files }] =
    await Promise.all([
      admin.from("reports").select("company_id, status"),
      admin.from("report_requests").select("company_id, status"),
      admin.from("profiles").select("company_id"),
      admin.from("report_files").select("company_id"),
    ]);

  const tally = (rows: { company_id: string | null }[] | null) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      if (r.company_id) acc[r.company_id] = (acc[r.company_id] ?? 0) + 1;
      return acc;
    }, {});

  const releasedByCompany = (reports ?? [])
    .filter((r) => r.status === "ready")
    .reduce<Record<string, number>>((acc, r) => {
      if (r.company_id) acc[r.company_id] = (acc[r.company_id] ?? 0) + 1;
      return acc;
    }, {});

  const openByCompany = (requests ?? [])
    .filter((r) => r.status !== "sent" && r.status !== "archived")
    .reduce<Record<string, number>>((acc, r) => {
      if (r.company_id) acc[r.company_id] = (acc[r.company_id] ?? 0) + 1;
      return acc;
    }, {});

  const peopleByCompany = tally(people);
  const filesByCompany = tally(files);

  return (
    <Section className="pt-12 pb-24">
      <div className="mb-10">
        <h1 className="font-serif font-light text-4xl">Companies</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
          {list.length} tracked · grouped by email domain
        </p>
      </div>

      {list.length === 0 ? (
        <div className="border border-border p-12 text-center">
          <p className="font-serif text-2xl text-gray-warm">No companies yet.</p>
          <p className="mt-2 text-[14px] text-gray-cool">
            A company is created the first time someone requests a report from a
            corporate email domain.
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <div className="hidden md:grid grid-cols-[1.5fr_0.9fr_0.8fr_1.1fr_0.6fr_0.6fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            <span>Company</span>
            <span>Domain</span>
            <span>Stage</span>
            <span>Next action</span>
            <span className="text-right">Released</span>
            <span className="text-right">Open</span>
          </div>

          {list.map((c) => {
            const open = openByCompany[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className="grid md:grid-cols-[1.5fr_0.9fr_0.8fr_1.1fr_0.6fr_0.6fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
              >
                <span className="text-[15px] text-navy self-center">
                  {c.name || "—"}
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool mt-0.5">
                    {peopleByCompany[c.id] ?? 0} contacts ·{" "}
                    {filesByCompany[c.id] ?? 0} files
                  </span>
                </span>
                <span className="font-mono text-[12px] text-gray-warm self-center truncate">
                  {c.domain}
                </span>
                <span className="self-center">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border ${
                      STAGE_TONE[c.stage ?? "lead"] ?? STAGE_TONE.lead
                    }`}
                  >
                    {c.stage ?? "lead"}
                  </span>
                </span>
                <span className="self-center text-[13px] text-gray-warm truncate">
                  {c.next_action || <span className="text-gray-cool">—</span>}
                  {c.next_action_at && (
                    <span
                      className={`block font-mono text-[9px] uppercase tracking-[0.1em] mt-0.5 ${
                        isOverdue(c.next_action_at) ? "text-risk" : "text-gray-cool"
                      }`}
                    >
                      {isOverdue(c.next_action_at) ? "Overdue · " : "Due "}
                      {new Date(c.next_action_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[13px] text-navy md:text-right self-center tabular-nums">
                  {releasedByCompany[c.id] ?? 0}
                </span>
                <span className="md:text-right self-center">
                  {open > 0 ? (
                    <span className="font-mono text-[11px] text-caution">{open}</span>
                  ) : (
                    <span className="font-mono text-[11px] text-gray-cool">—</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
