"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateDeckVersion,
  setDeckVersionStatus,
  deleteDeckVersion,
  addDeckRecipient,
  editDeckVersion,
} from "@/app/admin/companies/deck-actions";
import { mergeCustom, type DeckCustom } from "@/lib/deck/custom";

export type DeckVersion = {
  id: string;
  label: string;
  audience: string | null;
  status: "draft" | "approved" | "retired";
  generated: DeckCustom | null;
  edits: DeckCustom | null;
  source_report_id: string | null;
  created_at: string;
  recipients: { id: string; name: string; presented_at: string }[];
};

export type ReleasedReport = { id: string; title: string | null; version: number | null };

/**
 * Tailored decks for one company.
 *
 * The order of the controls is the safety model made visible: generate, read,
 * approve, then share. A version's link does not resolve until somebody has
 * approved it, and approving is a separate click from generating precisely so
 * that reading happens in between.
 *
 * The preview shows the whole override — it's three fields and up to four
 * points by design, which is what makes "read it before you approve it" a
 * realistic instruction rather than a hopeful one.
 */
export default function DeckVersionsPanel({
  companyId,
  versions,
  reports,
  contacts,
  siteUrl,
}: {
  companyId: string;
  versions: DeckVersion[];
  reports: ReleasedReport[];
  contacts: { id: string; name: string }[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [reportId, setReportId] = useState(reports[0]?.id ?? "");
  const [audience, setAudience] = useState<"" | "hr" | "cfo" | "broker">("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
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

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Tailored decks
        </h2>
        {versions.length > 0 && (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* generate */}
      {reports.length === 0 ? (
        <p className="text-[13px] leading-[1.65] text-gray-cool mb-4">
          No released report for this company yet. A tailored deck is written
          only from analysis a person has already reviewed — with nothing
          reviewed, there is nothing safe to tailor from.
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
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className={field}
          >
            <option value="">Neutral</option>
            <option value="hr">For HR</option>
            <option value="cfo">For CFO</option>
            <option value="broker">For broker</option>
          </select>
          <button
            onClick={() =>
              run(() =>
                generateDeckVersion({
                  companyId,
                  reportId,
                  audience: audience || null,
                }),
              )
            }
            disabled={pending || !reportId}
            className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
          >
            {pending ? "Working" : "Generate"}
          </button>
        </div>
      )}

      {versions.length === 0 && reports.length > 0 && (
        <p className="text-[13px] text-gray-cool">
          Nothing tailored yet.
        </p>
      )}

      {versions.map((v) => {
        const merged = mergeCustom(v.generated, v.edits);
        const url = `${siteUrl}/deck?v=${v.id}`;
        const isOpen = openId === v.id;

        return (
          <div key={v.id} className="py-4 border-b border-border last:border-b-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[15px] text-navy flex-1 min-w-0">{v.label}</span>
              {v.audience && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-blue">
                  {v.audience}
                </span>
              )}
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
                  Everything this version changes
                </div>

                {merged.cover?.headline && (
                  <p className="font-serif font-light text-2xl leading-snug text-navy mb-2">
                    {merged.cover.headline}
                  </p>
                )}
                {merged.cover?.sub && (
                  <p className="text-[14px] leading-[1.7] text-gray-warm mb-4 max-w-measure">
                    {merged.cover.sub}
                  </p>
                )}

                {merged.context && (
                  <div className="border-t border-border pt-4">
                    {merged.context.title && (
                      <p className="font-serif text-xl text-navy mb-1">
                        {merged.context.title}
                      </p>
                    )}
                    {merged.context.lede && (
                      <p className="text-[14px] leading-[1.7] text-gray-warm mb-3 max-w-measure">
                        {merged.context.lede}
                      </p>
                    )}
                    {merged.context.points?.map((p) => (
                      <div key={p.k} className="mb-2">
                        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-blue">
                          {p.k}
                        </div>
                        <div className="text-[13px] leading-[1.6] text-gray-warm">
                          {p.v}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool">
                  Written from the released report only. Check every specific
                  before approving — a wrong figure here is one you&rsquo;d be
                  reading aloud.
                </p>

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
                        onClick={() => {
                          navigator.clipboard?.writeText(url);
                          setCopied(v.id);
                          setTimeout(() => setCopied(null), 1600);
                        }}
                        className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
                      >
                        {copied === v.id ? "Copied" : "Copy link"}
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
              </div>
            )}

            {/* who saw it */}
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
                list={`contacts-${v.id}`}
                value={openId === v.id ? who : ""}
                onChange={(e) => {
                  setOpenId(v.id);
                  setWho(e.target.value);
                }}
                placeholder="Showed it to…"
                className="border border-border bg-white/50 px-2 py-1 text-[13px] w-44 focus:outline-none focus:border-navy"
              />
              <datalist id={`contacts-${v.id}`}>
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
    </div>
  );
}
