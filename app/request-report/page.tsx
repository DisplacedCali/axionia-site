"use client";

import { useState, useRef, Suspense, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { turnstileEnabled } from "@/components/Turnstile";
import { readableAuthError } from "@/lib/authError";
import { Eyebrow, Section, GradientRule, GhostButton } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { submitReportRequest } from "./actions";

type Stage = "details" | "code" | "done";

/** Minimal shape of what useSearchParams returns — avoids importing the type. */
type Params = { get(key: string): string | null };

/*
  Do not state the code's length in copy or in a placeholder.
  It said "6-digit" on three pages while Supabase was sending eight, so a
  requester counted the digits at the last step before conversion and paused.
  The length is a Supabase dashboard setting, not something this build can
  read, so any number written here is a guess that drifts silently the moment
  someone changes it. The input strips non-digits instead, which is what a code
  pasted out of an email actually needs.
*/

/**
 * Three questions added 2026-08-27. Each is an input the client-facing
 * portfolio score needs and could not previously answer — contract leverage,
 * access equity, value verification — and each is independently one of the
 * best sales qualifiers on the form. A company with two renewals inside twelve
 * months and nothing independently verified is the ideal prospect, and until
 * now there was no way to see one.
 *
 * Buttons rather than text, because three more typed fields on a form someone
 * is filling in to get something free is how completion dies. One tap each.
 *
 * "Not sure" is a real option and not a cop-out. A benefits leader who does not
 * know their own renewal calendar is telling us something true, and forcing a
 * guess would put a fabricated answer into a record we later model from.
 */
const QUICK: {
  key: "renewals" | "shifts" | "verified";
  label: string;
  help: string;
  options: { v: string; l: string }[];
}[] = [
  {
    key: "renewals",
    label: "Contracts up for renewal in the next 12 months",
    help: "Renewal timing is leverage. It decides what can be acted on now rather than next year.",
    options: [
      { v: "none", l: "None" },
      { v: "one", l: "One" },
      { v: "two_plus", l: "Two or more" },
      { v: "unsure", l: "Not sure" },
    ],
  },
  {
    key: "shifts",
    label: "Does your workforce run shifts?",
    help: "A program the second shift can't reach is worth a fraction of what it costs, and nothing in a benchmark shows that.",
    options: [
      { v: "day_only", l: "Day shift only" },
      { v: "multiple", l: "Multiple shifts" },
      { v: "varies", l: "Mixed / varies by site" },
      { v: "unsure", l: "Not sure" },
    ],
  },
  {
    key: "verified",
    label: "Has any of it been independently checked?",
    help: "Not by the vendor, and not by whoever recommended it. Most answers here are \u201cnone\u201d, which is the point.",
    options: [
      { v: "none", l: "None of it" },
      { v: "some", l: "Some" },
      { v: "all", l: "All of it" },
      { v: "unsure", l: "Not sure" },
    ],
  },
];

/**
 * Carry the interactive report's configuration into this form.
 *
 * A visitor who has set headcount, workforce profile, engagement, a program
 * count and their vendor's claim on /platform has already told us most of what
 * this form asks, and then hit a dead end. Three of those five have no field
 * here at all — the vendor's own claim, how many point solutions are in place,
 * and the engagement rate they thought reasonable — and all three are lead
 * intelligence we do not otherwise collect.
 *
 * They arrive as a sentence the requester can read and edit rather than as a
 * query string pasted into a box. Anything they disagree with, they change.
 *
 * Industry is deliberately NOT carried. The demo's four workforce profiles are
 * a different taxonomy from this form's industry list and are scheduled for
 * deletion under Track F; mapping between them would be building a bridge to
 * something already marked for demolition. See docs/EXPOSURE_MODEL.md.
 */
function digits(v: string | null, max: number): string {
  if (!v) return "";
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 && n <= max ? String(n) : "";
}

function demoContext(p: Params): string {
  if (p.get("from") !== "demo") return "";
  const programs = digits(p.get("programs"), 8);
  const claim = digits(p.get("claim"), 500);
  const engagement = digits(p.get("engagement"), 100);

  const bits: string[] = [];
  if (programs)
    bits.push(`${programs} point solution${programs === "1" ? "" : "s"} in place`);
  if (claim) bits.push(`a vendor claiming $${claim} PMPM in savings`);
  if (engagement) bits.push(`modelled at ${engagement}% engagement`);
  if (!bits.length) return "";

  return `From the interactive report: ${bits.join(", ")}.`;
}

/**
 * Grouped to stay scannable past eight options, and worded to match the
 * branches in `getSegmentsForIndustry` — the old five-option list could only
 * ever reach four of its nine branches, so dental, home care, hospital, tech,
 * logistics and education were unreachable from the free form. The data spine
 * was already richer than the question being asked.
 *
 * Labels are what the employer would call themselves, not our taxonomy. The
 * matcher reads them by word, so "Dental / DSO" and "Hospital / Health System"
 * both land correctly without the visitor learning our vocabulary.
 */
const INDUSTRY_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "Healthcare",
    options: [
      "Dental / DSO",
      "Physician / Surgical Practice",
      "Hospital / Health System",
      "Behavioral Health / Therapy",
      "Home Care / Hospice",
      "Pharmacy / Other Healthcare",
    ],
  },
  {
    label: "Professional",
    options: [
      "Professional Services / Consulting",
      "Financial Services / Insurance",
      "Legal / Accounting",
      "Software / Technology",
    ],
  },
  {
    label: "Industrial",
    options: [
      "Light Manufacturing",
      "Heavy Manufacturing / Industrial",
      "Logistics & Distribution",
      "Construction / Skilled Trades",
      "Utilities",
    ],
  },
  {
    label: "Consumer",
    options: ["Retail", "Hospitality / Restaurants", "Grocery / Food Service"],
  },
  {
    label: "Public & Social",
    options: ["Education", "Nonprofit / Social Services", "Government / Municipal"],
  },
  { label: "Other", options: ["Other"] },
];

