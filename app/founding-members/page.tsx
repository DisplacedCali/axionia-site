import {
  Eyebrow,
  EyebrowLight,
  Section,
  DarkSection,
  GhostButton,
  GhostButtonLight,
  GradientButton,
  GradientRule,
} from "@/components/ui";
import CountUp from "@/components/CountUp";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Founding Members",
  description:
    "Ten employers, five years, a seat on the council shaping what gets built. Maximum two per industry.",
};


/**
 * Cohort state — edit these as seats fill.
 *
 * The per-industry cap is doing the real scarcity work. It's honest (a council
 * that's six manufacturers isn't a council), it's checkable, and it creates
 * genuine urgency without inventing a countdown: a prospect's own sector may
 * close before the cohort does.
 */
const COHORT = {
  total: 10,
  claimed: 0,
  perIndustry: 2,
};

const inclusions = [
  {
    title: "Five years, paid forward",
    body: "Founding members prepay their full five-year engagement at enrollment — capital that funds the platform's build-out directly — in exchange for a rate that's locked for the life of the term.",
  },
  {
    title: "A seat on the council",
    body: "Founding members sit on the council shaping the direction of benefits management and HR analytics — not an advisory board in name only. You see the roadmap before it's built, and you vote on it.",
  },
  {
    title: "Annual on-site summit",
    body: "A 1.5-day in-person gathering each summer — envisioned in a setting like Aspen — bringing the founding cohort together to work sessions, not just socialize.",
  },
  {
    title: "Quarterly virtual council meetings",
    body: "Between summits, quarterly working sessions keep the cohort's input flowing directly into the roadmap.",
  },
];

/** What Axionia owes, in return. Specific and checkable on purpose. */
const OBLIGATIONS = [
  {
    k: "Turnaround, committed",
    v: "Portfolio reports within five business days. Single-vendor claim reviews within 48 hours. If we miss, we tell you before you have to ask.",
  },
  {
    k: "A person, not a queue",
    v: "One named analyst who knows your portfolio, reachable directly. No ticket system, no rotating account manager.",
  },
  {
    k: "A quarterly review on the calendar",
    v: "Scheduled at the start of each year, not requested ad hoc — a standing session on what changed in your portfolio and what to do about it.",
  },
  {
    k: "The full model, every time",
    v: "Every deliverable carries its complete assumption ledger. If you can't trace a number back to something you can argue with, we haven't finished the work.",
  },
  {
    k: "Your data is never someone else's research",
    v: "Nothing you send us informs a third-party engagement — not anonymised, excluded. And we decline research engagements where a founding member is the subject.",
  },
  {
    k: "No vendor compensation. Contractually.",
    v: "Not a stated principle you have to trust — a term in your agreement. If we ever take money from a vendor whose program we evaluate, you're released and refunded.",
  },
  {
    k: "Terms survive us",
    v: "Your rate and rights persist through a change of control, and you get 90 days' notice of any material change in direction. The commitment runs both ways or it isn't one.",
  },
];

const QUALIFIES = [
  "500–4,999 covered lives — enough spend that independent analysis pays for itself",
  "Self-funded or level-funded, so the savings actually accrue to you",
  "A renewal, RFP or major program decision inside the next twelve months",
  "A named executive sponsor who'll actually attend council sessions",
  "Willing to share vendor materials and program economics — we can't analyse what we can't see",
];

