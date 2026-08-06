import { Eyebrow, Section, GradientRule } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Privacy & data use",
  description:
    "What Axionia collects, what it deliberately doesn't, and the commitment that no individual company's data is ever disclosed or referenced in material that isn't for that company.",
};

/**
 * Privacy and data use.
 *
 * Written against what the system ACTUALLY does, not against a template. Every
 * "we don't collect" below is enforced somewhere in the schema — the absent IP
 * columns on deck_events, site_events and report_events are deliberate, and
 * migrations 012, 014 and 015 say so in their headers. If any of those change,
 * this page changes in the same commit.
 *
 * NOT LEGAL ADVICE AND NOT COUNSEL-REVIEWED. It is an honest description of
 * current behaviour, which is the necessary precondition for a lawyer to turn
 * it into something binding — not a substitute for that step.
 */

const UPDATED = "6 August 2026";

const sections: { h: string; body: React.ReactNode }[] = [
  {
    h: "The commitment that matters most",
    body: (
      <>
        <p>
          No data about a specific company is ever disclosed, named, or
          referenced in any external material that isn&rsquo;t for that company.
          Not in a benchmark report shown to someone else, not in a sales deck,
          not in a case study, not in conversation with a broker, carrier or
          vendor.
        </p>
        <p>
          We do use what we learn for research and benchmarking. That work is
          aggregate: patterns across many employers, never a row you could trace
          back to one. Where a group is small enough that an aggregate figure
          would effectively identify a participant, we don&rsquo;t publish the
          figure.
        </p>
      </>
    ),
  },
  {
    h: "What we deliberately don't collect",
    body: (
      <>
        <p>
          Worth stating first, because it&rsquo;s unusual and it&rsquo;s
          enforced in the database rather than in a policy.
        </p>
        <p>
          <strong>No member-level health data.</strong> Our intake accepts
          aggregate, de-identified information only — counts, bands, program
          names. We don&rsquo;t ask for a census containing names, dates of
          birth or identifiers, and we don&rsquo;t want one. This keeps Axionia
          outside HIPAA scope by design rather than by promise. If you send
          member-level data anyway, we will tell you and delete it.
        </p>
        <p>
          <strong>No IP addresses.</strong> Our analytics and view-logging
          tables have no column for one. Location, where we show it, comes from
          our hosting provider already resolved to country or city, so the
          address itself is never written down.
        </p>
        <p>
          <strong>No advertising trackers and no third-party analytics.</strong>{" "}
          Our analytics are first-party. Nothing you do here is sold, shared
          with an ad network, or used to follow you elsewhere.
        </p>
      </>
    ),
  },
  {
    h: "What we do collect",
    body: (
      <>
        <p>
          <strong>Account information</strong> — name, work email, company, and
          the role you tell us. Needed to give you an account and send you your
          report.
        </p>
        <p>
          <strong>What you tell us about your programs</strong> — your benefit
          mix, vendors, carriers, states of operation, covered lives, and
          anything you ask us to look into. Some of this is optional; where it
          is, the form says so and says what it buys you.
        </p>
        <p>
          <strong>Documents you send us</strong> — vendor decks, renewal
          packets, benefit summaries. Held for the work and deleted on request.
        </p>
        <p>
          <strong>First-party usage</strong> — which pages were viewed, and
          whether a report was opened or printed. Tied to a session cookie and,
          once you submit a form, to your account.
        </p>
      </>
    ),
  },
  {
    h: "How your data becomes a benchmark",
    body: (
      <>
        <p>
          The benchmark is the point of the product, so it&rsquo;s worth being
          precise about how it&rsquo;s built.
        </p>
        <p>
          Your portfolio is reduced to structured attributes — industry,
          workforce shape, size band, which program categories you run, region.
          Those attributes join a pool. When we tell another employer how their
          portfolio compares, they see a distribution, never a list of
          companies, and never a company name.
        </p>
        <p>
          The company-level record stays attached to you, and is used for your
          own analysis, your own year-over-year comparison, and nothing else.
        </p>
      </>
    ),
  },
  {
    h: "Who else sees it",
    body: (
      <>
        <p>
          <strong>Our people.</strong> Analysts and subject-matter reviewers
          contracted by Axionia, under confidentiality terms, and only for the
          work in front of them.
        </p>
        <p>
          <strong>The infrastructure we run on.</strong> Supabase (database and
          authentication), Vercel (hosting), Anthropic (the models behind our
          analysis), Resend (transactional email) and Cloudflare (DNS). They
          process data to provide those services and for no purpose of their
          own.
        </p>
        <p>
          <strong>Nobody else.</strong> We take no compensation from any vendor,
          broker or carrier, and we don&rsquo;t give them your data either.
          There is no arrangement under which your information reaches a party
          selling to you.
        </p>
      </>
    ),
  },
  {
    h: "Keeping it, and getting rid of it",
    body: (
      <>
        <p>
          Account and report data is kept while your account is open and for as
          long as we may reasonably need it afterwards. Uploaded documents are
          deleted on request.
        </p>
        <p>
          You can ask for a copy of what we hold, ask us to correct it, or ask
          us to delete it. Email{" "}
          <a href="mailto:privacy@axionia.com" className="text-blue hover:underline">
            privacy@axionia.com
          </a>{" "}
          and a person will answer.
        </p>
        <p>
          One limit worth stating honestly: aggregate benchmark statistics
          already computed cannot be unwound for one participant, because they
          no longer contain a participant. Deleting your data stops it
          contributing to anything future.
        </p>
      </>
    ),
  },
  {
    h: "Changes",
    body: (
      <p>
        If this page changes in a way that affects what we do with data already
        collected, we&rsquo;ll tell account holders directly rather than
        quietly updating the date at the top.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <>
      <Section className="pt-24 pb-10">
        <Reveal>
          <Eyebrow>Privacy &amp; data use</Eyebrow>
          <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-6xl leading-[1.08] tracking-tight max-w-3xl">
            Your numbers stay yours.{" "}
            <em className="italic">The patterns are what we learn from.</em>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
            We ask employers for information most of them consider proprietary,
            so we owe a plain answer about what happens to it. This page
            describes what the system actually does, not what a template says.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
            Last updated {UPDATED}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-12">
            <GradientRule />
          </div>
        </Reveal>
      </Section>

      <Section className="pb-24">
        <div className="grid gap-px bg-border border border-border">
          {sections.map((s) => (
            <section key={s.h} className="bg-base p-8 md:p-10">
              <h2 className="font-serif font-light text-2xl md:text-3xl leading-snug mb-4">
                {s.h}
              </h2>
              <div className="space-y-4 max-w-measure text-[15px] leading-[1.75] text-gray-warm [&_strong]:text-navy [&_strong]:font-medium">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-[13px] leading-[1.7] text-gray-cool max-w-measure">
          Axionia is operated by CareVisory LLC. Questions about anything here
          go to{" "}
          <a href="mailto:privacy@axionia.com" className="text-blue hover:underline">
            privacy@axionia.com
          </a>
          .
        </p>
      </Section>
    </>
  );
}
