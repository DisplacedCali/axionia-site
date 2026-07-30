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
  title: "Pricing",
  description:
    "Priced against value protected, not spend generated. No per-report fees, no vendor commissions, and fees at risk only against savings you can verify on an invoice.",
};


const tiers = [
  {
    label: "Portfolio Scorer",
    price: "Free",
    body: "Benchmark your current benefit portfolio against comparable employers. No cost, no commitment — the front door to everything else we do.",
    ctaLabel: "Create a free account",
    ctaHref: "/signup",
    featured: false,
  },
  {
    label: "Standard Service",
    price: "Custom quote",
    body: "Full scenario modeling, independent vendor research, and workforce-aligned strategy. Priced as a share of advised spend, scaled to your workforce size and complexity.",
    ctaLabel: "Get a quote",
    ctaHref: "/contact",
    featured: true,
  },
  {
    label: "Founding Membership",
    price: "10 seats only",
    body: "Prepay your full five-year engagement upfront for a rate locked for the term, a seat on the council shaping Axionia's roadmap, and an annual in-person summit.",
    ctaLabel: "Learn more",
    ctaHref: "/founding-members",
    featured: false,
  },
];

export default function Pricing() {
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
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-3xl">
              Start free. <em className="italic">Scale to what you need.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Axionia is priced around a share of the value we help you protect, not a
              flat per-report fee. Every engagement starts with the free Portfolio
              Scorer.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── TIERS ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Stagger className="grid md:grid-cols-3 gap-8">
            {tiers.map((t) => (
              <StaggerItem
                key={t.label}
                className={`group relative flex flex-col bg-base p-9 border transition-colors duration-300 overflow-hidden ${
                  t.featured
                    ? "border-navy"
                    : "border-border hover:border-navy"
                }`}
              >
                {t.featured && (
                  <div className="absolute top-0 left-0 h-full w-[3px] bg-axionia-gradient" />
                )}
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
                  {t.label}
                </span>
                <span className="font-serif font-light text-4xl mt-4 mb-1">
                  {t.price}
                </span>
                <p className="text-[14px] leading-[1.7] text-gray-warm mt-4 flex-1">
                  {t.body}
                </p>
                <div className="mt-8">
                  <GhostButton href={t.ctaHref}>{t.ctaLabel}</GhostButton>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      </div>

      {/* ─────────────── HOW PRICING WORKS (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>Why it&rsquo;s priced this way</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-xl">
                Our incentive shouldn&rsquo;t rise{" "}
                <em className="italic">when your costs do.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Most advisory compensation in this market goes up as employer spend goes
                up. That&rsquo;s the misalignment at the center of why benefit purchasing
                stays expensive and opaque. Axionia is priced against the value protected,
                not the spend generated — and we publish the model behind every number so
                you can check the work.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid gap-8 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                No per-report fees
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                You aren&rsquo;t charged for asking another question or running another
                scenario. That would penalize exactly the behavior we want.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                No vendor commissions
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                We take no compensation from any vendor, broker, or carrier whose
                programs we evaluate. Ever.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Fees at risk — but only against savings we can both verify
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                We&rsquo;ll put a portion of our fee at risk against savings you can see
                on an invoice. Never against savings we modeled — pricing on our own
                estimates would corrupt them.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Quoted, not published
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Engagements are scoped to workforce size and complexity, so pricing is
                discussed directly rather than posted as a list price.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── VERIFIABLE SAVINGS ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>Performance pricing</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                We&rsquo;ll put fees at risk.{" "}
                <em className="italic">Against the right number.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                Plenty of advisors will promise to be paid out of your savings. Almost
                none of them will tell you which savings — and that distinction is the
                whole game.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid md:grid-cols-2 gap-px bg-border border border-border">
            <StaggerItem className="bg-base p-8 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-pos" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-pos">
                  Verifiable — we&rsquo;ll take risk here
                </span>
              </div>
              <h3 className="font-serif text-2xl mb-4">
                Savings you can point at on an invoice.
              </h3>
              <ul className="space-y-2.5 mb-5">
                {[
                  "A contracted rate that actually came down",
                  "An administration fee eliminated",
                  "A duplicate program cancelled",
                  "Rebate pass-through recovered in renegotiation",
                  "Ineligible dependents removed from the plan",
                ].map((x) => (
                  <li
                    key={x}
                    className="text-[14px] leading-[1.6] text-gray-warm pl-4 border-l-2 border-pos/30"
                  >
                    {x}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-[1.65] text-gray-warm">
                These are facts, not estimates. Either the number on the contract
                changed or it didn&rsquo;t — there&rsquo;s nothing to argue about and
                no attribution model standing between you and the result.
              </p>
            </StaggerItem>

            <StaggerItem className="bg-base p-8 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-caution" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
                  Modeled — we will never price on this
                </span>
              </div>
              <h3 className="font-serif text-2xl mb-4">
                Savings that depend on someone&rsquo;s estimate.
              </h3>
              <ul className="space-y-2.5 mb-5">
                {[
                  "A clinical program's projected reduction in spend",
                  "Avoided surgeries or avoided admissions",
                  "Productivity or absenteeism improvements",
                  "Retention and satisfaction gains",
                ].map((x) => (
                  <li
                    key={x}
                    className="text-[14px] leading-[1.6] text-gray-warm pl-4 border-l-2 border-caution/30"
                  >
                    {x}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-[1.65] text-gray-warm">
                Every one of these requires an attribution judgment. If our fee moved
                with those judgments, we&rsquo;d have exactly the conflict we exist to
                expose — and you could no longer trust the haircuts we apply to a
                vendor&rsquo;s claim.
              </p>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-8 border-l-2 border-blue pl-6 py-1 max-w-2xl">
              <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
                An independent check that gets paid more when the number is bigger
                isn&rsquo;t independent.
              </p>
            </div>
            <div className="mt-8">
              <GhostButton href="/contact?interest=performance-pricing">
                Discuss an at-risk arrangement
              </GhostButton>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── ON-PREM ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 items-start">
            <div>
              <Eyebrow>Enterprise Add-On</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
                On-Prem HR AI Agents
              </h2>
            </div>
            <div>
              <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                For organizations with strict data-residency, security, or procurement
                requirements, Axionia offers a custom on-premises implementation of its
                HR AI agents — a dedicated buy-up layered on top of the standard service,
                not a replacement for it. Your data stays inside your infrastructure.
                This is the usual path at large employers, who tend to have both the
                procurement requirements and the internal capacity to host it.
              </p>
              <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                Because every on-prem deployment is scoped to the buyer&rsquo;s
                environment, pricing is quoted directly rather than published.
              </p>
              <div className="mt-7">
                <GhostButton href="/contact?interest=on-prem">
                  Contact us about on-prem
                </GhostButton>
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
              Start with the free score. Decide the rest later.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              There&rsquo;s no commitment attached to the Portfolio Scorer and no sales
              call triggered by running it. If the analysis is useful, the deeper
              engagement is there when you want it.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Get your free report</GradientButton>
              <GhostButtonLight href="/contact">Get a quote</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
