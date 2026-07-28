"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole, assignUserCompany } from "@/app/admin/actions";

export default function UserRow({
  profile,
  companies,
  isSelf,
}: {
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    companyName: string | null;
    role: string;
    companyId: string | null;
  };
  companies: { id: string; label: string }[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isAdmin = profile.role === "admin";

  return (
    <div className="grid md:grid-cols-[1.5fr_1.3fr_1.2fr_0.8fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center">
      <span className="min-w-0">
        <span className="block text-[15px] text-navy truncate">
          {profile.fullName || "—"}
          {isSelf && (
            <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
              you
            </span>
          )}
        </span>
        <span className="block text-[12px] text-gray-cool truncate">
          {profile.email}
        </span>
      </span>

      <span className="text-[14px] text-gray-warm truncate">
        {profile.companyName || "—"}
      </span>

      <span>
        <select
          value={profile.companyId ?? ""}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              const res = await assignUserCompany(
                profile.id,
                e.target.value || null
              );
              if (!res.ok) setErr(res.error);
              else router.refresh();
            })
          }
          className="w-full border border-border bg-white/50 px-3 py-2 text-[13px] focus:outline-none focus:border-navy"
        >
          <option value="">Unassigned</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </span>

      <span className="md:text-right">
        <button
          disabled={pending || (isSelf && isAdmin)}
          onClick={() =>
            startTransition(async () => {
              const res = await setUserRole(profile.id, isAdmin ? "client" : "admin");
              if (!res.ok) setErr(res.error);
              else router.refresh();
            })
          }
          title={isSelf && isAdmin ? "You can't remove your own admin access" : ""}
          className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isAdmin
              ? "border-blue text-blue hover:bg-blue hover:text-base"
              : "border-border text-gray-warm hover:border-navy hover:text-navy"
          }`}
        >
          {isAdmin ? "Admin" : "Client"}
        </button>
        {err && <span className="block text-risk text-[11px] mt-1">{err}</span>}
      </span>
    </div>
  );
}
