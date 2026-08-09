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
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Research Engagements",
  description:
    "Independent analysis of employer benefit programs and of the vendors selling them. For private equity, investors, consultants and competitive research.",
};

const AUDIENCES = [
  {
    tag: "Private equity & corporate development",
    title: "Benefit spend is an EBITDA line nobody diligences.",
    body: "An 800-person target is carrying somewhere north of $10M in annual health spend, and it scales from there — usually assembled over a decade, one approval at a time, with no independent review of the whole. We tell you what's recoverable post-close, what's locked into contract, and what the seller's run-rate assumes that it shouldn't.",
    output: "Pre-LOI screen or full diligence memo",
  },
  {
    tag: "Investors in benefits vendors",
    title: "You're about to back a company whose entire pitch is a savings claim.",
    body: "Taking savings claims apart is the thing we do every day — selection bias in the study population, overlap with programs the employer already runs, how much of a published outcome actually transfers to a different workforce. We'll tell you whether the ROI story survives contact with a real buyer's data.",
    output: "Claim integrity review · market positioning read",
  },
  {
    tag: "Consultants & brokers",
    title: "Walk into the renewal already knowing the answer.",
    body: "An independent read on a prospect's or client's benefit portfolio before you're in the room — where the portfolio trails peers, which vendor claims won't hold up, and what the defensible negotiating position actually is. White-label available.",
    output: "Pre-meeting brief · portfolio assessment",
  },
  {
    tag: "Competitive & market research",
    title: "How your claims hold up against an independent model.",
    body: "If you sell a benefit program, you already know your ROI study will get challenged. We'll run it through the same attribution framework a skeptical CFO would — before someone else does it in front of your prospect.",
    output: "Evidence review · competitive landscape",
  },
];

