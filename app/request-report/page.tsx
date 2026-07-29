"use client";

import { useState, useRef, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { readableAuthError } from "@/lib/authError";
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
    requestId: string;
    needsValidation: boolean;
  } | null>(null);

  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadDocs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !result) return;

    setUploading(true);
    setUploadErr(null);

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requestId", result.requestId);
      const res = await fetch("/api/intake/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setUploaded((u) => [...u, file.name]);
      else setUploadErr(body?.error ?? "That upload failed.");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

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
    if (error) {
      console.error("[auth] signInWithOtp failed:", error);
      return setError(readableAuthError(error).message);
    }
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
      console.error("[auth] verifyOtp failed:", otpErr);
      return setError(readableAuthError(otpErr).message);
    }

    const res = await submitReportRequest({ employees, industry, programs, context });
    setLoading(false);

    if (!res.ok) return setError(res.error);
    setResult({
      kind: res.kind,
      companyName: res.companyName,
      requestId: res.requestId,
      needsValidation: res.needsValidation,
    });
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

          {result.needsValidation && (
            <div className="mt-8 bg-amber-light border-l-2 border-caution p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution mb-2">
                One verification step
              </p>
              <p className="text-[15px] leading-[1.7] text-navy">
                The company you asked us to look at doesn&rsquo;t appear to match your
                email domain. That&rsquo;s often perfectly legitimate — a holding
                company, a recent rebrand, a shared services address — so we simply
                confirm the relationship before starting work.
              </p>
              <p className="mt-3 text-[14px] leading-[1.7] text-gray-warm">
                We&rsquo;ll reply to <strong className="text-navy">{email}</strong> to
                confirm your affiliation. Axionia reserves the right to restrict
                research where a requester&rsquo;s alignment with the subject
                organization can&rsquo;t be established — we don&rsquo;t run
                competitive intelligence on employers for third parties.
              </p>
            </div>
          )}

          {/* ── document intake ── */}
          <div className="mt-10 border border-navy p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[3px] bg-axionia-gradient" />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy mb-2">
              Optional — makes your report considerably better
            </p>
            <h2 className="font-serif text-2xl leading-snug mb-3">
              Send us what you already have.
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-warm mb-5">
              Vendor decks, renewal packets, benefit summaries, the ROI study a vendor
              handed you. Most of what we need is already sitting in your inbox — you
              don&rsquo;t need to assemble anything. The more we start from, the less
              we have to assume.
            </p>

            {uploaded.length > 0 && (
              <ul className="mb-4 space-y-1.5">
                {uploaded.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-[13px] text-gray-warm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pos shrink-0" />
                    <span className="truncate">{f}</span>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={uploadDocs}
              disabled={uploading}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
              className="block w-full text-[13px] text-gray-warm file:mr-4 file:px-4 file:py-2.5 file:border file:border-navy file:bg-base file:font-mono file:text-[10px] file:uppercase file:tracking-[0.12em] file:text-navy hover:file:bg-navy hover:file:text-base file:transition-colors"
            />

            {uploading && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-blue">
                Uploading…
              </p>
            )}
            {uploadErr && <p className="mt-3 text-risk text-[13px]">{uploadErr}</p>}

            <p className="mt-4 text-[12px] leading-[1.6] text-gray-cool">
              PDF, PowerPoint, Word or images, up to 25 MB each. Stored privately and
              visible only to us and your colleagues.{" "}
              <strong className="text-gray-warm">
                Please don&rsquo;t send member-level claims data or anything containing
                personal health information
              </strong>{" "}
              — we don&rsquo;t accept it through this channel by design. If you want a
              claims-level analysis, say so and we&rsquo;ll set up a secure path
              separately.
            </p>
          </div>

          <div className="mt-6 border border-border p-6 bg-base-2">
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
            <p className="text-[12px] leading-[1.6] text-gray-cool max-w-measure">
              We analyse benefit programs for the employers who run them. Where a
              requester&rsquo;s alignment with the company named above can&rsquo;t be
              established, we&rsquo;ll confirm the relationship first — and Axionia
              reserves the right to restrict research on that basis.
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
