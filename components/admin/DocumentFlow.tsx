"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markReportReviewed } from "@/app/admin/research-actions";
import { releaseReport } from "@/app/admin/actions";

/**
 * Where this document is, and what happens to it next.
 *
 * The report page had no forward action on it at all — Print was the only
 * button pointing anywhere, because release lives on the request page in a
 * different component. So the flow was severed exactly where a person spends
 * the most time: you read and corrected the document here, then had to know,
 * unprompted, to navigate back somewhere else to finish it.
 *
 * Three stages, because three things actually happen: research produced it, a
 * person read it, and it left the building. Release stays gated by
 * `requireRelease()` server-side — this renders the control, it doesn't grant
 * the permission.
 */

type Stage = "researched" | "reviewed" | "released";

export default function DocumentFlow({
  reportId,
  requestId,
  companyId,
  companyName,
  reviewedAt,
  released,
  blockers,
  canRelease,
}: {
  reportId: string;
  requestId: string | null;
  companyId: string | null;
  companyName: string | null;
  reviewedAt: string | null;
  released: boolean;
  /** From releaseBlockers(). Soft ones warn; the action refuses on hard ones. */
  blockers: string[];
  canRelease: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const stage: Stage = released ? "released" : reviewedAt ? "reviewed" : "researched";
  const order: Stage[] = ["researched", "reviewed", "released"];
  const at = order.indexOf(stage);

  const steps = [
    { id: "researched", label: "Researched", note: "Pipeline complete" },
    { id: "reviewed", label: "Reviewed", note: "Read by a person" },
    { id: "released", label: "Released", note: "Sent, and filed" },
  ];

  async function review() {
    setBusy(true);
    setErr(null);
    const res = await markReportReviewed({ reportId, requestId: requestId ?? "" });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    router.refresh();
  }

  function release() {
    if (!requestId) return setErr("This report has no request to release against.");
    setErr(null);
    startTransition(async () => {
      const res = await releaseReport({ reportId, requestId });
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="border border-border bg-base-2 p-5 print:hidden">
      {/* Rail */}
      <div className="flex items-center gap-2 mb-5">
        {steps.map((s, i) => {
          const done = i < at;
          const here = i === at;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    done ? "bg-pos" : here ? "bg-blue" : "bg-gray-cool"
                  }`}
                />
                <span className="leading-tight">
                  <span
                    className={`block font-mono text-[10px] uppercase tracking-[0.12em] ${
                      done ? "text-pos-dark" : here ? "text-navy" : "text-gray-cool"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="block font-mono text-[9px] text-gray-cool">
                    {s.note}
                  </span>
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={`h-px flex-1 min-w-[16px] ${
                    i < at ? "bg-pos" : "bg-stone"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* What to do about it */}
      {stage === "released" ? (
        <p className="text-[14px] leading-[1.7] text-gray-warm">
          Out of the queue.{" "}
          {companyId ? (
            <>
              Filed under{" "}
              <Link
                href={`/admin/companies/${companyId}`}
                className="text-blue hover:underline"
              >
                {companyName || "the company"}
              </Link>
              .
            </>
          ) : (
            "It will file under the company once one is linked."
          )}
        </p>
      ) : (
        <>
          {blockers.length > 0 && (
            <div className="mb-4 border-l-2 border-caution pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-caution mb-1.5">
                Before it goes
              </p>
              <ul className="space-y-1">
                {blockers.map((b) => (
                  <li key={b} className="text-[13px] leading-[1.6] text-gray-warm">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {stage === "researched" && (
              <button
                onClick={review}
                disabled={busy}
                className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-40"
              >
                {busy ? "Marking…" : "Mark reviewed"}
              </button>
            )}

            {stage === "reviewed" &&
              (canRelease ? (
                <button
                  onClick={release}
                  disabled={pending}
                  className="relative overflow-hidden group px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-base disabled:opacity-40"
                >
                  <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
                  <span className="relative z-10">
                    {pending ? "Releasing…" : "Release & notify client"}
                  </span>
                </button>
              ) : (
                /*
                  Not a disabled button. An analyst can do everything up to this
                  line, and a greyed-out control they can never use reads as
                  something broken rather than as someone else's job.
                */
                <p className="text-[14px] leading-[1.7] text-gray-warm">
                  Ready for an admin or owner to release.
                </p>
              ))}

            {requestId && (
              <Link
                href={`/admin/requests/${requestId}`}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
              >
                Request, files & status →
              </Link>
            )}
          </div>
        </>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
