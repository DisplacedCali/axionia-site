import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";
import CrmPanel from "@/components/admin/CrmPanel";
import BriefPanel from "@/components/admin/BriefPanel";
import StepsPanel, { type Step } from "@/components/admin/StepsPanel";
import ContactsPanel, {
  type Contact,
  type AccountUser,
} from "@/components/admin/ContactsPanel";
import DeckVersionsPanel, {
  type DeckVersion,
} from "@/components/admin/DeckVersionsPanel";

export const dynamic = "force-dynamic";

/**
 * The company hub.
 *
 * Everything in this product is eventually about one account — its people, its
 * open work, its report history, its files. Before this page that information
 * was spread across three list views keyed on different things, and answering
 * "what's the state of Acme" meant three scans and a memory.
 *
 * It used to say "deliberately read-only, actions live where they already
 * work". That stopped being true the moment CrmPanel landed, and the page then
 * spent a while being neither: a record with one editable box in the middle of
 * it, labelled "Pipeline", holding three unrelated questions — what stage is
 * this, who owns it, what happens next.
 *
 * The rule now: **this page owns the account, the request and report pages own
 * the work.** Anything that describes the relationship — the brief, the people,
 * the next steps, the stage — is edited here, because here is where you are
 * when you think about it. Anything that advances a piece of work still lives
 * with that work.
 *
 * Ordering follows the question you arrive with. Brief and steps first, because
 * "what is this and what do I do next" is why you opened the page. Counts and
 * history below, because they answer a question you only ask second.
 */

const REQUEST_STATUS: Record<string, { dot: string; text: string; label: string }> = {
  new: { dot: "bg-blue", text: "text-blue", label: "New" },
  in_review: { dot: "bg-caution", text: "text-caution", label: "In review" },
  ready: { dot: "bg-teal", text: "text-teal", label: "Ready to send" },
  sent: { dot: "bg-pos", text: "text-pos", label: "Sent" },
  archived: { dot: "bg-gray-cool", text: "text-gray-warm", label: "Archived" },
};

function when(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="border-t border-border pt-3">
      <div className="font-serif font-light text-3xl leading-none tabular-nums">
        {n}
      </div>
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
        {label}
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 py-6 text-[13px] text-gray-cool">{children}</p>
  );
}

