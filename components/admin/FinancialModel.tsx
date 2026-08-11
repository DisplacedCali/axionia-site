"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  modelDownloadUrl,
  deleteModelVersion,
  type ModelVersion,
} from "@/app/admin/decks/model-actions";

/**
 * The financial model, on the site instead of on a laptop.
 *
 * Staff only and no share link — see the header in model-actions.ts for why
 * that stopping point is deliberate rather than unfinished. Downloading and
 * emailing it by hand keeps the fact that an xlsx can't be revoked visible to
 * the person deciding to send one.
 *
 * Versions are listed newest-first with the current one marked, because the
 * question worth answering later is "which one did they see", and a single
 * mutable file cannot answer it.
 */

function when(iso: string) {
  const d = new Date(iso);
  const h = (Date.now() - d.getTime()) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  if (h < 24 * 14) return `${Math.round(h / 24)}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function size(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FinancialModel({
  versions,
}: {
  versions: ModelVersion[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);

    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/model", { method: "POST", body });
    const json = await res.json().catch(() => ({ error: "Upload failed." }));

    setBusy(false);
    // Clear the input either way, or picking the same file twice after a
    // failure fires no change event and looks like the button is dead.
    e.target.value = "";

    if (!res.ok) return setErr(json.error ?? "Upload failed.");
    router.refresh();
  }

  function download(path: string) {
    setErr(null);
    start(async () => {
      const res = await modelDownloadUrl(path);
      if (!res.ok) return setErr(res.error);
      // The signed URL carries ?download, so this saves rather than navigating
      // away from the admin.
      window.location.href = res.url;
    });
  }

  function remove(path: string) {
    setErr(null);
    start(async () => {
      const res = await deleteModelVersion(path);
      if (!res.ok) return setErr(res.error);
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <label className="inline-block px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors cursor-pointer">
          {busy ? "Uploading…" : "Upload a version"}
          <input
            type="file"
            className="hidden"
            onChange={upload}
            disabled={busy}
            accept=".xlsx,.xlsm,.xls,.csv,.numbers,.pdf"
          />
        </label>
        <p className="text-[13px] leading-[1.6] text-gray-warm max-w-measure">
          Staff only, and there&rsquo;s no share link — download it and send it
          yourself. A spreadsheet can&rsquo;t be watermarked or recalled the way
          the deck PDF can, so the honest control is deciding who gets a copy,
          one at a time.
        </p>
      </div>

      {err && <p className="mb-4 text-[13px] text-risk">{err}</p>}

      {versions.length === 0 ? (
        <p className="text-[13px] text-gray-cool">
          No versions yet. Upload the model and it lives here instead of in your
          downloads folder.
        </p>
      ) : (
        <div className="border border-border">
          {versions.map((v, n) => (
            <div
              key={v.path}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0"
            >
              <span className="flex-1 min-w-[200px] text-[14px] text-navy truncate">
                {v.filename}
                {n === 0 && (
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-blue border border-blue px-1.5 py-0.5">
                    Current
                  </span>
                )}
                <span className="block font-mono text-[11px] text-gray-cool">
                  {when(v.uploadedAt)}
                  {v.sizeBytes ? ` · ${size(v.sizeBytes)}` : ""}
                </span>
              </span>

              <button
                onClick={() => download(v.path)}
                disabled={pending}
                className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
              >
                Download
              </button>

              {/* Two-step, like ArchiveControl on the queue: this sits on a row
                  you might be clicking to open, and a superseded model is
                  still the record of what somebody was shown. */}
              {confirming === v.path ? (
                <span className="flex items-center gap-2">
                  <button
                    onClick={() => remove(v.path)}
                    disabled={pending}
                    className="px-3 py-2 border border-risk text-risk font-mono text-[10px] uppercase tracking-[0.12em] disabled:opacity-40"
                  >
                    Really delete
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirming(v.path)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-risk transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