const DEFAULT_INDUSTRY = "Professional Services / Consulting";

/**
 * The optional detail step.
 *
 * Two things are being balanced and they pull opposite ways: a benchmark needs
 * structured records, and a free report needs to stay cheap to ask for. So this
 * is collapsed by default and never blocks submission — the ask is framed as
 * what it buys THEM, because that framing is also the true one. A portfolio we
 * can see is a portfolio we can score specifically instead of directionally.
 *
 * Program categories are checkboxes rather than free text on purpose. One click
 * each, and the result is comparable across employers — a paragraph describing
 * the same programs is worth far less to a benchmark and no more to the
 * analysis.
 *
 * Census is deliberately NOT here. Naming it invites a file containing names
 * and dates of birth, which is exactly the data the intake is designed never to
 * receive — see the PHI firewall note on /privacy. Counts by tier give the
 * analytical value without the liability.
 */
const PROGRAM_CATEGORIES = [
  "Medical / health plan",
  "Pharmacy / PBM",
  "Dental & vision",
  "Mental health / EAP",
  "MSK",
  "Diabetes / metabolic",
  "GLP-1 / weight management",
  "Fertility & family building",
  "Menopause / women's health",
  "Childcare / backup care",
  "Navigation / advocacy",
  "Primary care / DPC",
  "Telehealth",
  "Financial wellness",
  "Disability & leave",
  "Wellness / lifestyle account",
];

const FUNDING = [
  "Self-funded",
  "Level-funded",
  "Fully insured",
  "Not sure",
];

const inputCls =
  "border border-border bg-white/50 px-4 py-3 font-sans text-[15px] focus:outline-none focus:border-navy transition-colors";
const labelCls =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm";

