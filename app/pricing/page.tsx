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
