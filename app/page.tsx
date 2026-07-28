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
import HeroIntro from "@/components/HeroIntro";
import HeroViz from "@/components/HeroViz";
import RadarPreview from "@/components/RadarPreview";
import CountUp from "@/components/CountUp";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

const principles = [
  {
    title: "Independent Value Assessment",
    body: "We aren't paid more when your costs go up. Our analysis has no stake in which vendor you choose.",
  },
  {
    title: "Clarity Over Complexity",
    body: "Benefit decisions get dressed up in jargon. We translate them into plain economics a CFO and an HR leader can both stand behind.",
  },
  {
    title: "Planning for Uncertainty",
    body: "We show ranges, not false precision — expected case, best case, worst case, always visible together.",
  },
  {
    title: "Economic Alignment Matters",
    body: "A benefit strategy should match your actual workforce and talent strategy, not a generic template.",
  },
  {
    title: "Transparency Over Hidden Assumptions",
    body: "Every number traces back to an assumption you can see, question, and override.",
  },
];

export default function Home() {
  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <div className="relative overflow-hidden">
        {/* ambient wash — very low opacity, never behind body text */}
        <div
          className="pointer-events-none absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full opacity-[0.07] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #4AC9DC 0%, #2463EB 55%, transparent 72%)",
          }}
        />
        <Section className="relative pt-24 pb-20">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-16 items-center">
            <HeroIntro />
            <HeroViz />
          </div>
          <div className="mt-16">
            <GradientRule />
            <p className="mt-4 font-serif italic text-xl text-gray-warm max-w-lg">
              &ldquo;We tell you what we think — but we expose the entire model.&rdquo;
            </p>
          </div>
        </Section>
      </div>

      {/* ─────────────── THE PROBLEM (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>The problem</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1] max-w-xl">
                140,000 employers.
                <br />
                <em className="italic">Zero independent intelligence.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Mid-market employers are large enough to need sophisticated analysis and
                small enough to have no internal capacity to do it themselves. Every year
                they evaluate new benefit programs on a broker&rsquo;s recommendation and
                a vendor&rsquo;s own ROI study. Nobody checks the math independently —
                until now.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid sm:grid-cols-3 lg:grid-cols-1 gap-8 lg:gap-10 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none">
                <CountUp to={140000} />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Mid-market employers
                <br />
                100–4,999 employees
              </div>
            </StaggerItem>

            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none">
                <CountUp to={495} prefix="$" suffix="B" />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Healthcare spend
                <br />
                under their control
              </div>
            </StaggerItem>

            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-serif font-light text-5xl md:text-6xl leading-none text-teal">
                0
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                Independent parties
                <br />
                checking the math
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── LIVE PRODUCT: RADAR ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>What you actually get</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Your portfolio, scored on eight dimensions —{" "}
                <em className="italic">against employers like you.</em>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-base border border-border p-8 md:p-12">
              <RadarPreview />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <GradientButton href="/request-report">Score your portfolio free</GradientButton>
              <GhostButton href="/platform">See the full platform</GhostButton>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
              Illustrative composite profile — no cost, no commitment
            </p>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── PRINCIPLES ─────────────── */}
      <Section className="py-24">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <Eyebrow>What we believe</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Five principles
            </h2>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-x-14 gap-y-12">
          {principles.map((p, i) => (
            <StaggerItem key={p.title} className="group relative pl-16">
              {/* oversized numbering rail */}
              <span className="absolute left-0 top-0 font-mono text-[13px] text-gray-cool transition-colors duration-300 group-hover:text-blue">
                0{i + 1}
              </span>
              <span className="absolute left-[9px] top-7 bottom-1 w-px bg-border overflow-hidden">
                <span className="block h-full w-full origin-top scale-y-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-y-100" />
              </span>
              <h3 className="font-serif text-2xl mb-2.5">{p.title}</h3>
              <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                {p.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── TWO-UP: ENTERPRISE / FOUNDING ─────────────── */}
      <Section className="border-t border-border py-24">
        <Stagger className="grid md:grid-cols-2 gap-10">
          <StaggerItem className="group border border-border bg-base p-9 transition-colors duration-300 hover:border-navy">
            <Eyebrow>Enterprise &amp; On-Prem</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              For organizations that need it run{" "}
              <em className="italic">inside their walls.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm">
              A custom, on-premises implementation of Axionia&rsquo;s HR AI agents for
              organizations with strict data-residency or security requirements — layered
              on top of the standard service.
            </p>
            <div className="mt-7">
              <GhostButton href="/pricing">View pricing options</GhostButton>
            </div>
          </StaggerItem>

          <StaggerItem className="group relative border border-border bg-base p-9 transition-colors duration-300 hover:border-navy overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[3px] bg-axionia-gradient" />
            <Eyebrow>Founding Members</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              10 seats. <em className="italic">Shaping where this goes.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm">
              A founding cohort of 10 employers prepaying a five-year engagement in
              exchange for a locked rate and a seat on the council shaping the future of
              benefits management and HR analytics — including an annual in-person summit.
            </p>
            <div className="mt-7">
              <GhostButton href="/founding-members">
                Learn about founding membership
              </GhostButton>
            </div>
          </StaggerItem>
        </Stagger>
      </Section>

      {/* ─────────────── CONVERSION BLOCK ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Start here</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              See where your benefit portfolio actually stands.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              The Portfolio Scorer is free, takes a few minutes, and benchmarks you
              against comparable employers. It&rsquo;s the front door to everything else
              we do — and there&rsquo;s no sales call attached to it.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Score your portfolio free</GradientButton>
              <GhostButtonLight href="/contact">Talk to us first</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
