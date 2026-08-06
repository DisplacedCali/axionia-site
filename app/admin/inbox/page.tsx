import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Section } from "@/components/ui";
import LeadRow from "@/components/admin/LeadRow";

export const dynamic = "force-dynamic";

/**
 * Everything waiting on a person.
 *
 * The gap this closes: a contact-form or founders-deck submission wrote a
 * `leads` row and NO screen in the product ever displayed it. Combined with an
 * admin notification email that silently no-ops while RESEND_API_KEY is unset,
 * a real inquiry from a real person had no path to a human at all.
 *
 * Leads first, because that's the part that was invisible. Requests are
 * summarised with a link rather than duplicated — the queue is already a good
 * screen and two places to work the same list is how they drift.
 */

const INTEREST_LABEL: Record<string, string> = {
  general: "General",
  "founding-member": "Founding membership",
  "on-prem": "On-prem",
  "third-party-research": "Third-party research",
  "performance-pricing": "Performance pricing",
  "research-agent": "Research agent",
  "scenario-modeling": "Scenario modeling",
  "workforce-strategy": "Workforce strategy",
  "benefit-design": "Benefit design",
  "buyer-deck": "Opened the buyer deck",
  "founders-deck": "Opened the founders deck",
};

function since(ts: string) {
  const h = (Date.now() - new Date(ts).getTime()) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 48) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function Inbox({
  searchParams,
}: {
  searchParams: { show?: string };
}) {
  await requireStaff();
  const admin = createAdminClient();
  const showAll = searchParams.show === "all";

  let q = admin
    .from("leads")
    .select("id, created_at, full_name, email, company_name, interest, message, handled_at, handled_note")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showAll) q = q.is("handled_at", null);

  const [{ data: leads }, { data: requests }] = await Promise.all([
    q,
    admin
      .from("report_requests")
      .select("id, contact_name, contact_email, company_name, status, created_at, assigned_to")
      .in("status", ["new", "in_review", "ready"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rows = leads ?? [];
  const open = (requests ?? []).filter((r) => r.status === "new" || !r.assigned_to);

  return (
    <Section className="pt-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
            Inbox
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl mt-2">
            Waiting on you
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/inbox"
            className={`px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.12em] ${
              !showAll ? "border-navy bg-navy text-base" : "border-border text-gray-warm hover:border-navy"
            }`}
          >
            Open
          </Link>
          <Link
            href="/admin/inbox?show=all"
            className={`px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.12em] ${
              showAll ? "border-navy bg-navy text-base" : "border-border text-gray-warm hover:border-navy"
            }`}
          >
            All
          </Link>
        </div>
      </div>

      {/* ── Requests, summarised ── */}
      {open.length > 0 && (
        <div className="mb-10 border border-border bg-base-2 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-1">
                Report requests
              </p>
              <p className="text-[15px] text-navy">
                {open.length} new or unclaimed
              </p>
            </div>
            <Link
              href="/admin"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline shrink-0"
            >
              Work the queue →
            </Link>
          </div>
        </div>
      )}

      {/* ── Leads ── */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
        Inquiries {rows.length > 0 && `· ${rows.length}`}
      </h2>

      {rows.length === 0 ? (
        <div className="border border-border p-10">
          <p className="font-serif text-2xl mb-2">
            {showAll ? "No inquiries yet." : "Nothing outstanding."}
          </p>
          <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
            {showAll
              ? "Contact-form submissions and founders-deck prints land here."
              : "Every inquiry has been dealt with. Switch to All to see the history."}
          </p>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {rows.map((l) => (
            <LeadRow
              key={l.id}
              lead={{
                id: l.id,
                name: l.full_name,
                email: l.email,
                company: l.company_name,
                interest: INTEREST_LABEL[l.interest] ?? l.interest,
                message: l.message,
                handledAt: l.handled_at,
                handledNote: l.handled_note,
                when: since(l.created_at),
              }}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
