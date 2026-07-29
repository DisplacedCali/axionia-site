"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * The low-commitment path. Before this, the only two actions on the site were
 * "hand over your work email and company" or "contact us" — nothing for
 * someone interested but not ready, who then leaves and doesn't return.
 */
export default function Subscribe({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.trim().toLowerCase(), source });

    if (error) {
      // A duplicate is a success from the reader's point of view.
      if (error.code === "23505") {
        setState("done");
        return;
      }
      setError("Couldn't sign you up just now — try again shortly.");
      setState("error");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <p className="text-[13px] leading-[1.6] text-gray-warm">
        You&rsquo;re on the list. Roughly monthly, and nothing else — we don&rsquo;t
        share the list or sell anything through it.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm">
      <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-2">
        The monthly note
      </label>
      <p className="text-[13px] leading-[1.6] text-gray-warm mb-3">
        One piece of independent analysis a month — how a vendor claim held up, what
        moved in the market, what we got wrong. No pitch.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 min-w-0 border border-border bg-white/50 px-3 py-2.5 text-[14px] focus:outline-none focus:border-navy transition-colors"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 px-4 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors disabled:opacity-50"
        >
          {state === "sending" ? "…" : "Subscribe"}
        </button>
      </div>
      {error && <p className="mt-2 text-risk text-[12px]">{error}</p>}
    </form>
  );
}
