"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAdminRequest } from "@/app/admin/actions";
import { lookupCompany } from "@/app/admin/research-actions";
import type { ValidateOutput } from "@/lib/modules/research/pipeline/types";

/**
 * Identify, then commit.
 *
 * ── What was wrong ──
 *
 * Identity was asserted three times. You guessed an industry from a five-option
 * dropdown; `validate` returned its own and overwrote yours; then the wave-1
 * gate stopped the run and asked you to correct the model. Two of those were
 * noise, and the correction came after a wave had been spent — the run that
 * placed Valtruis in Kansas City had already committed a call before anyone
 * could say otherwise.
 *
 * So the lookup moved to the front. One call, a few seconds, no job and no
 * database row. You confirm the identity while it is still free to be wrong,
 * and what you confirm is seeded into the run as fact.
 *
 * The industry dropdown is gone rather than expanded. It only ever existed to
 * guess at something the lookup determines, and more options would have meant
 * more ways to be overwritten.
 *
 * What stays manual is what no lookup can know: role groups, named programs,
 * which firm this belongs to, and why you're running it.
 */

type Firm = { id: string; name: string; kind: string };

const labelCls =
  "block font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-2";
const inputCls =
  "w-full border border-border bg-white/60 px-4 py-2.5 text-[15px] focus:outline-none focus:border-navy transition-colors";
const hintCls = "mt-2 text-[12px] leading-[1.6] text-gray-cool";