export default function FoundingMembers() {
  const remaining = COHORT.total - COHORT.claimed;

  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-52 -right-32 w-[560px] h-[560px] rounded-full opacity-[0.06] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #3CBF6C 0%, #2463EB 55%, transparent 72%)",
          }}
        />
        <Section className="relative pt-24 pb-16">
          <Reveal>
            <Eyebrow>Founding Member Program</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-3xl">
              10 seats. <em className="italic">Five years of influence.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              We&rsquo;re inviting a founding cohort of 10 employers to help set the
              direction of Axionia&rsquo;s platform from the beginning — in exchange for
              locking in early terms and a real seat at the table.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className="text-navy">
                {remaining} of {COHORT.total} seats remaining
              </span>
              <span className="text-gray-cool">
                Maximum {COHORT.perIndustry} employers per industry
              </span>
            </div>
            <div className="mt-8">
              <GradientButton href="/contact?interest=founding-member">
                Start the conversation
              </GradientButton>
            </div>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── THE TERMS (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>What it funds</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-xl">
                A real commitment,{" "}
                <em className="italic">in both directions.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Founding membership is a full five-year engagement, paid upfront at
                enrollment — not a monthly subscription with a locked rate. That prepaid
                commitment is what funds the roadmap the founding cohort helps shape,
                which is also why it&rsquo;s reserved for organizations ready for the
                full standard service, not a lighter-touch engagement.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid sm:grid-cols-3 lg:grid-cols-1 gap-8 lg:gap-10 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none">
                <CountUp to={COHORT.total} />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Seats in the
                <br />
                founding cohort
              </div>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none">
                <CountUp to={5} suffix=" yr" />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Engagement term,
                <br />
                prepaid at enrollment
              </div>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none text-teal">
                <CountUp to={4} />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Council sessions
                <br />
                per year
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── THE ECONOMICS ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>The arithmetic</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                The question isn&rsquo;t the price.{" "}
                <em className="italic">It&rsquo;s the ratio.</em>
              </h2>
            </div>
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
            <StaggerItem className="bg-base p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                A single portfolio review
              </div>
              <div className="font-serif font-light text-3xl md:text-4xl leading-none mb-3">
                $358K–$956K
              </div>
              <p className="text-[14px] leading-[1.65] text-gray-warm">
                Recoverable opportunity identified for a composite 820-life employer —
                the figure the{" "}
                <a href="/platform#report" className="text-blue underline">
                  interactive report
                </a>{" "}
                produces on default settings. Yours will differ; the order of magnitude
                usually doesn&rsquo;t.
              </p>
            </StaggerItem>
            <StaggerItem className="bg-base p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                Founding membership
              </div>
              <div className="font-serif font-light text-3xl md:text-4xl leading-none mb-3">
                A fraction of year one
              </div>
              <p className="text-[14px] leading-[1.65] text-gray-warm">
                The full five-year commitment is priced below what a single year&rsquo;s
                identified opportunity is typically worth — and locked, so it
                doesn&rsquo;t escalate while your benefit spend does.
              </p>
            </StaggerItem>
            <StaggerItem className="bg-base p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                Then it compounds
              </div>
              <div className="font-serif font-light text-3xl md:text-4xl leading-none mb-3">
                Five renewals
              </div>
              <p className="text-[14px] leading-[1.65] text-gray-warm">
                One review is a moment. Five years is every renewal, every new program
                pitched to you, and every vendor claim tested before you sign — with a
                benchmark that gets sharper each year.
              </p>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-10 grid md:grid-cols-[auto_1fr] gap-6 md:gap-12 border border-border bg-base p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm whitespace-nowrap">
                For the CFO
              </div>
              <div className="max-w-2xl">
                <p className="text-[15px] leading-[1.75] text-gray-warm">
                  Prepaying converts five annual renewal negotiations into a single
                  budget event. There&rsquo;s no escalation clause to argue about, no
                  renewal risk, and no line item that grows with your benefit spend —
                  which is precisely the dynamic this whole company exists to break.
                </p>
                <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm">
                  Firms typically carry a prepaid multi-year service agreement as a
                  prepaid asset and recognise it across the service term rather than
                  expensing it in year one. Worth confirming how your own finance team
                  would treat it — we&rsquo;re happy to give them whatever they need.
                </p>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── WHAT AXIONIA OWES (dark) ─────────────── */}
      <DarkSection>
        <Reveal>
          <EyebrowLight>Our side of it</EyebrowLight>
          <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-2xl">
            You&rsquo;re committing five years.{" "}
            <em className="italic">Here&rsquo;s what we commit back.</em>
          </h2>
          <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
            A prepaid agreement where only one party has obligations is a loan, not a
            partnership. These go in the agreement, not just on this page.
          </p>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-x-14 gap-y-9 mt-14">
          {OBLIGATIONS.map((o, i) => (
            <StaggerItem key={o.k} className="border-t border-white/15 pt-5">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-[11px] text-teal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-base">
                  {o.k}
                </span>
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">{o.v}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </DarkSection>

      {/* ─────────────── QUALIFICATION ─────────────── */}
      <Section className="py-16 sm:py-24">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16">
          <Reveal>
            <div>
              <Eyebrow>Who this is for</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                It won&rsquo;t suit everyone —{" "}
                <em className="italic">and it shouldn&rsquo;t.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm max-w-measure">
                We&rsquo;d rather say no early than take a prepayment from an
                organisation the work won&rsquo;t pay off for. Broadly, a founding
                member looks like this.
              </p>
              <div className="mt-8 border-l-2 border-caution pl-6 py-1">
                <p className="text-[15px] leading-[1.7] text-gray-warm">
                  No more than{" "}
                  <strong className="text-navy">
                    {COHORT.perIndustry} employers from any single industry
                  </strong>
                  . A council that&rsquo;s six manufacturers isn&rsquo;t a council —
                  it&rsquo;s a focus group. Your sector may close before the cohort
                  does.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <Stagger className="grid gap-px bg-border border border-border">
              {QUALIFIES.map((q) => (
                <StaggerItem
                  key={q}
                  className="bg-base p-5 flex items-baseline gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-pos shrink-0 translate-y-[-2px]" />
                  <span className="text-[15px] leading-[1.6] text-gray-warm">{q}</span>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-4 text-[13px] leading-[1.6] text-gray-cool">
              Close but not exact? Say so anyway — the cohort is small enough that we
              read every one of these ourselves.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ─────────────── WHY ONLY 10 ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <Reveal>
              <div>
                <Eyebrow>Why only 10</Eyebrow>
                <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
                  A council only works if{" "}
                  <em className="italic">everyone&rsquo;s voice actually gets heard.</em>
                </h2>
                <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
                  Ten employers is enough to represent real diversity of workforce
                  composition and industry, and small enough that every member&rsquo;s
                  perspective genuinely shapes what we build next — rather than being
                  one voice lost in a large advisory board.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="border border-border bg-base p-8">
                <Eyebrow>Who&rsquo;s building it</Eyebrow>
                <p className="text-[15px] leading-[1.75] text-gray-warm">
                  Axionia is built by a healthcare analytics executive with more than
                  twenty years across payer, provider, pharma and consulting —
                  SVP-level analytics and health-economics leadership, a Yale MBA, a
                  master&rsquo;s in biostatistics from UCLA, and risk deals underwritten
                  to $500M.
                </p>
                <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm">
                  The attribution framework behind every report — de-duplicating vendor
                  claims, adjusting for selection bias — comes from two decades of
                  building exactly these models on the other side of the table.
                </p>
                <p className="mt-4 text-[14px] leading-[1.7] text-gray-cool">
                  Founding members are introduced directly before committing to
                  anything. You should know precisely who you&rsquo;re backing.
                </p>
              </div>
            </Reveal>
          </div>
        </Section>
      </div>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Next step</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              Terms are shared directly, not published.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              Total commitment, payment structure and enrollment details are discussed
              one-on-one — and the first conversation is about whether this is a fit at
              all, not a pitch. If it isn&rsquo;t, we&rsquo;ll tell you, and the free
              report is yours either way.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
              {remaining} of {COHORT.total} seats remaining · max{" "}
              {COHORT.perIndustry} per industry
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <GradientButton href="/contact?interest=founding-member">
                Start the conversation
              </GradientButton>
              <GhostButtonLight href="/request-report">
                Start with the free report
              </GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
