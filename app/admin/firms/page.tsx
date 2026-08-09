import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Firms and their portfolios.
 *
 * Migration 024 gave firms a shape and nothing gave them a surface, so a
 * `firm_id` was write-only: set at research time and then invisible. This is
 * the read side.
 *
 * Deliberately a list rather than a dashboard. The question it answers is
 * "which companies do I have under Valtruis, and where has each one got to" —
 * everything else about an account already lives on the company hub, and
 * duplicating it here would mean two places to keep correct.
 */

const STAGE_TONE: Record<string, string> = {
  lead: "text-gray-cool",
  engaged: "text-blue",
  analysis: "text-blue",
  proposal: "text-caution",
  client: "text-pos",
  dormant: "text-gray-cool",
  declined: "text-gray-cool",
};

export default async function Firms() {
  await requireStaff();
  const admin = createAdminClient();

  const [{ data: firms }, { data: companies }] = await Promise.all([
    admin.from("firms").select("id, name, kind, domain, notes").order("name"),
    // Aliases excluded: 024 forbids a merged row carrying a firm, so anything
    // with merged_into set is a pointer rather than a portfolio company.
    admin
      .from("companies")
      .select("id, name, domain, firm_id, stage")
      .not("firm_id", "is", null)
      .is("merged_into", null)
      .order("name"),
  ]);

  const byFirm = new Map<string, NonNullable<typeof companies>>();
  for (const c of companies ?? []) {
    const list = byFirm.get(c.firm_id!) ?? [];
    list.push(c);
    byFirm.set(c.firm_id!, list);
  }

  const rows = firms ?? [];

  return (
    <Section className="pt-12 pb-24">
      <Link
        href="/admin"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
      >
        ← Queue
      </Link>

      <div className="mt-4 mb-10 max-w-2xl">
        <h1 className="font-serif font-light text-4xl">Firms</h1>
        <p className="mt-3 text-[15px] leading-[1.7] text-gray-warm">
          Investors and operators, and the companies grouped under them. A firm
          is created from{" "}
          <Link href="/admin/new" className="text-blue underline">
            Start research
          </Link>{" "}
          by typing its name — there is no separate step.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border border-border p-8 max-w-2xl">
          <p className="text-[14px] leading-[1.7] text-gray-warm">
            No firms yet. The distinction that matters when you make one:{" "}
            <strong className="text-navy">an investor</strong> influences many
            separate buyers and signs for none of them;{" "}
            <strong className="text-navy">an operator</strong> is the buyer
            across every entity it has acquired. Consolidating a benefit stack is
            only sensible advice for the second.
          </p>
        </div>
      ) : (
        <div className="border border-border">
          {rows.map((f) => {
            const cos = byFirm.get(f.id) ?? [];
            return (
              <div
                key={f.id}
                className="px-5 sm:px-6 py-5 border-b border-border last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                  <span className="font-serif text-[22px] text-navy">{f.name}</span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                      f.kind === "operator" ? "text-pos" : "text-blue"
                    }`}
                  >
                    {f.kind === "operator" ? "operator · is the buyer" : "investor"}
                  </span>
                  {f.domain && (
                    <span className="font-mono text-[11px] text-gray-cool">
                      {f.domain}
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool ml-auto">
                    {cos.length} {cos.length === 1 ? "company" : "companies"}
                  </span>
                </div>

                {cos.length === 0 ? (
                  <p className="text-[13px] text-gray-cool">
                    Nothing grouped under this yet.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {cos.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/companies/${c.id}`}
                        className="flex items-baseline justify-between gap-3 py-1 group"
                      >
                        <span className="text-[14px] text-navy group-hover:underline truncate">
                          {c.name || c.domain}
                        </span>
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.1em] shrink-0 ${
                            STAGE_TONE[c.stage ?? "lead"] ?? "text-gray-cool"
                          }`}
                        >
                          {c.stage ?? "lead"}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {f.notes && (
                  <p className="mt-3 text-[13px] leading-[1.65] text-gray-warm max-w-measure">
                    {f.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        A portfolio-level analysis — the same vendor across several companies at
        several prices — needs completed runs on more than one of them before it
        can say anything. Until then this is a grouping, not a finding.
      </p>
    </Section>
  );
}
