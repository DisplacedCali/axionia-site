import {
  Eyebrow,
  EyebrowLight,
  Section,
  DarkSection,
  GhostButtonLight,
  GradientButton,
  GradientRule,
} from "@/components/ui";
import CountUp from "@/components/CountUp";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

const inclusions = [
  {
    title: "Five years, paid forward",
    body: "Founding members prepay their full five-year engagement at enrollment — capital that funds the platform's build-out directly — in exchange for a rate that's locked for the life of the term.",
  },
  {
    title: "A seat on the council",
    body: "Founding members sit on the council shaping the direction of benefits management and HR analytics — not an advisory board in name only.",
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

export default function FoundingMembers() {
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
              10 seats. <em className="italic">Ten years of influence.</em>
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
            <div className="mt-10">
              <GradientButton href="/contact?interest=founding-member">
                Inquire about founding membership
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
                <CountUp to={10} />
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

      {/* ─────────────── INCLUSIONS ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <Eyebrow>What&rsquo;s included</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              What founding members get
            </h2>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-x-14 gap-y-12">
          {inclusions.map((item, i) => (
            <StaggerItem key={item.title} className="group relative pl-16">
              <span className="absolute left-0 top-0 font-mono text-[13px] text-gray-cool transition-colors duration-300 group-hover:text-blue">
                0{i + 1}
              </span>
              <span className="absolute left-[9px] top-7 bottom-1 w-px bg-border overflow-hidden">
                <span className="block h-full w-full origin-top scale-y-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-y-100" />
              </span>
              <h3 className="font-serif text-2xl mb-2.5">{item.title}</h3>
              <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                {item.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── WHY ONLY 10 ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-3xl">
              <Eyebrow>Why only 10</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                A council only works if{" "}
                <em className="italic">everyone&rsquo;s voice actually gets heard.</em>
              </h2>
              <p className="mt-7 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
                The founding cohort is intentionally small. Ten employers is enough to
                represent real diversity of workforce composition and industry, and small
                enough that every member&rsquo;s perspective genuinely shapes what we
                build next — rather than being one voice lost in a large advisory board.
              </p>
            </div>
          </Reveal>
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
              Total commitment, payment structure, and enrollment details for the
              founding cohort are discussed one-on-one. Reach out and we&rsquo;ll walk
              through whether it&rsquo;s a fit.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/contact?interest=founding-member">
                Inquire about founding membership
              </GradientButton>
              <GhostButtonLight href="/platform">See the platform</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
