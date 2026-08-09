"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBrief } from "@/app/admin/companies/actions";

/**
 * The company brief.
 *
 * Explicitly saved rather than saved-on-change, which is the opposite of
 * CrmPanel and deliberate: a select has one correct value at every moment, a
 * paragraph does not. Autosaving prose means saving it mid-sentence.
 *
 * Starts in read mode when there's something to read. The common visit to this
 * page is to remember who these people are, not to write it down again.
 */
export default function BriefPanel({
  companyId,
  notes,
}: {
  companyId: string;
  notes: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(!notes);
  const [draft, setDraft] = useState(notes ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      setErr(null);
      const res = await updateBrief(companyId, draft);
      if (!res.ok) return setErr(res.error);
      setEditing(false);
      router.refresh();
    });

  if (!editing) {
    return (
      <div className="border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
            Brief
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
          >
            Edit
          </button>
        </div>
        <p className="text-[15px] leading-[1.75] text-navy whitespace-pre-wrap max-w-measure">
          {notes}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border p-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
        Brief
      </h2>
      <textarea
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Who they are, how you know them, and why this one matters. Written for you in three months, not for the file."
        className="w-full border border-border bg-white/50 px-3 py-2.5 text-[14px] leading-[1.7] focus:outline-none focus:border-navy transition-colors"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="px-4 py-2 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Saving" : "Save"}
        </button>
        {notes !== null && (
          <button
            onClick={() => {
              setDraft(notes ?? "");
              setEditing(false);
              setErr(null);
            }}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