export default async function CompanyHub({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select(
      "id, domain, name, notes, created_at, stage, owner_id, next_action, next_action_at"
    )
    .eq("id", params.id)
    .single();

  if (!company) notFound();

  const [
    { data: contacts },
    { data: requests },
    { data: reports },
    { data: files },
    { data: people },
    { data: steps },
    { data: deckVersions },
  ] = await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .eq("company_id", params.id)
        .order("created_at", { ascending: false }),
      admin
        .from("report_requests")
        .select(
          "id, contact_name, contact_email, kind, status, origin, created_at, assigned_to"
        )
        .eq("company_id", params.id)
        .order("created_at", { ascending: false }),
      admin
        .from("reports")
        .select("id, title, status, version, created_at, request_id")
        .eq("company_id", params.id)
        .order("version", { ascending: false }),
      admin
        .from("report_files")
        .select("id, filename, kind, created_at")
        .eq("company_id", params.id)
        .order("created_at", { ascending: false }),
      // 025. People you've met, whether or not they ever signed up.
      admin
        .from("contacts")
        .select("id, name, title, email, source, notes, profile_id")
        .eq("company_id", params.id)
        .order("created_at", { ascending: true }),
      // Open first and by due date, then closed. `due_on` nulls last so an
      // undated step doesn't sort above one that's actually overdue.
      admin
        .from("company_steps")
        .select("id, step, due_on, done_at")
        .eq("company_id", params.id)
        .order("done_at", { ascending: true, nullsFirst: true })
        .order("due_on", { ascending: true, nullsFirst: false }),
      // 026. Recipients come back nested — who saw which version is the whole
      // reason the table exists, and fetching them separately would mean
      // stitching two lists by hand for no benefit.
      admin
        .from("deck_versions")
        .select(
          "id, label, audience, status, generated, edits, source_report_id, created_at, deck_version_recipients(id, name, presented_at)"
        )
        .eq("company_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const contactRows = contacts ?? [];
  const peopleRows = (people ?? []) as Contact[];
  const stepRows = (steps ?? []) as Step[];
  const openSteps = stepRows.filter((s) => !s.done_at);

  const versionRows: DeckVersion[] = (deckVersions ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    audience: v.audience,
    status: v.status,
    generated: v.generated,
    edits: v.edits,
    source_report_id: v.source_report_id,
    created_at: v.created_at,
    recipients: (v.deck_version_recipients ?? []) as DeckVersion["recipients"],
  }));
  const requestRows = requests ?? [];
  const reportRows = reports ?? [];
  const fileRows = files ?? [];

  const open = requestRows.filter(
    (r) => r.status !== "sent" && r.status !== "archived"
  );
  const released = reportRows.filter((r) => r.status === "ready");

  // Staff names for the assignment column, resolved in one query.
  const assigneeIds = Array.from(
    new Set(requestRows.map((r) => r.assigned_to).filter(Boolean))
  ) as string[];
  const { data: assignees } = assigneeIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", assigneeIds)
    : { data: [] };
  const assigneeName = new Map(
    (assignees ?? []).map((a) => [a.id, a.full_name || a.email])
  );

  const { data: staff } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("role", ["analyst", "admin", "owner"])
    .order("email");
  const staffOptions = (staff ?? []).map((s) => ({
    id: s.id,
    label: s.full_name || s.email,
  }));

  return (
    <Section className="pt-12 pb-24">
      <Link
        href="/admin/companies"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
      >
        ← Companies
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-serif font-light text-4xl">
            {company.name || company.domain}
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {company.domain} · tracked since {when(company.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {openSteps.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue border border-blue/40 bg-blue-light px-3 py-1.5">
              {openSteps.length} step{openSteps.length === 1 ? "" : "s"}
            </span>
          )}
          {open.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-caution border border-caution/40 bg-amber-light px-3 py-1.5">
              {open.length} open
            </span>
          )}
        </div>
      </div>

      {/* Brief and steps first — the two questions you arrive with. */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <BriefPanel companyId={company.id} notes={company.notes ?? null} />
        <StepsPanel companyId={company.id} steps={stepRows} />
      </div>

      <div className="mt-6">
        <ContactsPanel
          companyId={company.id}
          contacts={peopleRows}
          users={contactRows as AccountUser[]}
        />
      </div>

      <div className="mt-6">
        <DeckVersionsPanel
          companyId={company.id}
          versions={versionRows}
          reports={released.map((r) => ({
            id: r.id,
            title: r.title,
            version: r.version,
          }))}
          contacts={peopleRows.map((c) => ({ id: c.id, name: c.name }))}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com"}
        />
      </div>

      {/* Stage and owner. Kept as their own panel rather than folded into the
          header — they're set rarely and read often, which is the opposite of
          the steps above. `next_action` still lives here for now; the steps
          list supersedes it and it should be migrated across and dropped once
          nothing depends on the column. */}
      <div className="mt-6">
        <CrmPanel
          companyId={company.id}
          stage={company.stage ?? "lead"}
          ownerId={company.owner_id ?? null}
          nextAction={company.next_action ?? null}
          nextActionAt={company.next_action_at ?? null}
          staff={staffOptions}
        />
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat n={peopleRows.length + contactRows.length} label="People" />
        <Stat n={open.length} label="Open requests" />
        <Stat n={released.length} label="Released reports" />
        <Stat n={fileRows.length} label="Files" />
      </div>

      {/* ── requests ── */}
      <h2 className="mt-14 mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
        Requests
      </h2>
      <div className="border border-border">
        {requestRows.length === 0 ? (
          <Empty>No requests yet.</Empty>
        ) : (
          requestRows.map((r) => {
            const s = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.new;
            return (
              <Link
                key={r.id}
                href={`/admin/requests/${r.id}`}
                className="grid md:grid-cols-[1.5fr_0.8fr_0.9fr_0.9fr_0.6fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
              >
                <span className="text-[14px] text-navy self-center">
                  {r.origin === "admin"
                    ? "Internal research"
                    : r.contact_name || r.contact_email}
                </span>
                <span className="self-center font-mono text-[9px] uppercase tracking-[0.1em] text-gray-warm">
                  {r.kind}
                </span>
                <span className="self-center flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${s.text}`}>
                    {s.label}
                  </span>
                </span>
                <span className="self-center font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool truncate">
                  {r.assigned_to ? assigneeName.get(r.assigned_to) ?? "Assigned" : "Unassigned"}
                </span>
                <span className="self-center md:text-right font-mono text-[11px] text-gray-cool">
                  {when(r.created_at)}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* ── reports ── */}
      <h2 className="mt-12 mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
        Reports
      </h2>
      <div className="border border-border">
        {reportRows.length === 0 ? (
          <Empty>Nothing produced yet.</Empty>
        ) : (
          reportRows.map((r) => (
            <Link
              key={r.id}
              href={`/admin/reports/${r.id}`}
              className="grid md:grid-cols-[2fr_0.5fr_0.9fr_0.6fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
            >
              <span className="text-[14px] text-navy self-center">
                {r.title || "Untitled report"}
              </span>
              <span className="self-center font-mono text-[10px] text-gray-cool tabular-nums">
                v{r.version}
              </span>
              <span
                className={`self-center font-mono text-[10px] uppercase tracking-[0.1em] ${
                  r.status === "ready" ? "text-pos" : "text-caution"
                }`}
              >
                {r.status === "ready" ? "Released" : r.status}
              </span>
              <span className="self-center md:text-right font-mono text-[11px] text-gray-cool">
                {when(r.created_at)}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* ── contacts ── */}
      <h2 className="mt-12 mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
        Contacts
      </h2>
      <div className="border border-border">
        {contactRows.length === 0 ? (
          <Empty>
            Nobody from this domain has an account. Released reports become
            visible automatically when someone signs up with a matching email
            domain — no backfill needed.
          </Empty>
        ) : (
          contactRows.map((c) => (
            <div
              key={c.id}
              className="grid md:grid-cols-[1.5fr_1.5fr_0.7fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0"
            >
              <span className="text-[14px] text-navy">{c.full_name || "—"}</span>
              <span className="font-mono text-[12px] text-gray-warm self-center">
                {c.email}
              </span>
              <span className="self-center md:text-right font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                {c.role}
              </span>
            </div>
          ))
        )}
      </div>

      {fileRows.length > 0 && (
        <>
          <h2 className="mt-12 mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
            Files
          </h2>
          <div className="border border-border">
            {fileRows.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border last:border-b-0"
              >
                <span className="text-[13px] text-navy truncate">{f.filename}</span>
                <span className="shrink-0 font-mono text-[10px] text-gray-cool">
                  {when(f.created_at)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
