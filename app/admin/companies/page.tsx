import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminCompanies() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: companies } = await admin
    .from("companies")
    .select("id, domain, name, created_at")
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
          <div className="hidden md:grid grid-cols-[1.6fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            <span>Company</span>
            <span>Domain</span>
            <span className="text-right">Contacts</span>
            <span className="text-right">Released</span>
            <span className="text-right">Files</span>
            <span className="text-right">Open</span>
          </div>

          {list.map((c) => {
            const open = openByCompany[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/admin?status=all`}
                className="grid md:grid-cols-[1.6fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
              >
                <span className="text-[15px] text-navy">{c.name || "—"}</span>
                <span className="font-mono text-[12px] text-gray-warm self-center">
                  {c.domain}
                </span>
                <span className="font-mono text-[13px] text-navy md:text-right self-center tabular-nums">
                  {peopleByCompany[c.id] ?? 0}
                </span>
                <span className="font-mono text-[13px] text-navy md:text-right self-center tabular-nums">
                  {releasedByCompany[c.id] ?? 0}
                </span>
                <span className="font-mono text-[13px] text-navy md:text-right self-center tabular-nums">
                  {filesByCompany[c.id] ?? 0}
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
