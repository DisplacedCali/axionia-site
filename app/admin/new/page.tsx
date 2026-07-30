import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Section } from "@/components/ui";
import NewResearchForm from "@/components/admin/NewResearchForm";

export const dynamic = "force-dynamic";

export default async function NewResearch() {
  await requireAdmin();

  return (
    <Section className="pt-12 pb-24">
      <Link
        href="/admin"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy"
      >
        ← Queue
      </Link>

      <div className="mt-4 mb-8 max-w-2xl">
        <h1 className="font-serif font-light text-4xl">Start research</h1>
        <p className="mt-3 text-[15px] leading-[1.7] text-gray-warm">
          Run an analysis on any company, whether or not anyone there has an account.
          The report is stored against the company — if someone from that company
          signs up later with a matching email domain, it becomes visible to them
          without any further work.
        </p>
      </div>

      <NewResearchForm />
    </Section>
  );
}
