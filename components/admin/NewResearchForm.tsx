"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAdminRequest } from "@/app/admin/actions";

const INDUSTRIES = [
  "Light Manufacturing",
  "Professional Services",
  "Healthcare Services",
  "Retail & Hospitality",
  "Other",
];

const labelCls =
  "block font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-2";
const inputCls =
  "w-full border border-border bg-white/60 px-4 py-2.5 text-[15px] focus:outline-none focus:border-navy transition-colors";

export default function NewResearchForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [employees, setEmployees] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const res = await createAdminRequest({
      companyName,
      domain,
      employees,
      industry,
      notes,
    });

    setBusy(false);
    if (!res.ok) return setErr(res.error);
    router.push(`/admin/requests/${res.requestId}`);
  }

  return (
    <form onSubmit={submit} className="border border-border p-6 md:p-8 max-w-2xl">
      <div className="grid gap-5">
        <div>
          <label className={labelCls}>Company name</label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Meridian Manufacturing"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            Email domain <span className="text-gray-cool">(optional)</span>
          </label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="meridian-mfg.com"
            className={inputCls}
          />
          <p className="mt-2 text-[12px] leading-[1.6] text-gray-cool">
            Worth adding if you know it — when someone from this company later signs
            up with a matching address, the released report becomes visible to them
            automatically. Without it we create an internal placeholder folder.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Covered subscribers</label>
            <input
              type="number"
              min={1}
              value={employees}
              onChange={(e) => setEmployees(e.target.value)}
              placeholder="820"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Workforce profile</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputCls}
            >
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Why you&rsquo;re running this — internal</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Prospect prep ahead of intro call · seeding benchmark library · testing the pipeline"
            className={inputCls}
          />
        </div>

        {err && <p className="text-risk text-[14px]">{err}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="relative overflow-hidden group px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-base disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
            <span className="relative z-10">
              {busy ? "Creating…" : "Create research request"}
            </span>
          </button>
          <p className="text-[12px] leading-[1.6] text-gray-cool">
            No email is sent. Output lands in the company folder.
          </p>
        </div>
      </div>
    </form>
  );
}
