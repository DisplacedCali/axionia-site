"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProposalVersion,
  editProposalVersion,
  setDeckVersionStatus,
  deleteDeckVersion,
  addDeckRecipient,
  mintProposalLink,
} from "@/app/admin/companies/deck-actions";
import { mergeProposalCustom, type ProposalCustom } from "@/lib/deck/proposalCustom";

export type ProposalVersion = {
  id: string;
  label: string;
  status: "draft" | "approved" | "retired";
  generated: ProposalCustom | null;
  edits: ProposalCustom | null;
  source_report_id: string | null;
  created_at: string;
  recipients: { id: string; name: string; presented_at: string }[];
};

export type ReleasedReport = { id: string; title: string | null; version: number | null };

/**
 * Proposal decks for one company.
 *
 * Deliberately not a mode of DeckVersionsPanel. That panel's "generate"
 * step calls an LLM against a report and the review step is built around
 * checking a model's cover/context prose (mergeCustom). Nothing here
 * calls a model — see lib/deck/proposalCustom.ts — and what there is to
 * review is a client name plus the company's live commercial terms, not
 * generated copy. Forcing those two flows through one component would
 * mean a `deck` switch scattered through every branch of it; TermsPanel
 * living apart from CrmPanel for the same reason is the precedent.
 *
 * The terms preview below is READ-ONLY and mirrors TermsPanel's own
 * copy — it's what the Investment slide will actually render, computed
 * the same way the deck route computes it, so approving a version means
 * reading the real numbers rather than trusting that they'll come out
 * right later.
 */