function RequestReportForm() {
  const params = useSearchParams();
  const fromDemo = params.get("from") === "demo";

  const [stage, setStage] = useState<Stage>("details");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  /** Whose benefit stack this is. See the control in the details form. */
  const [subject, setSubject] = useState<"own" | "portfolio">("own");
  const [email, setEmail] = useState("");
  const [employees, setEmployees] = useState(() => digits(params.get("employees"), 5_000_000));
  const [industry, setIndustry] = useState(DEFAULT_INDUSTRY);
  /*
    Role groups, not a workforce taxonomy. `matchSegmentToLibrary` already maps
    13 role types to segments with dimension inference, so the useful question
    is the one whose answer it can already read. Asking the employer to place
    themselves in our segment model instead would make them do the work the
    library exists to do.
  */
  const [roleGroups, setRoleGroups] = useState("");

  /* See QUICK. Empty string means unanswered, which is distinct from "unsure". */
  const [quick, setQuick] = useState<Record<string, string>>({});

  /* Optional detail — see PROGRAM_CATEGORIES. None of this gates submission. */
  const [detailOpen, setDetailOpen] = useState(false);
  const [funding, setFunding] = useState("");
  const [states, setStates] = useState("");
  const [tiers, setTiers] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [vendors, setVendors] = useState("");
  const [carriers, setCarriers] = useState("");

  const [programs, setPrograms] = useState("");
  const [context, setContext] = useState(() => demoContext(params));

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /*
    Turnstile token. Required only when a site key is configured — see the
    component. Supabase verifies it server-side; sending it from the client is
    not the check, it is what allows the check to happen.
  */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
        captchaToken: captchaToken ?? undefined,
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

    const res = await submitReportRequest({
      subject,
      employees,
      industry,
      roleGroups,
      quick: Object.keys(quick).length ? quick : undefined,
      programs,
      context,
      portfolio: {
        funding,
        states,
        tiers,
        categories,
        vendors,
        carriers,
      },
    });
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
            <div className="mt-8 border border-navy p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[3px] bg-axionia-gradient" />
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy mb-2">
                Looks like third-party research
              </p>
              <h2 className="font-serif text-2xl leading-snug mb-3">
                Happy to do this — it&rsquo;s just a different engagement.
              </h2>
              <p className="text-[15px] leading-[1.7] text-gray-warm">
                <strong className="text-navy">
                  {result.companyName || "The company you named"}
                </strong>{" "}
                doesn&rsquo;t appear to be your own employer. The free report covers
                the programs you actually run — that&rsquo;s who it&rsquo;s built for
                and how we keep it free.
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-gray-warm">
                Research on another organisation is something we do well and are glad
                to take on — competitive benchmarking, diligence ahead of an
                acquisition, or a broker or consultant preparing for a client
                conversation. It&rsquo;s a paid engagement, scoped to what you&rsquo;re
                trying to learn.
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-gray-warm">
                We&rsquo;ll reply to <strong className="text-navy">{email}</strong>{" "}
                either way. If we&rsquo;ve read this wrong and it is your own
                organisation — a holding company, a recent rebrand, a shared services
                address — just say so and we&rsquo;ll run it as normal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <GhostButton href="/contact?interest=third-party-research">
                  Tell us what you&rsquo;re trying to learn
                </GhostButton>
                <a
                  href="/research"
                  className="inline-flex items-center px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-blue hover:underline"
                >
                  How research engagements work →
                </a>
              </div>
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
          <p className="text-[16px] leading-[1.7] text-gray-warm max-w-measure mb-6">
            A few details is all we need. No call, no commitment — the report comes back
            by email within 24 hours, reviewed by a person before it&rsquo;s sent.
          </p>

          {fromDemo && (
            <div className="mb-10 border-l-2 border-blue pl-5 py-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-1.5">
                Carried over from the interactive report
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm max-w-measure">
                What you set on the platform page is filled in below. Change
                anything that isn&rsquo;t right — none of it is locked.
              </p>
            </div>
          )}

          <form onSubmit={requestCode} className="grid gap-5">
            {/* ── who the report is about ──
                Companies are resolved from the requester's email domain, so
                without this question an investor or a rollup CFO gets a report
                on their own head office. Valtruis is about thirty people in
                Chicago; the seventeen businesses they care about share none of
                their domain. Answering "portfolio" is what stops the pipeline
                confidently analysing the wrong entity. */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>This report is about</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {(
                  [
                    ["own", "The company I work for"],
                    ["portfolio", "Companies I invest in or operate"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={subject === k}
                    onClick={() => setSubject(k)}
                    className={`px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                      subject === k
                        ? "border-navy bg-navy text-base"
                        : "border-border text-gray-warm hover:border-navy"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {subject === "portfolio" && (
                <span className="text-[12px] leading-[1.6] text-gray-cool">
                  We&rsquo;ll scope the list with you rather than guess it —
                  tell us the firm below and we&rsquo;ll come back to agree
                  which businesses are in scope before anything runs.
                </span>
              )}
            </div>

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
                <label className={labelCls}>
                  {subject === "portfolio" ? "Firm or group" : "Company"}
                </label>
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
                <label className={labelCls}>Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={inputCls}
                >
                  {INDUSTRY_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((i) => (
                        <option key={i}>{i}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/*
              The one workforce question on the free form. Industry gives a
              default segment mix; this gives THIS employer's. Two professional
              services firms of the same size can be 90% consultants or 60%
              back office, and the benefit economics diverge completely.

              Optional on purpose — it's the field most likely to make someone
              abandon a form they're filling in to get something free.
            */}
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Your largest role groups{" "}
                <span className="text-gray-cool">(optional)</span>
              </label>
              <input
                value={roleGroups}
                onChange={(e) => setRoleGroups(e.target.value)}
                placeholder="e.g. hygienists, dental assistants, front office"
                className={inputCls}
              />
              <p className="text-[12px] leading-[1.6] text-gray-warm">
                Two or three is plenty. This is what lets us model your actual
                workforce rather than your industry&rsquo;s average.
              </p>
            </div>

            {/* ── three taps, see QUICK ── */}
            {QUICK.map((q) => (
              <div key={q.key} className="flex flex-col gap-2">
                <span className={labelCls}>
                  {q.label} <span className="text-gray-cool">(optional)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((o) => {
                    const on = quick[q.key] === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setQuick((s) => ({
                            ...s,
                            [q.key]: on ? "" : o.v,
                          }))
                        }
                        className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                          on
                            ? "border-navy bg-navy text-base"
                            : "border-border text-gray-warm hover:border-navy"
                        }`}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[12px] leading-[1.6] text-gray-warm">{q.help}</p>
              </div>
            ))}

            {/* ── Optional detail ─────────────────────────────────── */}
            <div className="border border-border bg-white/40">
              <button
                type="button"
                onClick={() => setDetailOpen((o) => !o)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
              >
                <span>
                  <span className="block text-[15px] leading-[1.5] text-navy">
                    Make this specific to you{" "}
                    <span className="text-gray-cool">(optional)</span>
                  </span>
                  <span className="block mt-1 text-[13px] leading-[1.6] text-gray-warm max-w-measure">
                    Tell us a little more about your benefit mix and we&rsquo;ll
                    score your actual portfolio rather than your industry&rsquo;s
                    average. Two minutes, and it changes the report from
                    directional to specific.
                  </span>
                </span>
                <span className="font-mono text-[18px] leading-none text-gray-cool shrink-0 mt-1">
                  {detailOpen ? "−" : "+"}
                </span>
              </button>

              {detailOpen && (
                <div className="px-5 pb-5 pt-1 flex flex-col gap-5 border-t border-border">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={labelCls}>How the plan is funded</label>
                      <select
                        value={funding}
                        onChange={(e) => setFunding(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select</option>
                        {FUNDING.map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={labelCls}>States of operation</label>
                      <input
                        value={states}
                        onChange={(e) => setStates(e.target.value)}
                        placeholder="MN, WI, IL"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelCls}>
                      Covered lives by tier{" "}
                      <span className="text-gray-cool">(roughly is fine)</span>
                    </label>
                    <input
                      value={tiers}
                      onChange={(e) => setTiers(e.target.value)}
                      placeholder="e.g. 480 employee-only, 210 employee + family"
                      className={inputCls}
                    />
                    <p className="text-[12px] leading-[1.6] text-gray-warm">
                      Counts only. Please don&rsquo;t send a census file —
                      we&rsquo;re built not to hold member-level data, and
                      we&rsquo;d have to delete it.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelCls}>What you run today</label>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 mt-1">
                      {PROGRAM_CATEGORIES.map((c) => (
                        <label
                          key={c}
                          className="flex items-center gap-2.5 text-[14px] text-gray-warm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={categories.includes(c)}
                            onChange={(e) =>
                              setCategories((p) =>
                                e.target.checked
                                  ? [...p, c]
                                  : p.filter((x) => x !== c),
                              )
                            }
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={labelCls}>Vendors, if you know them</label>
                      <input
                        value={vendors}
                        onChange={(e) => setVendors(e.target.value)}
                        placeholder="Hinge, Lyra, Progyny…"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={labelCls}>Carrier or TPA</label>
                      <input
                        value={carriers}
                        onChange={(e) => setCarriers(e.target.value)}
                        placeholder="Optional"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <p className="text-[12px] leading-[1.65] text-gray-warm max-w-measure">
                    None of this is ever disclosed or referenced in material that
                    isn&rsquo;t for you. We use it in aggregate for benchmarking
                    — patterns across many employers, never a name.{" "}
                    <a href="/privacy" className="text-blue hover:underline">
                      How we handle your data
                    </a>
                    .
                  </p>
                </div>
              )}
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

            <Turnstile onToken={setCaptchaToken} action="request-report" />

            {error && <p className="text-risk text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || (turnstileEnabled() && !captchaToken)}
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
              The free report covers your own organisation&rsquo;s benefit programs.
              Researching a company you don&rsquo;t work for — benchmarking a
              competitor, diligence on an acquisition, client work — is something we
              also do, as a paid engagement. Submit either way and we&rsquo;ll come
              back with scope.
            </p>
          </form>
        </>
      )}

      {stage === "code" && (
        <form onSubmit={verifyAndSubmit} className="grid gap-5 max-w-sm">
          <p className="text-[15px] leading-[1.7] text-gray-warm">
            We sent a code to <strong className="text-navy">{email}</strong>.
            Enter it to confirm your request.
          </p>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Code</label>
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Paste or type the code"
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

/**
 * useSearchParams needs a Suspense boundary or the static render fails at
 * build. The fallback is deliberately empty rather than a spinner: this
 * resolves immediately on the client, and a flash of loading chrome on a form
 * that is about to appear reads worse than nothing at all.
 */
export default function RequestReportPage() {
  return (
    <Suspense fallback={null}>
      <RequestReportForm />
    </Suspense>
  );
}
