"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertDraftReport,
  saveAdminNotes,
  releaseReport,
  deleteReportFile,
  signedFileUrl,
  setRequestStatus,
} from "@/app/admin/actions";

type Props = {
  request: {
    id: string;
    status: string;
    adminNotes: string;
    companyId: string | null;
    companyName: string | null;
  };
  draft: {
    id: string;
    title: string;
    summary: string;
    status: string;
    version: number;
  } | null;
  files: {
    id: string;
    filename: string;
    storagePath: string;
    sizeBytes: number | null;
  }[];
};

const labelCls = "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";
const inputCls =
  "w-full border border-border bg-white/50 px-4 py-3 font-sans text-[15px] focus:outline-none focus:border-navy transition-colors";

function kb(n: number | null) {
  if (!n) return "";
  return n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`;
}

export default function ReviewPanel({ request, draft, files }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(
    draft?.title || `${request.companyName ?? "Portfolio"} — Axionia Insight`
  );
  const [summary, setSummary] = useState(draft?.summary || "");
  const [notes, setNotes] = useState(request.adminNotes);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => {
    setMsg(m);
    setErr(null);
    setTimeout(() => setMsg(null), 2500);
  };

  async function saveDraft() {
    const res = await upsertDraftReport({ requestId: request.id, title, summary });
    if (!res.ok) return setErr(res.error);
    flash("Draft saved.");
    router.refresh();
  }

  async function saveNotes() {
    const res = await saveAdminNotes(request.id, notes);
    if (!res.ok) return setErr(res.error);
    flash("Notes saved.");
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    let reportId = draft?.id;
    if (!reportId) {
      const created = await upsertDraftReport({ requestId: request.id, title, summary });
      if (!created.ok) return setErr(created.error);
      reportId = created.reportId;
    }

    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("reportId", reportId);
    if (request.companyId) fd.append("companyId", request.companyId);

    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const body = await res.json().catch(() => ({}));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";

    if (!res.ok) return setErr(body?.error ?? "Upload failed.");
    flash("File uploaded.");
    router.refresh();
  }

  async function openFile(path: string) {
    const url = await signedFileUrl(path);
    if (url) window.open(url, "_blank");
    else setErr("Could not generate a link for that file.");
  }

  async function removeFile(id: string) {
    const res = await deleteReportFile(id, request.id);
    if (!res.ok) return setErr(res.error);
    flash("File removed.");
    router.refresh();
  }

  async function release() {
    if (!draft) return setErr("Save a draft before releasing.");
    if (files.length === 0) {
      const ok = window.confirm(
        "No files are attached to this report. Release anyway?"
      );
      if (!ok) return;
    }
    const res = await releaseReport({ reportId: draft.id, requestId: request.id });
    if (!res.ok) return setErr(res.error);
    flash("Released — client notified by email.");
    router.refresh();
  }

  const released = draft?.status === "ready";

  return (
    <div className="space-y-8">
      {/* status */}
      <div className="border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={labelCls}>Status</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy">
            {request.status.replace("_", " ")}
            {draft ? ` · draft v${draft.version}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["new", "in_review", "ready", "archived"] as const).map((s) => (
            <button
              key={s}
              onClick={() =>
                startTransition(async () => {
                  const res = await setRequestStatus(request.id, s);
                  if (!res.ok) setErr(res.error);
                  else router.refresh();
                })
              }
              disabled={pending}
              className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                request.status === s
                  ? "border-navy bg-navy text-base"
                  : "border-border text-gray-warm hover:border-navy"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* draft */}
      <div className="border border-border p-6">
        <h2 className={`${labelCls} mb-4`}>Report draft</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputCls} mt-2`}
            />
          </div>
          <div>
            <label className={labelCls}>
              Summary — what the client reads first
            </label>
            <textarea
              rows={7}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Headline finding, the adjustment that matters most, and the recommended action. Ranges, never point figures."
              className={`${inputCls} mt-2`}
            />
          </div>
          <button
            onClick={() => startTransition(saveDraft)}
            disabled={pending}
            className="px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-50"
          >
            {draft ? "Save draft" : "Create draft"}
          </button>
        </div>
      </div>

      {/* files */}
      <div className="border border-border p-6">
        <h2 className={`${labelCls} mb-4`}>Report files</h2>

        {files.length > 0 && (
          <ul className="mb-4 divide-y divide-border border border-border">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] text-navy truncate">
                    {f.filename}
                  </span>
                  <span className="font-mono text-[10px] text-gray-cool">
                    {kb(f.sizeBytes)}
                  </span>
                </span>
                <span className="flex gap-3 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em]">
                  <button
                    onClick={() => openFile(f.storagePath)}
                    className="text-blue hover:underline"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => startTransition(() => removeFile(f.id))}
                    className="text-risk hover:underline"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={fileRef}
          type="file"
          onChange={upload}
          disabled={uploading}
          className="block w-full text-[13px] text-gray-warm file:mr-4 file:px-4 file:py-2 file:border file:border-border file:bg-base-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.12em] file:text-navy hover:file:border-navy"
        />
        <p className="mt-2 text-[12px] text-gray-cool">
          {uploading
            ? "Uploading…"
            : "Attach the generated report artifact. Stored privately; clients reach it through signed links only."}
        </p>
      </div>

      {/* internal notes */}
      <div className="border border-border p-6">
        <h2 className={`${labelCls} mb-4`}>Internal notes</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Never shown to the client."
          className={inputCls}
        />
        <button
          onClick={() => startTransition(saveNotes)}
          disabled={pending}
          className="mt-3 px-5 py-2.5 border border-border text-gray-warm font-mono text-[10px] uppercase tracking-[0.12em] hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
        >
          Save notes
        </button>
      </div>

      {/* release */}
      <div
        className={`border p-6 ${
          released ? "border-pos bg-green-light" : "border-navy"
        }`}
      >
        <h2 className={`${labelCls} mb-2`}>
          {released ? "Released" : "Release to client"}
        </h2>
        {released ? (
          <p className="text-[14px] leading-[1.7] text-gray-warm">
            This report is live. Everyone at{" "}
            {request.companyName || "this company"} can see it, and the client has been
            emailed.
          </p>
        ) : (
          <>
            <p className="text-[14px] leading-[1.7] text-gray-warm mb-5">
              Releasing makes the report visible to every contact at this company and
              emails the requester. Drafts stay invisible until you do.
            </p>
            <button
              onClick={() => startTransition(release)}
              disabled={pending || !draft}
              className="relative overflow-hidden group px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-base disabled:opacity-40"
            >
              <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
              <span className="relative z-10">
                {pending ? "Releasing…" : "Release & notify client"}
              </span>
            </button>
          </>
        )}
      </div>

      {msg && <p className="text-pos font-mono text-[11px]">{msg}</p>}
      {err && <p className="text-risk text-sm">{err}</p>}
    </div>
  );
}
