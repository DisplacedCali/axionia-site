"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eyebrow, Section, GradientRule } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { submitReportRequest } from "./actions";

type Stage = "details" | "code" | "done";

const INDUSTRIES = [
  "Light Manufacturing",
  "Professional Services",
  "Healthcare Services",
  "Retail & Hospitality",
  "Other",
];

const inputCls =
  "border border-border bg-white/50 px-4 py-3 font-sans text-[15px] focus:outline-none focus:border-navy transition-colors";
const labelCls =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";

export default function RequestReportPage() {
  const [stage, setStage] = useState<Stage>("details");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [employees, setEmployees] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [programs, setPrograms] = useState("");
  const [context, setContext] = useState("");

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    kind: "new" | "refresh";
    companyName: string | null;
  } | null>(null);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName, company_name: companyName },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setStage("code");
  }

  async function verifyAndSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (otpErr) {
      setLoading(false);
      return setError(otpErr.message);
    }

    const res = await submitReportRequest({ employees, industry, programs, context });
    setLoading(false);

    if (!res.ok) return setError(res.error);
    setResult({ kind: res.kind, companyName: res.companyName });
    setStage("done");
  }

  /* ─────────── confirmation ─────────── */
  if (stage === "done" && result) {
    const refresh = result.kind === "refresh";
    return (
      <Section className="max-w-2xl pt-28 pb-32">
        <Reveal>
          <Eyebrow>Request received</Eyebrow>
          <h1 className="font-serif font-light text-4xl md:text-5xl leading-tight">
            {refresh
              ? "We already have a pull for your company."
              : "Your report is in process."}
          </h1>
          <div className="mt-7">
            <GradientRule />
          </div>

          <div className="mt-8 space-y-5 text-[16px] leading-[1.75] text-gray-warm">
            {refresh ? (
              <>
                <p>
                  We&rsquo;ve previously run an analysis for{" "}
                  <strong className="text-navy">
                    {result.companyName || "your company"}
                  </strong>
                  . Rather than start from scratch, we&rsquo;re reviewing and updating
                  that existing work with anything that&rsquo;s changed.
                </p>
                <p className="text-navy">
                  You&rsquo;ll have the updated report by email{" "}
                  <strong>within 24 hours.</strong>
                </p>
              </>
            ) : (
              <>
                <p>
                  Your portfolio analysis is being prepared now. Every report is reviewed
                  by a person before it goes out, so this isn&rsquo;t instant.
                </p>
                <p className="text-navy">
                  You&rsquo;ll have it by email{" "}
                  <strong>within 24 hours.</strong>
                </p>
              </>
            )}
            <p>
              No call is required, and nothing else is needed from you in the meantime.
              We&rsquo;ve sent a confirmation to{" "}
              <strong className="text-navy">{email}</strong>.
            </p>
          </div>

          <div className="mt-10 border border-border p-6 bg-base-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-2">
              While you wait
            </p>
            <p className="text-[15px] leading-[1.7] text-gray-warm">
              You can explore the interactive version of the report on the{" "}
              <a href="/platform#report" className="text-blue underline">
                platform page
              </a>{" "}
              — same analysis, running on a composite profile.
            </p>
          </div>
        </Reveal>
      </Section>
    );
  }

  /* ─────────── form ─────────── */
  return (
    <Section className="max-w-2xl pt-28 pb-32">
      <Eyebrow>Free Portfolio Report</Eyebrow>
      <h1 className="font-serif font-light text-4xl md:text-5xl leading-tight mb-4">
        {stage === "details"
          ? "Tell us where to look."
          : "Check your email."}
      </h1>

      {stage === "details" && (
        <>
          <p className="text-[16px] leading-[1.7] text-gray-warm max-w-measure mb-10">
            A few details is all we need. No call, no commitment — the report comes back
            by email within 24 hours, reviewed by a person before it&rsquo;s sent.
          </p>

          <form onSubmit={requestCode} className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Full name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Company</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputCls}
              />
              <span className="text-[12px] text-gray-cool">
                Use your work address — we group reports by company so colleagues share
                the same analysis.
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-2">
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

            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Programs or vendors you&rsquo;d like looked at
              </label>
              <textarea
                rows={3}
                value={programs}
                onChange={(e) => setPrograms(e.target.value)}
                placeholder="e.g. virtual MSK program under review, PBM renewal in Q3"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Anything else worth knowing <span className="text-gray-cool">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && <p className="text-risk text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 justify-self-start relative overflow-hidden group px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-base disabled:opacity-50"
            >
              <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
              <span className="relative z-10">
                {loading ? "Sending code…" : "Request my free report"}
              </span>
            </button>

            <p className="text-[12px] leading-[1.6] text-gray-cool max-w-measure">
              We never collect member-level health information. Intake is aggregate only.
            </p>
          </form>
        </>
      )}

      {stage === "code" && (
        <form onSubmit={verifyAndSubmit} className="grid gap-5 max-w-sm">
          <p className="text-[15px] leading-[1.7] text-gray-warm">
            We sent a 6-digit code to <strong className="text-navy">{email}</strong>.
            Enter it to confirm your request.
          </p>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Code</label>
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="border border-border bg-white/50 px-4 py-3 font-mono tracking-[0.3em] text-lg focus:outline-none focus:border-navy transition-colors"
            />
          </div>
          {error && <p className="text-risk text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="justify-self-start relative overflow-hidden group px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-base disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
            <span className="relative z-10">
              {loading ? "Confirming…" : "Confirm request"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStage("details")}
            className="justify-self-start font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
          >
            ← Change details
          </button>
        </form>
      )}
    </Section>
  );
}
