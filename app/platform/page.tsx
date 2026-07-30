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
import ObjectiveWeighting from "@/components/ObjectiveWeighting";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "The Platform",
  description:
    "Independent benchmarking, transparent scenario modeling and AI-native research in one methodology. Turn the dials on a live report before you talk to anyone.",
};


/**
 * The three phases, in the same vocabulary /platform/outputs uses.
 *
 * This replaced a five-module list that described the same product with a
 * different noun set and a different count. Two pages saying "five modules"
 * and "nine deliverables" about one engagement is the kind of thing a buyer
 * notices and can't unsee, so the phases live here as a summary and the
 * deliverables are enumerated in exactly one place.
 */
const phases = [
  {
    num: "01",
    name: "Set up",
    tag: "Once",
    body: "Your programs, carriers and renewal dates, the workforce you're actually buying for, and the vendor material you already have. Captured once and reused by everything after it.",
  },
  {
    num: "02",
    name: "Analyse",
    tag: "Free, then paid",
    body: "The portfolio scored on eight axes against comparable employers — that part is free. Then the vendor claims taken apart adjustment by adjustment, and the result modeled as a range rather than a number.",
  },
  {
    num: "03",
    name: "Steward",
    tag: "Continuous",
    body: "What changed this month, where the portfolio moved this quarter against a benchmark that moved too, and what the renewal cycle should look like next year.",
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
              <GradientButton href="/request-report">Get your free report</GradientButton>
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

      {/* ─────────────── OBJECTIVE WEIGHTING ─────────────── */}
      <Section className="py-16 sm:py-24">
        <ObjectiveWeighting />
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
          <div className="mt-14 flex flex-wrap gap-4">
            <GradientButton href="/request-report">Get your free report</GradientButton>
            <GhostButtonLight href="/platform/outputs">
              See everything you receive
            </GhostButtonLight>
          </div>
        </Reveal>
      </DarkSection>

      {/* ─────────────── MODULES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <Eyebrow>What&rsquo;s included</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Three phases, <em className="italic">nine deliverables.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Set it up once, analyse it properly, then keep it current. The
              third phase is the one a report can&rsquo;t do.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid gap-px bg-border border border-border">
          {phases.map((p) => (
            <StaggerItem
              key={p.name}
              className="group grid md:grid-cols-[1fr_2fr] gap-4 md:gap-10 bg-base p-8 md:p-10 transition-colors duration-300 hover:bg-base-2"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-blue">
                    {p.num}
                  </span>
                  <h3 className="font-serif text-2xl">{p.name}</h3>
                </div>
                <span className="inline-block mt-3 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm border border-border group-hover:border-blue group-hover:text-blue transition-colors duration-300">
                  {p.tag}
                </span>
              </div>
              <div>
                <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                  {p.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.12}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <GhostButton href="/platform/outputs">
              See all nine, and when each one lands
            </GhostButton>
            <p className="text-[14px] leading-[1.6] text-gray-warm">
              On-premises deployment for strict data-residency or procurement
              requirements is an enterprise add-on —{" "}
              <a href="/pricing" className="text-blue underline">
                see pricing
              </a>
              .
            </p>
          </div>
        </Reveal>
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
