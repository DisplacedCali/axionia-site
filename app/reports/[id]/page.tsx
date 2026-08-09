import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReportLink } from "@/lib/reportLinks";
import { Section } from "@/components/ui";
import ReportRender from "@/components/ReportRender";
import ReportActions from "./ReportActions";
import {
  assembleReport,
  type ReportEdits,
  type ReportView,
} from "@/lib/modules/research/report";
import type { ResearchResult } from "@/lib/modules/research/pipeline/types";

export const dynamic = "force-dynamic";

/**
 * The client's view of a released report.
 *
 * Three things hold this page together.
 *
 * 1. Authorisation is the DATABASE's decision, never TypeScript's. The page
 *    reads the safe columns through the anon client carrying the user's
 *    session, and `reports_select_company_ready` does the authorising:
 *    released only, and only for the requester or someone at the same company.
 *    That read succeeding IS the permission. Checking status in TypeScript
 *    instead would move the guarantee into whichever branch someone edits next.
 *
 *    The payload is fetched separately with the service role, because RLS
 *    gates rows and not columns — see migration 030. That is a fetch after a
 *    decision, not a second decision.
 *
 * 2. It renders with the SAME `ReportRender` the admin preview uses. That is
 *    the whole reason that component takes optional slots — divergence between
 *    what Tom reviews and what the client reads is the failure mode that
 *    matters most for a product selling analytical rigour.
 *
 * 3. `client_view` decides how much is shown. Withheld sections render as
 *    locked placeholders rather than vanishing, so the client knows the
 *    analysis exists rather than wondering whether it was ever done.
 */

export const metadata = {
  title: "Your report",
  // Private by definition. The page is behind auth, but a report URL pasted
  // into a public channel shouldn't end up indexed on top of that.
  robots: { index: false, follow: false },
};

export default async function ClientReport({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { k?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    A signed link is an alternative to a session, not a shortcut past one.

    `verifyReportLink` takes the id from the route, so a valid token for one
    report cannot be replayed against another by editing the URL — that is the
    whole reason the id is inside the signature rather than beside it.

    The status check below is NOT optional on this path: with no session there
    is no RLS doing it for us, so `status = 'ready'` has to be asserted here.
    Forgetting it would make every draft readable to anyone holding any link.
  */
  const linked = searchParams.k
    ? verifyReportLink(params.id, searchParams.k)
    : null;
  const viaLink = linked?.ok === true;

  if (!user && !viaLink) {
    // Signed out and no link is a recoverable state, so send them to log in
    // and come back. Leaks nothing: identical for ids that don't exist.
    redirect(`/login?redirectTo=/reports/${params.id}`);
  }

  /*
    Two reads, and the split is the point.

    `content` and `edits` are no longer selectable by anon or authenticated —
    migration 030 revoked them, because RLS gates rows and not columns, so a
    client could previously call the API with their own token and read the
    whole research blob including the internal pre-meeting brief. Section
    visibility was presentational; it decided what got rendered, never what
    could be read.

    So the entitlement read comes first, through the SESSION client, over the
    safe columns only. That read IS the authorisation check — performed by
    `reports_select_company_ready`, in the database, exactly as before. Nothing
    moved into TypeScript. If the policy says no there is no row, and the page
    404s before the service role is touched.

    Only then does the server fetch the payload. The client never receives a
    column it isn't entitled to, and the assembly that decides what's visible
    stays in assembleReport() where it is defined once.
  */
  const safeCols = "id, title, summary, version, client_view, released_at, status";

  const { data: entitlement } = viaLink
    ? await createAdminClient()
        .from("reports")
        .select(safeCols)
        .eq("id", params.id)
        // Asserted here because no RLS policy is doing it on this path.
        .eq("status", "ready")
        .maybeSingle()
    : await supabase
        .from("reports")
        .select(safeCols)
        .eq("id", params.id)
        .maybeSingle();

  // Missing, unreleased, or someone else's — all one answer. Distinguishing
  // them would confirm which report ids exist.
  if (!entitlement) notFound();

  // Authorised above. This is a fetch, not a second decision — the id is the
  // one the database just approved, and no new predicate is introduced here.
  const { data: payload } = await createAdminClient()
    .from("reports")
    .select("content, edits")
    .eq("id", entitlement.id)
    .maybeSingle();

  const report = { ...entitlement, ...(payload ?? {}) } as typeof entitlement & {
    content?: unknown;
    edits?: unknown;
  };

  const content = (report.content ?? null) as ResearchResult | null;
  const edits = (report.edits ?? {}) as ReportEdits;
  const view = (report.client_view ?? "summary") as ReportView;

  const assembled = content ? assembleReport({ content, edits, view }) : null;

  const released = report.released_at
    ? new Date(report.released_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Section className="pt-12 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 print:hidden">
        {/* A link-only viewer has no dashboard to go back to, and offering one
            would send them to a login they don't have. */}
        {user ? (
          <Link
            href="/dashboard"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
          >
            ← Dashboard
          </Link>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
            Shared with you · confidential
          </span>
        )}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
            v{report.version}
            {released ? ` · ${released}` : ""}
          </span>
          <ReportActions reportId={report.id} />
        </div>
      </div>

      {assembled ? (
        <ReportRender report={assembled} showWithheld />
      ) : (
        /*
          Reports released before the renderer existed carry no `content` —
          they were delivered as an attached file. Rather than render an empty
          document, say so plainly. Building a client-side signed-download path
          for these is a separate piece of work; there are few enough of them
          that a reply is faster than a feature.
        */
        <div className="border border-border p-10 max-w-2xl">
          <h1 className="font-serif font-light text-3xl mb-4">
            {report.title || "Axionia Insight"}
          </h1>
          {report.summary && (
            <p className="text-[15px] leading-[1.75] text-gray-warm whitespace-pre-line mb-6">
              {report.summary}
            </p>
          )}
          <p className="text-[15px] leading-[1.75] text-gray-warm">
            This report was delivered as a document rather than through the
            portal. If you don&rsquo;t have the file to hand,{" "}
            <Link href="/contact" className="text-blue hover:underline">
              ask us
            </Link>{" "}
            and we&rsquo;ll send it again.
          </p>
        </div>
      )}
    </Section>
  );
}