export default function Research() {
  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-52 -right-32 w-[560px] h-[560px] rounded-full opacity-[0.06] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #4AC9DC 0%, #2463EB 55%, transparent 72%)",
          }}
        />
        <Section className="relative pt-24 pb-16">
          <Reveal>
            <Eyebrow>Research Engagements</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              Diligence-grade analysis of benefit programs —{" "}
              <em className="italic">and of the companies selling them.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Most of what we do is for employers analysing their own programs. But the
              same machinery works when you need to understand an organisation you
              don&rsquo;t run — a target, a portfolio company, a client, or a
              competitor.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/contact?interest=third-party-research">
                Scope an engagement
              </GradientButton>
              <GhostButton href="/platform#report">See the analysis</GhostButton>
            </div>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── AUDIENCES ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>Who commissions this</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Four questions we get asked{" "}
                <em className="italic">from outside the company.</em>
              </h2>
            </div>
          </Reveal>

          <Stagger className="grid gap-px bg-border border border-border">
            {AUDIENCES.map((a) => (
              <StaggerItem
                key={a.tag}
                className="group bg-base p-8 md:p-10 grid md:grid-cols-[1fr_1.6fr] gap-5 md:gap-12 transition-colors duration-300 hover:bg-base-2"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue">
                    {a.tag}
                  </span>
                  <span className="block mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool">
                    {a.output}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl md:text-[26px] leading-snug mb-3">
                    {a.title}
                  </h3>
                  <p className="text-[15px] leading-[1.75] text-gray-warm max-w-measure">
                    {a.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      </div>

      {/* ─────────────── THE FIREWALL (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>The line we don&rsquo;t cross</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-xl">
                Nobody&rsquo;s data becomes{" "}
                <em className="italic">somebody else&rsquo;s research.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Selling research on employers while also serving employers only works
                if there is a hard wall between the two. There is, and it&rsquo;s worth
                being specific about where it sits — because if you&rsquo;re commissioning
                research from us, you&rsquo;re also trusting that we&rsquo;d never do
                this to you.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid gap-8 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Client material is never an input
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Intake documents, claims summaries and anything else a client sends us
                are walled off from third-party work entirely. Not anonymised —
                excluded.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Built from public and market sources
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Filings, vendor-published materials, regulatory data, and our own
                benchmark library — which is aggregated to the point that no single
                employer is identifiable in it.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                We decline research on active clients
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                If the subject of a requested engagement is a current Axionia client, we
                turn the engagement down. We&rsquo;ll tell you we&rsquo;ve declined; we
                won&rsquo;t tell you why.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── WHERE IT LEADS ───────────────
          The page previously ended a research engagement at the deliverable.
          For a firm that's a cul-de-sac: they commission a memo and nothing
          says what the relationship becomes.

          The hard part is that "we decline research on active clients" reads
          as a closed door — research and engagement structurally opposed. It
          isn't a closed door, it's a handoff, and saying so plainly makes the
          firewall stronger rather than weaker: you cannot be researching a
          company for someone else and advising that company at the same time,
          which is exactly what the promise already commits to.

          The load-bearing claim is the last card. A firm can hold a portfolio
          view without ever seeing one company's confidential data, because
          the portfolio view is made of benchmark position and price
          dispersion rather than of anyone's claims file. That is what makes
          the whole model coherent, and it's also the thing a firm actually
          wants. */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>Where research leads</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              The memo is the start of something,{" "}
              <em className="italic">or it isn&rsquo;t. Both are fine.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Plenty of engagements are exactly what they say on the tin — a
              screen before an LOI, a claim review before a term sheet, and
              then we&rsquo;re done. But if you hold a portfolio, the first
              piece of work is usually the cheapest way to find out whether the
              rest is worth doing.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              One company, from outside
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              A diligence memo on a single business — what its benefit spend
              actually buys, what&rsquo;s recoverable, what&rsquo;s locked into
              contract. Built from public and market sources, delivered on a
              date, priced as one piece of work.
            </p>
          </StaggerItem>
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              That company, from inside
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              If the business becomes an Axionia client, we stop researching it
              for you and start advising it with you. That isn&rsquo;t a
              loophole in the wall above — it&rsquo;s the wall working. We
              can&rsquo;t hold both roles, so the research relationship on that
              company ends when the advisory one begins, and we&rsquo;ll say so
              at the time.
            </p>
          </StaggerItem>
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              The portfolio, permanently
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              What you keep across every conversion is the view above the
              companies: where each sits against benchmark, which vendors
              appear in how many of them, and at what spread of prices. None of
              that requires one company&rsquo;s confidential data, which is
              precisely why you can have it.
            </p>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.1}>
          <div className="mt-10 border-l-2 border-blue pl-6 py-1 max-w-2xl">
            <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
              The same vendor, sold into eleven of your companies at eleven
              prices, is a finding no single engagement can produce.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ─────────────── HOW IT'S PRICED ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 items-start">
            <div>
              <Eyebrow>Engagement terms</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
                Scoped, quoted, and delivered on a date.
              </h2>
            </div>
            <div>
              <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                Research engagements are priced per piece of work rather than by
                subscription — a pre-LOI screen is a different job from a full
                diligence memo, and a single vendor claim review is different again.
                Tell us the decision you&rsquo;re trying to make and the date you need
                it by, and we&rsquo;ll come back with scope and a fixed price.
              </p>
              <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                Turnaround is typically days rather than weeks. Every deliverable
                carries the same discipline as our employer work: dollar impacts as
                ranges, vendor claims marked as unverified until adjusted, and every
                assumption exposed so your own team can push on it.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <GradientButton href="/contact?interest=third-party-research">
                  Scope an engagement
                </GradientButton>
                <GhostButton href="/pricing">See standard pricing</GhostButton>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Start here</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              Tell us the decision. We&rsquo;ll tell you what it takes to answer it.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              A short conversation is usually enough to tell whether this is a two-day
              screen or a three-week piece of work — and whether we&rsquo;re the right
              people for it at all.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/contact?interest=third-party-research">
                Scope an engagement
              </GradientButton>
              <GhostButtonLight href="/platform">See the platform</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