export default function ProposalVersionsPanel({
  companyId,
  versions,
  reports,
  contacts,
  terms,
}: {
  companyId: string;
  versions: ProposalVersion[];
  reports: ReleasedReport[];
  contacts: { id: string; name: string }[];
  terms: {
    foundingCohort: boolean;
    feeRate: number | null;
    seatsTaken: number;
    seatsCap: number;
    conversionLabel: string;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [reportId, setReportId] = useState(reports[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [linkUrls, setLinkUrls] = useState<Record<string, string>>({});
  const [who, setWho] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr(null);
      const res = await fn();
      if (!res.ok) return setErr(res.error ?? "Something went wrong.");
      router.refresh();
    });

  const field =
    "border border-border bg-white/50 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors";

  const investmentPreview = !terms.foundingCohort
    ? "Not founding cohort — the Investment slide will say terms are still being discussed rather than stating free-then-a-rate. Check the box in Terms above first."
    : `Free through ${terms.conversionLabel}, then ${
        terms.feeRate != null
          ? `${(terms.feeRate * 100).toFixed(2).replace(/\.?0+$/, "")}% of verified savings`
          : "a rate agreed together (not set yet)"
      }. ${terms.seatsTaken}/${terms.seatsCap} founding seats claimed.`;

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Proposal decks
        </h2>
        {versions.length > 0 && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <p className="mb-4 text-[12px] leading-[1.6] text-gray-cool">
        {investmentPreview}
      </p>

      {reports.length === 0 ? (
        <p className="text-[13px] leading-[1.65] text-gray-cool mb-4">
          No released report for this company yet. A proposal references
          analysis a person has already reviewed.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-border">
          <select
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            className={field}
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title || "Report"} {r.version ? `· v${r.version}` : ""}
              </option>
            ))}
          </select>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name for the cover"
            className={`${field} flex-1 min-w-[200px]`}
          />
          <button
            onClick={() =>
              run(async () => {
                const res = await createProposalVersion({
                  companyId,
                  reportId,
                  clientName,
                });
                if (res.ok) setClientName("");
                return res;
              })
            }
            disabled={pending || !reportId || !clientName.trim()}
            className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
          >
            {pending ? "Working" : "Create"}
          </button>
        </div>
      )}

      {versions.length === 0 && reports.length > 0 && (
        <p className="text-[13px] text-gray-cool">No proposal yet.</p>
      )}

      {versions.map((v) => {
        const merged = mergeProposalCustom(v.generated, v.edits);
        const isOpen = openId === v.id;
        const url = linkUrls[v.id];

        return (
          <div key={v.id} className="py-4 border-b border-border last:border-b-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[15px] text-navy flex-1 min-w-0">{v.label}</span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                  v.status === "approved"
                    ? "text-pos"
                    : v.status === "retired"
                      ? "text-gray-cool"
                      : "text-caution"
                }`}
              >
                {v.status}
              </span>
              <button
                onClick={() => setOpenId(isOpen ? null : v.id)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
              >
                {isOpen ? "Hide" : "Review"}
              </button>
            </div>

            {isOpen && (
              <div className="mt-4 border border-border bg-base-2 p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-3">
                  Cover reads
                </div>
                <p className="font-serif font-light text-2xl leading-snug text-navy mb-4">
                  {merged.clientName
                    ? `Prepared for ${merged.clientName}`
                    : "Prepared for — (no name set)"}
                </p>

                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-2">
                  Investment slide reads
                </div>
                <p className="text-[13px] leading-[1.6] text-gray-warm mb-4">
                  {investmentPreview}
                </p>

                <p className="text-[12px] leading-[1.6] text-gray-cool">
                  Everything else in this deck is the standard proposal —
                  scope, phases, terms — the same for every founding
                  relationship.
                </p>

                <div className="mt-3">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2">
                    Correct the name
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      defaultValue={merged.clientName ?? ""}
                      id={`cn-${v.id}`}
                      className={`${field} flex-1`}
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          `cn-${v.id}`,
                        ) as HTMLInputElement | null;
                        run(() =>
                          editProposalVersion(companyId, v.id, {
                            clientName: el?.value ?? "",
                          }),
                        );
                      }}
                      disabled={pending}
                      className="px-3 py-2 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-navy hover:text-navy transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {v.status !== "approved" && (
                    <button
                      onClick={() =>
                        run(() => setDeckVersionStatus(companyId, v.id, "approved"))
                      }
                      disabled={pending}
                      className="px-4 py-2 border border-pos text-pos font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-pos hover:text-base transition-colors disabled:opacity-40"
                    >
                      Approve
                    </button>
                  )}
                  {v.status === "approved" && (
                    <>
                      <button
                        onClick={() =>
                          start(async () => {
                            setErr(null);
                            setWarning(null);
                            const res = await mintProposalLink(companyId, v.id);
                            if (!res.ok) return setErr(res.error);
                            setLinkUrls((m) => ({ ...m, [v.id]: res.url }));
                            setWarning(res.warning ?? null);
                            // Pulls the new row into the Share links panel
                            // below, so the log and the link agree at once.
                            router.refresh();
                          })
                        }
                        disabled={pending}
                        className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
                      >
                        {url ? "Re-mint link" : "Create link"}
                      </button>
                      <button
                        onClick={() =>
                          run(() => setDeckVersionStatus(companyId, v.id, "draft"))
                        }
                        disabled={pending}
                        className="px-4 py-2 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-caution hover:text-caution transition-colors disabled:opacity-40"
                      >
                        Unapprove
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => run(() => deleteDeckVersion(companyId, v.id))}
                    disabled={pending}
                    className="px-4 py-2 border border-border text-gray-cool font-mono text-[10px] uppercase tracking-[0.12em] hover:border-risk hover:text-risk transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>

                {url && (
                  <div className="mt-4 border border-border bg-base p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-warm">
                        Link · expires in 90 days
                        {warning ? "" : " · saved under Share links"}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(url);
                          setCopied(v.id);
                          setTimeout(() => setCopied(null), 1600);
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
                      >
                        {copied === v.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <code className="block font-mono text-[11px] leading-relaxed text-navy break-all">
                      {url}
                    </code>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {v.recipients.map((r) => (
                <span
                  key={r.id}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-warm border border-border px-2 py-1"
                >
                  {r.name}
                </span>
              ))}
              <input
                list={`p-contacts-${v.id}`}
                value={openId === v.id ? who : ""}
                onChange={(e) => {
                  setOpenId(v.id);
                  setWho(e.target.value);
                }}
                placeholder="Showed it to…"
                className="border border-border bg-white/50 px-2 py-1 text-[13px] w-44 focus:outline-none focus:border-navy"
              />
              <datalist id={`p-contacts-${v.id}`}>
                {contacts.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <button
                onClick={() =>
                  run(async () => {
                    const match = contacts.find((c) => c.name === who);
                    const res = await addDeckRecipient({
                      companyId,
                      versionId: v.id,
                      contactId: match?.id ?? null,
                      name: who,
                    });
                    if (res.ok) setWho("");
                    return res;
                  })
                }
                disabled={pending || !who.trim() || openId !== v.id}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline disabled:opacity-30 disabled:no-underline"
              >
                Add
              </button>
            </div>
          </div>
        );
      })}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
      {warning && <p className="mt-3 text-caution text-[13px]">{warning}</p>}
    </div>
  );
}
