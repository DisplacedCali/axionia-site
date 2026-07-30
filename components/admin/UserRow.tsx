"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole, assignUserCompany } from "@/app/admin/actions";
import type { Role } from "@/lib/auth";

/**
 * Four roles, ordered by privilege. The boundary that matters is between
 * analyst and admin: that's where releasing a report — the one action that
 * emails the client — becomes available.
 */
const ROLES: { id: Role; label: string; note: string }[] = [
  { id: "client", label: "Client", note: "Sees their own company's released reports" },
  { id: "analyst", label: "Analyst", note: "Runs research and edits — cannot release" },
  { id: "admin", label: "Admin", note: "Everything, including release" },
  { id: "owner", label: "Owner", note: "Everything, plus role assignment" },
];

export default function UserRow({
  profile,
  companies,
  isSelf,
  canEditRoles,
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
  canEditRoles: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isStaff = ["analyst", "admin", "owner"].includes(profile.role);

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
        {canEditRoles ? (
          <select
            value={profile.role}
            disabled={pending || (isSelf && profile.role === "owner")}
            onChange={(e) =>
              startTransition(async () => {
                const res = await setUserRole(profile.id, e.target.value as Role);
                if (!res.ok) setErr(res.error);
                else router.refresh();
              })
            }
            title={
              isSelf && profile.role === "owner"
                ? "You can't demote yourself"
                : ROLES.find((r) => r.id === profile.role)?.note
            }
            className={`w-full md:w-auto border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] bg-white/50 focus:outline-none focus:border-navy disabled:opacity-40 disabled:cursor-not-allowed ${
              isStaff ? "border-blue text-blue" : "border-border text-gray-warm"
            }`}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            title="Only the owner can change roles"
            className={`inline-block px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border ${
              isStaff ? "border-blue text-blue" : "border-border text-gray-warm"
            }`}
          >
            {ROLES.find((r) => r.id === profile.role)?.label ?? profile.role}
          </span>
        )}
        {err && <span className="block text-risk text-[11px] mt-1">{err}</span>}
      </span>
    </div>
  );
}
