"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { turnstileEnabled } from "@/components/Turnstile";
import { Eyebrow, Section } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"details" | "code">("details");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /*
    Turnstile token. Required only when a site key is configured — see the
    component. Supabase verifies it server-side; sending it from the client is
    not the check, it is what allows the check to happen.
  */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);


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
      setError(error.message);
      return;
    }
    setStage("code");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Section className="max-w-md pt-24">
      <Eyebrow>Create an Account</Eyebrow>
      <h1 className="font-serif font-light text-4xl mb-8">Start with the free scorer.</h1>

      {stage === "details" && (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Full name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-border bg-white/40 px-4 py-3 font-sans"
          />
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Company
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="border border-border bg-white/40 px-4 py-3 font-sans"
          />
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Work email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border bg-white/40 px-4 py-3 font-sans"
            placeholder="you@company.com"
          />
          <Turnstile onToken={setCaptchaToken} action="signup" />
          {error && <p className="text-risk text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || (turnstileEnabled() && !captchaToken)}
            className="mt-2 px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Send signup code"}
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <p className="text-[14px] text-gray-warm">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-border bg-white/40 px-4 py-3 font-mono tracking-[0.3em] text-lg"
            placeholder="000000"
          />
          {error && <p className="text-risk text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
      )}

      <p className="mt-8 text-[13px] text-gray-warm">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Log in
        </a>
        .
      </p>
    </Section>
  );
}
