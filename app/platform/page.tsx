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
import WorkflowDemo from "@/components/WorkflowDemo";
import ReportDemo from "@/components/ReportDemo";
import ResearchPipeline from "@/components/ResearchPipeline";
import CategoryMatrix from "@/components/CategoryMatrix";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

const modules = [
  {
    name: "Portfolio Scorer",
    tag: "Free",
    body: "A benchmark of your current benefit portfolio against comparable employers — score bands from Foundation to Strong, framed as opportunity, never failure. The front door to everything else.",
    ctaLabel: "Create a free account",
    ctaHref: "/signup",
  },
  {
    name: "Research Agent",
    tag: "Included",
    body: "Independent, vendor-by-vendor research delivered as a leave-behind before your next renewal conversation — reviewed for accuracy, not auto-published.",
    ctaLabel: "Ask about the Research Agent",
    ctaHref: "/contact?interest=research-agent",
  },
  {
    name: "Scenario Modeling",
    tag: "Included",
    body: "Every recommendation is shown as a range — low, expected, high — never a single false-precision number. You see the assumptions, not just the output.",
    ctaLabel: "Ask about scenario modeling",
    ctaHref: "/contact?interest=scenario-modeling",
  },
  {
    name: "Workforce-Aligned Strategy",
    tag: "Included",
    body: "Benefit economics differ for a manual/replaceable workforce versus a knowledge/talent-retention workforce. We model your actual composition, not a generic template.",
    ctaLabel: "Ask about workforce strategy",
    ctaHref: "/contact?interest=workforce-strategy",
  },
  {
    name: "On-Prem HR AI Agents",
    tag: "Enterprise buy-up",
    body: "A custom, on-premises implementation of the same AI agents for organizations with strict data-residency, security, or procurement requirements.",
    ctaLabel: "Contact us about on-prem",
    ctaHref: "/contact?interest=on-prem",
  },
];

const steps = [
  {
    step: "01",
    title: "Score your portfolio",
    body: "Run the free Portfolio Scorer to see where your benefits stand against comparable employers.",
  },
  {
    step: "02",
    title: "Get the full analysis",
    body: "Structured intake feeds a scenario model and independent research — delivered as a report, not a sales call.",
  },
  {
    step: "03",
    title: "Bring it to the decision",
    body: "Use the ranges and the exposed assumptions in the room, whether that's with your broker, your board, or your CFO.",
  },
];

export default function Platform() {
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
            <Eyebrow>The Platform</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              Decision intelligence,{" "}
              <em className="italic">not another dashboard.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Axionia combines independent benchmarking, transparent scenario modeling,
              and AI-native research agents into one methodology — built to serve HR
              leaders and CFOs at the same time, with the same numbers.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Score your portfolio free</GradientButton>
              <GhostButton href="#report">See a live report</GhostButton>
            </div>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── INTERACTIVE REPORT ─────────────── */}
      <div id="report" className="bg-base-2 scroll-mt-4">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <Eyebrow>The deliverable</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Don&rsquo;t take our word for it.{" "}
                <em className="italic">Turn the dials yourself.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                This is a working version of what you receive — set it to your own
                headcount and workforce profile, then move the assumptions and watch
                every number respond. Nothing is hidden behind a login.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ReportDemo />
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── CATEGORY ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-10">
            <Eyebrow>Why this doesn&rsquo;t exist already</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Four things you need.{" "}
              <em className="italic">Nobody does all four.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Analytics platforms consolidate your data and hand you a dashboard —
              then leave the decision to you. Brokers and consultants will tell you
              what to do, but their compensation rises as your spend does. And the
              vendor&rsquo;s study was written by the vendor. Each piece exists. The
              combination doesn&rsquo;t.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <CategoryMatrix />
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 text-[13px] leading-[1.65] text-gray-cool max-w-measure">
            Assessed as fairly as we can make it — analytics platforms genuinely are
            independent and genuinely do consolidate well. Their gap is that
            interpreting the dashboard is still your job.
          </p>
        </Reveal>
      </Section>

      {/* ─────────────── HOW IT WORKS (dark) ─────────────── */}
      <DarkSection>
        <Reveal>
          <EyebrowLight>How it works</EyebrowLight>
          <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1] max-w-2xl">
            Start free. <em className="italic">Go as deep as you need.</em>
          </h2>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-10 mt-16">
          {steps.map((s) => (
            <StaggerItem key={s.step} className="border-t border-white/15 pt-6">
              <span className="font-mono text-[11px] tracking-[0.14em] text-teal">
                {s.step}
              </span>
              <h3 className="font-serif text-2xl mt-3 mb-2.5">{s.title}</h3>
              <p className="text-[15px] leading-[1.7] text-gray-cool">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div className="mt-20 pt-12 border-t border-white/15">
            <EyebrowLight>Inside the analysis</EyebrowLight>
            <h3 className="font-serif font-light text-2xl md:text-3xl max-w-xl leading-snug mb-3">
              What actually runs when we look at a vendor&rsquo;s claim.
            </h3>
            <p className="text-[15px] leading-[1.7] text-gray-cool max-w-measure mb-10">
              Six research passes run against your intake — four at once, then two
              more — before anything reaches the attribution model. Nothing is
              published automatically.
            </p>
            <ResearchPipeline />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-14 flex flex-wrap gap-4">
            <GradientButton href="/signup">Create an account</GradientButton>
            <GhostButtonLight href="/contact">Talk to us</GhostButtonLight>
          </div>
        </Reveal>
      </DarkSection>

      {/* ─────────────── MODULES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <Eyebrow>What&rsquo;s included</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Five modules, one methodology
            </h2>
          </div>
        </Reveal>

        <Stagger className="grid gap-px bg-border border border-border">
          {modules.map((m) => (
            <StaggerItem
              key={m.name}
              className="group grid md:grid-cols-[1fr_2fr] gap-4 md:gap-10 bg-base p-8 md:p-10 transition-colors duration-300 hover:bg-base-2"
            >
              <div>
                <h3 className="font-serif text-2xl">{m.name}</h3>
                <span className="inline-block mt-3 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm border border-border group-hover:border-blue group-hover:text-blue transition-colors duration-300">
                  {m.tag}
                </span>
              </div>
              <div>
                <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                  {m.body}
                </p>
                <div className="mt-6">
                  <GhostButton href={m.ctaHref}>{m.ctaLabel}</GhostButton>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── WORKFLOW WALKTHROUGH ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <Eyebrow>Live example</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                See it on a real decision.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                Meridian Manufacturing&rsquo;s broker just recommended a virtual MSK
                program at $180 PMPM in savings. Step through what Axionia found.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <WorkflowDemo />
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Start here</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              Get this run on your actual portfolio.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              The Portfolio Scorer is free and there&rsquo;s no sales call attached to
              it. If it&rsquo;s useful, the deeper analysis is there when you want it.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Get your free report</GradientButton>
              <GhostButtonLight href="/contact">Book a call</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
