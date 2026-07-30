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
import {
  SETUP,
  ANALYZE_FREE,
  ANALYZE_PAID,
  STEWARD,
  DeliverableCard,
  PhaseHeading,
  FreeLine,
  CycleRule,
} from "@/components/EngagementFlow";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "What you receive",
  description:
    "Every deliverable in an Axionia engagement and when it lands — set up, analysis, and the monthly, quarterly and annual cycle that follows. Including what we haven't built yet.",
};

export default function Outputs() {
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
            <Eyebrow>What you receive</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              A report is a moment.{" "}
              <em className="italic">A portfolio is a cycle.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Benefit decisions don&rsquo;t arrive once a year in a neat package.
              Renewals stagger, vendors change their claims, mandates move, and
              the workforce you designed for last year isn&rsquo;t the one you
              have now. So the engagement is built as a cycle: set it up once,
              analyse it properly, then keep it current.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-5 max-w-measure text-[15px] leading-[1.7] text-gray-warm">
              Below is every deliverable, what question it answers, and who it
              was written for &mdash; including the ones we haven&rsquo;t built
              yet, marked as such. We&rsquo;d rather you saw the roadmap than a
              finished-looking catalogue.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Start with the free score
              </GradientButton>
              <GhostButton href="/platform#report">
                See a live report
              </GhostButton>
            </div>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── 01 · SET UP ─────────────── */}
      <Section className="pt-4 pb-16 sm:pb-20">
        <Reveal>
          <PhaseHeading num="01 — SET UP" title="Once, at the start.">
            Three inputs, and they don&rsquo;t need to be perfect. Everything
            here is reused by every analysis that follows, so the setup cost is
            paid a single time rather than at every renewal.
          </PhaseHeading>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-6">
          {SETUP.map((d) => (
            <StaggerItem key={d.name} className="h-full">
              <DeliverableCard d={d} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── 02 · ANALYZE ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-20">
          <Reveal>
            <PhaseHeading num="02 — ANALYSE" title="What the numbers say.">
              The score is free and comes with no sales call attached. The
              teardown and the scenario model are the paid engagement &mdash; the
              line between them is drawn below rather than buried in a pricing
              table.
            </PhaseHeading>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid md:grid-cols-3 gap-6">
              {ANALYZE_FREE.map((d) => (
                <div key={d.name} className="md:col-span-2">
                  <DeliverableCard d={d} />
                </div>
              ))}
              <div className="hidden md:flex items-center">
                <p className="font-serif italic text-[19px] leading-snug text-gray-warm">
                  The front door. Most people stop here, and that&rsquo;s a fine
                  place to stop.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <FreeLine />
          </Reveal>

          <Stagger className="grid md:grid-cols-2 gap-6">
            {ANALYZE_PAID.map((d) => (
              <StaggerItem key={d.name} className="h-full">
                <DeliverableCard d={d} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      </div>

      {/* ─────────────── 03 · STEWARD ─────────────── */}
      <Section className="py-16 sm:py-20">
        <Reveal>
          <PhaseHeading num="03 — STEWARD" title="Then it keeps going.">
            This is the half of the engagement a one-off report can&rsquo;t do.
            Your portfolio is scored against a benchmark that moves, so standing
            still is a change in position &mdash; and you should hear about it
            when it happens, not at the next renewal.
          </PhaseHeading>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-6">
          {STEWARD.map((d) => (
            <StaggerItem key={d.name} className="h-full">
              <DeliverableCard d={d} />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <CycleRule />
        </Reveal>
      </Section>

      {/* ─────────────── WHAT'S NOT BUILT ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Being straight about it</EyebrowLight>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-[1.1]">
              Four of these nine ship today.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              The rest are marked <em className="italic">in build</em> or{" "}
              <em className="italic">planned</em>, and we&rsquo;ve said what
              exists behind each one. You could read that as early, and
              you&rsquo;d be right. It&rsquo;s also why the Founding Member
              programme exists and why it&rsquo;s only ten seats &mdash; the
              people who join now have a say in which of these gets built next.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Start with the free score
              </GradientButton>
              <GhostButtonLight href="/founding-members">
                Founding Members
              </GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
