"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eyebrow, Section } from "@/components/ui";

const interestLabels: Record<string, string> = {
  general: "General inquiry",
  "founding-member": "Founding membership",
  "on-prem": "On-prem HR AI agents",
  "performance-pricing": "At-risk / performance pricing",
  "research-agent": "Research Agent",
  "scenario-modeling": "Scenario Modeling",
  "workforce-strategy": "Workforce-Aligned Strategy",
};

function ContactForm() {
  const params = useSearchParams();
  const initialInterest = params.get("interest") || "general";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [interest, setInterest] = useState(initialInterest);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      full_name: fullName,
      email,
      company_name: companyName || null,
      interest,
      message: message || null,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <Section className="max-w-md pt-24">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="font-serif font-light text-3xl mb-4">Thanks — that's in.</h1>
        <p className="text-[15px] text-gray-warm">
          We'll follow up directly at {email}.
        </p>
      </Section>
    );
  }

  return (
    <Section className="max-w-md pt-24">
      <Eyebrow>Contact</Eyebrow>
      <h1 className="font-serif font-light text-4xl mb-8">Let's talk.</h1>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          What's this about?
        </label>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="border border-border bg-white/40 px-4 py-3 font-sans"
        >
          {Object.entries(interestLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          Full name
        </label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-border bg-white/40 px-4 py-3 font-sans"
        />

        <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border bg-white/40 px-4 py-3 font-sans"
        />

        <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          Company
        </label>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="border border-border bg-white/40 px-4 py-3 font-sans"
        />

        <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          Message
        </label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border border-border bg-white/40 px-4 py-3 font-sans"
        />

        {status === "error" && (
          <p className="text-risk text-sm">
            Something went wrong sending that — try again in a moment.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-2 px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </form>
    </Section>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  );
}
