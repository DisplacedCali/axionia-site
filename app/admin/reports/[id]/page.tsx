import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, RELEASE_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Section } from "@/components/ui";
import ReportReview from "@/components/admin/ReportReview";
import InternalOrientation from "@/components/admin/InternalOrientation";
import DocumentFlow from "@/components/admin/DocumentFlow";
import { reportLinksEnabled } from "@/lib/reportLinks";
import {
  assembleReport,
  releaseBlockers,
  type ReportEdits,
  type ReportView,
} from "@/lib/modules/research/report";
import type { ResearchResult } from "@/lib/modules/research/pipeline/types";

export const dynamic = "force-dynamic";

/**
 * Report preview and revision.
 *
 * Its own page rather than a panel on the request: the report wants full width
 * to be read as a document, and printing to PDF needs a real page. The request
 * page keeps queue and status work and links here.
 */
export default async function ReportPreview({ params }: { params: { id: string } }) {
  const { profile } = await requireStaff();
  const canRelease = RELEASE_ROLES.includes(profile.role);
  const admin = createAdminClient();

  const { data: report } = await admin
    .from("reports")
    .select(
      "id, title, summary, status, version, content, edits, client_view, reviewed_at, request_id, company_id, research_run_id, created_at, companies(name)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!report) notFound();

  const content = (report.content ?? null) as ResearchResult | null;
  const edits = (report.edits ?? {}) as ReportEdits;
  // Defaults to internal now (migration 028) — a run is a research file until
  // somebody decides otherwise, rather than a client document by default.
  const clientView = (report.client_view ?? "internal") as ReportView;

  // Admin always previews at the client's chosen view — reviewing the full
  // report while the client gets the summary would be reviewing the wrong thing.
  const assembled = content ? assembleReport({ content, edits, view: clientView }) : null;

  // Supabase types an embedded relation as object-or-array depending on the
  // inferred cardinality; normalise rather than casting at the use site.
  const companyRel = report.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(companyRel)
    ? (companyRel[0]?.name ?? null)
    : (companyRel?.name ?? null);

  const revisions =
    ((edits as Record<string, unknown>).revisions as Record<
      string,
      { comment?: string; note?: string; at?: string }
    >) ?? {};

  return (
    <Section className="pt-12 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        {report.request_id ? (
          <Link
            href={`/admin/requests/${report.request_id}`}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
          >
            ← Request
          </Link>
        ) : (
          <Link
            href="/admin"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
          >
            ← Queue
          </Link>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
          v{report.version ?? 1} · {report.status}
          {report.reviewed_at ? " · reviewed" : " · not yet reviewed"}
        </span>
      </div>

      {!assembled ? (
        <div className="mt-10 border border-caution/40 bg-amber-light/50 p-6">
          <h1 className="font-serif text-2xl font-light text-navy">No research attached</h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
            This report has no research payload, so there is nothing to render. Run research
            from the request page, or attach an existing run.
          </p>
          {report.request_id && (
            <Link
              href={`/admin/requests/${report.request_id}`}
              className="mt-5 inline-block px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
            >
              Go to request
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8">
          {/*
            Where the document is and what happens next. Above the report
            rather than below it: it's the first question on arriving, and a
            long document would bury the answer.
          */}
          <div className="mb-8">
            <DocumentFlow
              reportId={report.id}
              requestId={report.request_id ?? null}
              companyId={report.company_id ?? null}
              companyName={companyName}
              reviewedAt={report.reviewed_at ?? null}
              released={report.status === "ready"}
              blockers={releaseBlockers({
                content,
                edits,
                reviewedAt: report.reviewed_at ?? null,
                view: clientView,
              })}
              canRelease={canRelease}
              linksEnabled={reportLinksEnabled()}
            />
          </div>
          {clientView === "internal" && assembled && (
            <InternalOrientation report={assembled} />
          )}
          <ReportReview
            reportId={report.id}
            requestId={report.request_id ?? null}
            report={assembled}
            clientView={clientView}
            reviewedAt={report.reviewed_at ?? null}
            blockers={releaseBlockers({
              content,
              edits,
              reviewedAt: report.reviewed_at ?? null,
              view: clientView,
            })}
            revisions={revisions}
            scoreNotes={edits.scoreNotes ?? {}}
          />
        </div>
      )}
    </Section>
  );
}
