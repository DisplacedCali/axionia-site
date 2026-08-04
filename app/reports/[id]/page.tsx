import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
 * 1. It reads through the ANON client carrying the user's session, not the
 *    service role. `reports_select_company_ready` then does the authorisation:
 *    released only, and only for the requester or someone at the same company.
 *    Using the admin client here and checking status in TypeScript would move
 *    the guarantee out of the database and into whichever branch someone edits
 *    next.
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

export default async function ClientReport({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out is a recoverable state, so send them to log in and come back.
  // This leaks nothing: it happens identically for ids that don't exist.
  if (!user) redirect(`/login?redirectTo=/reports/${params.id}`);

  const { data: report } = await supabase
    .from("reports")
    .select(
      "id, title, summary, version, content, edits, client_view, released_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  // Missing, unreleased, or someone else's — all one answer. Distinguishing
  // them would confirm which report ids exist.
  if (!report) notFound();

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
        <Link
          href="/dashboard"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
        >
          ← Dashboard
        </Link>
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
