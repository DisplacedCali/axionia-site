"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkRequestToCompany } from "@/app/admin/actions";

/**
 * File a finished report under a company.
 *
 * Appears only when a request has no company. Defaults are seeded from what the
 * research established — official name and confirmed website — rather than from
 * whatever was typed before the run, because by now the pipeline knows better
 * and retyping is how a near-duplicate company row gets created.
 */
export default function LinkCompany({
  requestId,
  suggestedName,
  suggestedDomain,
}: {
  requestId: string;
  suggestedName: string;
  suggestedDomain: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(suggestedName);
  const [domain, setDomain] = useState(suggestedDomain);
  const [err, setErr] = useState<string | null>(null);

  const save = () =>
    start(async () => {
      setErr(null);
      const res = await linkRequestToCompany({ requestId, companyName: name, domain });
      if (!res.ok) return setErr(res.error);
      router.push(`/admin/companies/${res.companyId}`);
    });

  const input =
    "w-full border border-border bg-white/60 px-3 py-2 text-[14px] focus:outline-none focus:border-navy transition-colors";
  const label =
    "block font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-1.5";

  return (
    <div className="border border-caution/40 bg-amber-light px-6 py-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution-dark mb-2">
        Not filed under a company
      </div>
      <p className="text-[14px] leading-[1.7] text-navy max-w-measure mb-4">
        This report isn&rsquo;t attached to anything, so it won&rsquo;t appear on
        a company hub and nobody signing up from this domain will ever see it.
        The details below are what the research identified — correct them if
        they&rsquo;re wrong.
      </p>

      <div className="grid sm:grid-cols-[1.4fr_1fr_auto] gap-3 items-end">
        <div>
          <label className={label}>Company name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>Email domain</label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className={input}
          />
        </div>
        <button
          onClick={save}
          disabled={pending || !name.trim()}
          className="px-4 py-2 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.12em] hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {pending ? "Linking" : "Link company"}
        </button>
      </div>

      <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
        An existing company with this domain is reused rather than duplicated,
        and a merged one resolves to whichever row survived.
      </p>

      {err && <p className="mt-3 text-risk text-[13px]">{err}</p>}
    </div>
  );
}
