"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { readableAuthError } from "@/lib/authError";
import { Eyebrow, Section } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // shouldCreateUser: false — login only creates a code for existing accounts.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      const { message, noAccount } = readableAuthError(error);
      // Full object to the console — the UI copy stays human.
      console.error("[auth] signInWithOtp failed:", error);
      setError(message);
      setNeedsSignup(noAccount);
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
      console.error("[auth] verifyOtp failed:", error);
      setError(readableAuthError(error).message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Section className="max-w-md pt-24">
      <Eyebrow>Client Login</Eyebrow>
      <h1 className="font-serif font-light text-4xl mb-8">Welcome back.</h1>

      {stage === "email" && (
        <form onSubmit={requestCode} className="flex flex-col gap-4">
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-border bg-white/40 px-4 py-3 font-sans"
            placeholder="you@company.com"
          />
          {error && (
            <div className="text-sm">
              <p className="text-risk">{error}</p>
              {needsSignup && (
                <a
                  href="/request-report"
                  className="inline-block mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-blue underline"
                >
                  Create an account →
                </a>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Send login code"}
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <p className="text-[14px] text-gray-warm">
            We sent a code to <strong>{email}</strong>. It expires shortly, so
            enter it as soon as it arrives.
          </p>
          <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="border border-border bg-white/40 px-4 py-3 font-mono tracking-[0.3em] text-lg"
            placeholder="Paste or type the code"
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
        No account yet?{" "}
        <a href="/signup" className="underline">
          Sign up
        </a>
        .
      </p>
    </Section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