export default function NewResearchForm({ firms = [] }: { firms?: Firm[] }) {
  const router = useRouter();

  // phase 1
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [hint, setHint] = useState("");
  const [looking, setLooking] = useState(false);

  // phase 2 — seeded by the lookup, all editable
  const [identity, setIdentity] = useState<ValidateOutput | null>(null);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [hq, setHq] = useState("");
  const [size, setSize] = useState("");
  const [confirmedSite, setConfirmedSite] = useState("");
  const [description, setDescription] = useState("");

  const [domain, setDomain] = useState("");
  const [employees, setEmployees] = useState("");
  const [roleGroups, setRoleGroups] = useState("");
  const [programs, setPrograms] = useState("");
  const [firmName, setFirmName] = useState("");
  const [firmKind, setFirmKind] = useState<"investor" | "operator">("investor");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setLooking(true);
    setErr(null);
    const res = await lookupCompany({ companyName, website, hint });
    setLooking(false);
    if (!res.ok) return setErr(res.error);

    const i = res.identity;
    setIdentity(i);
    setName(i.name || companyName);
    setIndustry(i.industry ?? "");
    setHq(i.hq ?? "");
    setSize(i.size ?? "");
    setConfirmedSite(i.website ?? website);
    setDescription(i.description ?? "");
    // A headcount like "~50 employees" is the best default we have for covered
    // subscribers, but it is a different number — the billing one is usually
    // smaller. Seeded, and expected to be corrected.
    setEmployees((i.size ?? "").replace(/[^0-9]/g, ""));
    setDomain(
      (i.website ?? website)
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, ""),
    );
  }

  /** Skip the lookup — for a company the model won't know. */
  function byHand() {
    setIdentity({ name: companyName } as ValidateOutput);
    setName(companyName);
    setDomain(
      website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, ""),
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const res = await createAdminRequest({
      companyName: name,
      domain,
      employees,
      industry,
      roleGroups,
      programs,
      firmName,
      firmKind,
      notes,
      // What the run treats as settled. Only ever what was on screen when the
      // person pressed the button.
      identity: {
        ...(identity ?? {}),
        name,
        industry: industry || undefined,
        hq: hq || undefined,
        size: size || undefined,
        website: confirmedSite || undefined,
        description: description || undefined,
      },
    });

    setBusy(false);
    if (!res.ok) return setErr(res.error);
    router.push(`/admin/requests/${res.requestId}`);
  }

  /* ── phase 1 ── */
  if (!identity) {
    return (
      <form onSubmit={lookup} className="border border-border p-6 md:p-8 max-w-2xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-5">
          Step 1 — identify
        </div>

        <div className="grid gap-5">
          <div>
            <label className={labelCls}>Company name</label>
            <input
              required
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Valtruis"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Website (optional)</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="valtruis.com"
              className={inputCls}
            />
            <p className={hintCls}>
              The single best way to make sure we identify the right company.
            </p>
          </div>

          <div>
            <label className={labelCls}>Anything we should know (optional)</label>
            <textarea
              rows={2}
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="The Chicago value-based-care investor, not the Kansas City one. Backed by Welsh Carson."
              className={inputCls}
            />
            <p className={hintCls}>
              Treated as instructions that override the model&rsquo;s own
              assumptions, including about ownership. If you know something it
              is likely to get wrong, say it here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={looking || !companyName.trim()}
              className="px-6 py-3 border border-navy bg-navy text-base font-mono text-[10px] uppercase tracking-[0.14em] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {looking ? "Looking up…" : "Look up"}
            </button>
            <button
              type="button"
              onClick={byHand}
              disabled={!companyName.trim()}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy disabled:opacity-30 transition-colors"
            >
              Skip — enter it by hand
            </button>
          </div>
          <p className={hintCls}>
            One model call, a few seconds. Nothing is created until you confirm
            on the next screen.
          </p>
        </div>

        {err && <p className="mt-4 text-risk text-[13px]">{err}</p>}
      </form>
    );
  }

  /* ── phase 2 ── */
  const conf = identity.confidence;
  const own = identity.ownership;

  return (
    <form onSubmit={submit} className="border border-border p-6 md:p-8 max-w-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue">
          Step 2 — confirm what we found
        </span>
        <button
          type="button"
          onClick={() => setIdentity(null)}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hover:text-navy transition-colors"
        >
          Start over
        </button>
      </div>

      {conf && conf !== "high" && (
        <p className="mb-5 text-[13px] leading-[1.65] text-navy border border-caution/40 bg-amber-light px-4 py-3">
          Identification confidence is <strong>{conf}</strong>. Check the
          details below carefully — every remaining step reads them as fact.
        </p>
      )}

      <div className="grid gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Company name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Healthcare investment"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Headquarters</label>
            <input
              value={hq}
              onChange={(e) => setHq(e.target.value)}
              placeholder="Chicago, IL"
              className={inputCls}
            />
            <p className={hintCls}>
              Drives which state mandates are analysed. Worth getting right.
            </p>
          </div>
          <div>
            <label className={labelCls}>Email domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="valtruis.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>What they do</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
          <p className={hintCls}>
            {own
              ? `Ownership identified as ${own}. Remove it if that's wrong — nine steps will treat it as fact.`
              : "Ownership was not established, which is the correct answer when it isn't known. Add it only if you're sure."}
          </p>
        </div>

        <div className="border-t border-border pt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-4">
            What the lookup can&rsquo;t know
          </div>

          <div className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Covered subscribers</label>
                <input
                  type="number"
                  min={1}
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className={inputCls}
                />
                <p className={hintCls}>
                  Seeded from headcount{size ? ` (${size})` : ""}. The covered
                  number is usually smaller.
                </p>
              </div>
              <div>
                <label className={labelCls}>Firm or portfolio (optional)</label>
                <input
                  list="firm-names"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Valtruis"
                  className={inputCls}
                />
                <datalist id="firm-names">
                  {firms.map((f) => (
                    <option key={f.id} value={f.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {firmName.trim() && (
              <div>
                <label className={labelCls}>Firm type</label>
                <select
                  value={firmKind}
                  onChange={(e) =>
                    setFirmKind(e.target.value as "investor" | "operator")
                  }
                  className={inputCls}
                >
                  <option value="investor">
                    Investor — influences many buyers, signs for none
                  </option>
                  <option value="operator">
                    Operator — is the buyer across its entities
                  </option>
                </select>
                <p className={hintCls}>
                  Only applied when creating a new firm. Consolidation advice is
                  only sensible for an operator.
                </p>
              </div>
            )}

            <div>
              <label className={labelCls}>Largest role groups</label>
              <input
                value={roleGroups}
                onChange={(e) => setRoleGroups(e.target.value)}
                placeholder="investment principals, portfolio operations, finance, admin"
                className={inputCls}
              />
              <p className={hintCls}>
                The most useful thing on this form. Treated as authoritative and
                weighted above the industry — a sector label alone only ever
                produces a default mix.
              </p>
            </div>

            <div>
              <label className={labelCls}>Programs or vendors to examine</label>
              <input
                value={programs}
                onChange={(e) => setPrograms(e.target.value)}
                placeholder="Hinge Health, Lyra, GLP-1 coverage"
                className={inputCls}
              />
              <p className={hintCls}>
                Answered directly in the analysis, and kept out of the suggested
                mix — ranking a decision someone already made, without seeing
                what it costs them, isn&rsquo;t a call we&rsquo;ve earned.
              </p>
            </div>

            <div>
              <label className={labelCls}>Why you&rsquo;re running this — internal</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Prospect prep ahead of intro call · seeding benchmark library"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="px-7 py-3.5 bg-axionia-gradient text-base font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 transition-opacity"
          >
            {busy ? "Creating…" : "Create research request"}
          </button>
          <p className={hintCls}>
            No email is sent. What you confirmed above is treated as settled, so
            the run skips its own identification step and won&rsquo;t stop to
            ask again.
          </p>
        </div>
      </div>

      {err && <p className="mt-4 text-risk text-[13px]">{err}</p>}
    </form>
  );
}
