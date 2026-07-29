import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/components/ui";
import ReviewPanel from "@/components/admin/ReviewPanel";
import AlignmentPanel from "@/components/admin/AlignmentPanel";

export const dynamic = "force-dynamic";

export default async function RequestDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("report_requests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!request) notFound();

  // draft attached to this request (if any)
  const { data: draft } = await admin
    .from("reports")
    .select("id, title, summary, status, version, supersedes_id, created_at")
    .eq("request_id", request.id)
    .maybeSingle();

  // everything already generated for this company
  const { data: priorReports } = request.company_id
    ? await admin
        .from("reports")
        .select("id, title, status, version, created_at, released_at")
        .eq("company_id", request.company_id)
        .order("version", { ascending: false })
    : { data: [] };

  const { data: files } = draft
    ? await admin
        .from("report_files")
        .select("id, filename, storage_path, size_bytes, created_at")
        .eq("report_id", draft.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // every file ever produced for this company
  const { data: companyFiles } = request.company_id
    ? await admin
        .from("report_files")
        .select("id, filename, storage_path, created_at, report_id")
        .eq("company_id", request.company_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // other contacts at this company
  const { data: colleagues } = request.company_id
    ? await admin
        .from("profiles")
        .select("id, full_name, email")
        .eq("company_id", request.company_id)
    : { data: [] };

  // documents the requester attached at intake
  const { data: intakeFiles } = await admin
    .from("report_files")
    .select("id, filename, storage_path, size_bytes, created_at")
    .eq("request_id", request.id)
    .eq("kind", "intake")
    .order("created_at", { ascending: false });

  const payload = (request.payload ?? {}) as Record<string, unknown>;

  return (
    <Section className="pt-12 pb-24">
      <Link
        href="/admin"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
      >
        ← Queue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-serif font-light text-4xl">
            {request.company_name || request.contact_email}
          </h1>
          <p className="mt-2 text-[15px] text-gray-warm">
            {request.contact_name || "—"} · {request.contact_email}
          </p>
        </div>
        {request.kind === "refresh" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-2 bg-amber-light text-caution border border-caution/40">
            Refresh — company already has a released report
          </span>
        )}
      </div>

      {/* alignment sits above everything — it gates whether work should start */}
      {request.alignment !== "matched" && (
        <div className="mt-8">
          <AlignmentPanel
            requestId={request.id}
            alignment={request.alignment}
            reason={request.alignment_reason}
            note={request.alignment_note}
            companyName={request.company_name}
            contactEmail={request.contact_email}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 mt-10">
        {/* ── review + release ── */}
        <ReviewPanel
          request={{
            id: request.id,
            status: request.status,
            adminNotes: request.admin_notes ?? "",
            companyId: request.company_id,
            companyName: request.company_name,
          }}
          draft={
            draft
              ? {
                  id: draft.id,
                  title: draft.title ?? "",
                  summary: draft.summary ?? "",
                  status: draft.status,
                  version: draft.version ?? 1,
                }
              : null
          }
          files={(files ?? []).map((f) => ({
            id: f.id,
            filename: f.filename,
            storagePath: f.storage_path,
            sizeBytes: f.size_bytes,
          }))}
        />

        {/* ── context sidebar ── */}
        <div className="space-y-8">
          <div className="border border-border p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
              Intake
            </h2>
            <dl className="space-y-3 text-[14px]">
              {[
                ["Covered subscribers", payload.employees],
                ["Workforce profile", payload.industry],
                ["Programs of interest", payload.programs],
                ["Additional context", payload.context],
                ["Email domain", payload.email_domain],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                    {String(label)}
                  </dt>
                  <dd className="text-navy mt-0.5">
                    {value ? String(value) : <span className="text-gray-cool">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {payload.personal_email === true && (
              <p className="mt-4 text-[12px] leading-[1.6] text-caution bg-amber-light p-3 border-l-2 border-caution">
                Personal email domain — not grouped into a company. Assign one manually
                if this is a real employer.
              </p>
            )}
          </div>

          <div className="border border-border p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
              Documents they sent
            </h2>
            {(intakeFiles ?? []).length === 0 ? (
              <p className="text-[13px] text-gray-cool">
                Nothing attached — the analysis starts from the form only.
              </p>
            ) : (
              <ul className="space-y-2">
                {(intakeFiles ?? []).map((f) => (
                  <li key={f.id} className="flex items-baseline gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pos shrink-0 translate-y-[-2px]" />
                    <span className="text-[13px] text-navy truncate">
                      {f.filename}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-border p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
              Prior reports for this company
            </h2>
            {(priorReports ?? []).length === 0 ? (
              <p className="text-[13px] text-gray-cool">
                None — this is the first pull.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {(priorReports ?? []).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] text-navy">
                      v{r.version} · {r.title || "Untitled"}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool shrink-0">
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-border p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
              Files on file for this company
            </h2>
            {(companyFiles ?? []).length === 0 ? (
              <p className="text-[13px] text-gray-cool">Nothing generated yet.</p>
            ) : (
              <ul className="space-y-2">
                {(companyFiles ?? []).map((f) => (
                  <li key={f.id} className="text-[13px] text-gray-warm truncate">
                    {f.filename}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-border p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
              Contacts at this company
            </h2>
            {(colleagues ?? []).length === 0 ? (
              <p className="text-[13px] text-gray-cool">Just this requester.</p>
            ) : (
              <ul className="space-y-2">
                {(colleagues ?? []).map((c) => (
                  <li key={c.id} className="text-[13px]">
                    <span className="text-navy">{c.full_name || "—"}</span>{" "}
                    <span className="text-gray-cool">{c.email}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool">
              Everyone here sees the report once it&rsquo;s released.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
