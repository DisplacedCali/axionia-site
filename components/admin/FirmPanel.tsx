"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCompanyFirm } from "@/app/admin/companies/actions";

/**
 * Which firm this company sits under.
 *
 * Compact by design — for most companies the answer is "none" and that's a
 * normal state, so this shouldn't occupy the same visual weight as the brief
 * or the steps. It expands only when you go looking for it.
 */
export default function FirmPanel({
  companyId,
  firmName,
  firmKind,
  firms,
}: {
  companyId: string;
  firmName: string | null;
  firmKind: string | null;
  firms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(firmName ?? "");
  const [kind, setKind] = useState<"investor" | "operator">(
    firmKind === "operator" ? "operator" : "investor",
  );
  const [err, setErr] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      setErr(null);
      const res = await setCompanyFirm(companyId, draft, kind);
      if (!res.ok) return setErr(res.error);
      setOpen(false);
      router.refresh();
    });

  return (
    <div className="border border-border px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Firm
        </span>

        {firmName ? (
          <>
            <Link
              href="/admin/firms"
              className="text-[15px] text-navy hover:underline"
            >
              {firmName}
            </Link>
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                firmKind === "operator" ? "text-pos" : "text-blue"
              }`}
            >
              {firmKind === "operator" ? "operator · is the buyer" : "investor"}
            </span>
          </>
        ) : (
          <span className="text-[14px] text-gray-cool">Standalone employer</span>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
        >
          {open ? "Cancel" : firmName ? "Change" : "Group under a firm"}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-[1.6fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-1.5">
              Firm name — blank to detach
            </label>
            <input
              list="company-firm-names"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Valtruis"
              className="w-full border border-border bg-white/50 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors"
            />
            <datalist id="company-firm-names">
              {firms.map((f) => (
                <option key={f.id} value={f.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-1.5">
              Type — new firms only
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "investor" | "operator")}
              className="w-full border border-border bg-white/50 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors"
            >
              <option value="investor">Investor</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button
            onClick={save}
            disabled={pending}
            className="px-4 py-2 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {pending ? "Saving" : "Save"}
          </button>
        </div>
      )}

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
