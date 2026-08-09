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
import WhoItsFor from "@/components/WhoItsFor";
import PmpmStack from "@/components/PmpmStack";
import BenefitOverlap from "@/components/BenefitOverlap";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: { absolute: "Axionia — Independent analysis of employee benefit programs" },
  description:
    "A vendor says their program saves you money. Axionia checks whether that's true — then tells you what the same budget could buy instead. Independent, with every assumption on the table.",
};


/**
 * The five ways a well-attended review still fails. Written as method
 * failures rather than accusations — none of these require anyone in the
 * chain to be lazy or dishonest, which is both more accurate and the only
 * version an HR leader can forward to their own committee.
 */
const REVIEW_GAPS = [
  {
    k: "Reviewed, not evaluated",
    v: "Reading a vendor's ROI study and assessing one are different skills. Judging whether an effect survives its own study design takes training most people in the chain were never expected to have.",
  },
  {
    k: "Judged in isolation",
    v: "Each program is approved on its own merits, in its own meeting. Nobody is asked whether the fourth one overlaps the first three — so savings get counted twice and nobody owns the arithmetic.",
  },
  {
    k: "Averaged, not specific",
    v: "Results get quoted against a broad national base rather than your covered population. Your actual age mix, injury patterns, geography and care-seeking behaviour are what determine whether any of it transfers.",
  },
  {
    k: "Disconnected from strategy",
    v: "A recommendation can be defensible in benefits terms and still pull against the talent strategy it's meant to support. The two conversations usually happen in different rooms.",
  },
  {
    k: "Not disinterested",
    v: "Preference, familiarity and relationship shape which options get to the table at all. Most of that is ordinary human judgment rather than bad faith, which is exactly why it goes unexamined.",
  },
];

/**
 * The five principles, plus one that was missing.
 *
 * "Independent Value Assessment" claimed only FINANCIAL independence — no
 * commission, no stake in the vendor. True, and every fee-only advisor says it.
 *
 * The independence that is actually rare is from HISTORY. The broker who placed
 * a program three years ago cannot recommend removing it without indicting
 * their own advice. The benefits leader who championed it is in the same
 * position, and the CFO has now approved it four times. Everyone in the room is
 * implicated in an incumbency. We are the only party with no past
 * recommendation to defend — which is what makes it possible for us to propose
 * a different mix rather than only grade the existing one.
 *
 * That is also the honest relationship between the two halves of this business.
 * The audit is not a separate service from the design; it is what earns the
 * right to do the design. Anyone can propose a benefit mix. Only someone who
 * has independently de-duplicated the current one knows what the budget
 * actually is.
 */
const principles = [
  {
    title: "Independent Value Assessment",
    body: "We aren't paid more when your costs go up. Our analysis has no stake in which vendor you choose.",
  },
  {
    title: "No Incumbency to Defend",
    body: "We didn't place your current programs and we have no past recommendation to protect. Everyone else in the room does — which is why the option to do something different so rarely reaches the table.",
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

      {/* ─────────────── IN PLAIN TERMS ───────────────
          Deliberately jargon-free and placed second. Real feedback: a smart
          non-specialist read the whole site and couldn't tell what it was.
          Nothing above this point names a concrete thing that happens. */}
      <div className="border-t border-border">
        <Section className="py-16 sm:py-20">
          <Reveal>
            <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-14 items-start">
              <Eyebrow>In plain terms</Eyebrow>
              <div className="max-w-2xl">
                <p className="font-serif font-light text-2xl md:text-[34px] leading-[1.35] text-navy">
                  Companies buy health programs for their employees — diabetes
                  management, mental health support, physical therapy. The company
                  selling the program also supplies the study proving it works.
                  That study gets read by a lot of people and checked by almost
                  none of them.
                </p>
                <p className="mt-6 text-[16px] leading-[1.75] text-gray-warm max-w-measure">
                  We check it. We take the vendor&rsquo;s claim apart, adjust it for
                  your actual covered population, and tell you what the program is
                  realistically worth — showing every assumption we used, so you
                  can argue with any of them.
                </p>
                <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                  Then we do the part that&rsquo;s worth more: we tell you what
                  else the same money could buy. We didn&rsquo;t choose any of
                  your current programs, so we have no reason to leave one in
                  place — including options nobody sells you, because they
                  carry no commission and appear in no catalogue.
                </p>
                <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                  No software to roll out, no data feed to build. You tell us
                  what you&rsquo;re running and what you&rsquo;re being sold; we
                  tell you what it&rsquo;s worth and what a better mix looks
                  like.
                </p>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── WHO IT'S FOR ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <WhoItsFor />
        </Section>
      </div>

      {/* ─────────────── THE PROBLEM (dark) ───────────────
          Not "nobody looks at this." Plenty of people look at it. The failure
          is in who's looking and how — which is a more accurate diagnosis and
          a more respectful one, because it doesn't accuse the buyer of
          negligence for a problem that was built around them. */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>The problem</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1] max-w-xl">
                Fifteen people reviewed it.
                <br />
                <em className="italic">None of them checked it.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                A benefit decision passes through more hands than almost anything
                else a company buys — brokers, carriers, consultants, internal
                committees, finance. It isn&rsquo;t that nobody is paying
                attention. It&rsquo;s that attention and scrutiny aren&rsquo;t
                the same thing, and almost nobody in that chain is positioned to
                supply the second one.
              </p>
            </Reveal>
            <Reveal delay={0.22}>
              <p className="mt-6 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Every one of those reviews is reasonable on its own terms. Added
                together they still don&rsquo;t constitute a check.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid gap-7 lg:pt-4">
            {REVIEW_GAPS.map((g) => (
              <StaggerItem key={g.k} className="border-t border-white/15 pt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                  {g.k}
                </div>
                <p className="text-[15px] leading-[1.7] text-gray-cool">{g.v}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── THE STACK ───────────────
          The abstract market number above, made personal. Every one of these
          was cheap on the day it was approved, which is exactly why nobody
          has ever summed them. */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>The stack nobody adds up</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              A dollar here. Six dollars there.{" "}
              <em className="italic">Then it&rsquo;s seven figures.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Point solutions arrive one at a time — telehealth, then MSK, then
              behavioral health, then weight management. Each is priced per member per
              month, each looks trivial in isolation, and each came with a study
              showing it pays for itself.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <PmpmStack />
        </Reveal>
      </Section>

      {/* ─────────────── THE OVERLAP ───────────────
          The cost side accumulates; the savings side doesn't. This is
          REVIEW_GAPS #2 ("nobody is asked whether the fourth one overlaps
          the first three") turned into arithmetic. Placed immediately after
          the stack because it's the same population seen from the other
          direction — what you're paying, then what you're actually getting.

          Written so a vendor could read it without being insulted: every
          program here is reporting its own results correctly. The overlap
          is a property of owning all five, which is not a fact any one of
          them is in a position to know. */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>The savings nobody de-duplicates</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Five programs. Five sets of savings.{" "}
                <em className="italic">One population.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                An avoided surgery can only be avoided once. When the MSK vendor
                and the navigation vendor both count it, the arithmetic across
                your portfolio quietly exceeds the spend available to save —
                and because each program was approved in its own meeting,
                against its own study, nobody is in a position to notice.
              </p>
              <p className="mt-4 text-[16px] leading-[1.7] text-gray-warm">
                None of this requires a vendor to overstate anything. Each is
                reporting what its own program did, correctly, in isolation.
                The overlap is a property of owning all five at once.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <BenefitOverlap />
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── LIVE PRODUCT: RADAR ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
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
            <div className="bg-base border border-border p-5 sm:p-8 md:p-12">
              <RadarPreview />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <GradientButton href="/request-report">Get your free report</GradientButton>
              <GhostButton href="/platform">See the full platform</GhostButton>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
              Illustrative composite profile — no cost, no commitment
            </p>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── AND THEN THE DESIGN ───────────────
          The site was an auditor. Counted across every page, diagnostic
          language ran roughly twenty to one against generative — everything
          promised to check, adjust, de-duplicate and verify, and almost
          nothing promised a better mix.

          That undersells the firm and it quietly recreates the HR problem: an
          audit frame implicates past decisions no matter how carefully it's
          worded. A design frame doesn't, because nobody has to have been wrong
          for a better option to exist.

          The audit is NOT dropped. It's the half that earns the other one —
          anyone can propose a mix, only someone who has independently
          de-duplicated the current one knows what the budget really is. The
          order is the product. */}
      <div className="border-t border-border">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>And then the harder half</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Knowing what it&rsquo;s worth is the start.{" "}
                <em className="italic">Knowing what else it could buy is the point.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                Independent analysis of what you already run tells you the real
                size of the budget. It doesn&rsquo;t, on its own, tell you
                whether that budget is pointed at the right things. Those are two
                different jobs, and the second one is where the money is.
              </p>
              <p className="mt-4 text-[16px] leading-[1.7] text-gray-warm">
                We do both, in that order, because the order matters. A mix
                proposed without an audit behind it is just another opinion.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                We audit what exists
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm">
                Claims de-duplicated, selection adjusted, every program scored on
                one scale against your covered population. This is the part that
                establishes what the budget actually is, as opposed to what the
                invoices add up to.
              </p>
            </StaggerItem>
            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                Then we design against it
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm">
                The same scale ranks things you don&rsquo;t currently run — including
                options nobody sells you, because they carry no commission and
                appear in no catalogue. Some of the strongest cost nothing at all.
              </p>
            </StaggerItem>
            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                Balanced across your people
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm">
                A single mix rarely serves everyone equally. We model it by
                workforce group, so the result answers each group on the axis
                that group actually feels — inside one budget, not by growing it.
              </p>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.1}>
            <div className="mt-10 border-l-2 border-blue pl-6 py-1 max-w-2xl">
              <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
                We didn&rsquo;t place any of it, so we have nothing to defend by
                leaving it alone.
              </p>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── PRINCIPLES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <Eyebrow>What we believe</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Six principles
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
      <Section className="border-t border-border py-16 sm:py-24">
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
              on top of the standard service. Common at large employers, where the
              analysis is identical and only the deployment differs.
            </p>
            <div className="mt-7">
              <GhostButton href="/pricing">View pricing options</GhostButton>
            </div>
          </StaggerItem>

          {/*
            Replaced the founding-member card. That offer is now discussed
            directly rather than advertised — a public page for it made the
            company read as raising rather than operating, which is the opposite
            of what a buyer evaluating a five-year vendor wants to see.
            Research engagements are real revenue and had no homepage presence.
          */}
          <StaggerItem className="group relative border border-border bg-base p-9 transition-colors duration-300 hover:border-navy overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[3px] bg-axionia-gradient" />
            <Eyebrow>Research Engagements</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              Not an employer? <em className="italic">We look from the outside.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm">
              Commissioned analysis for private equity, investors in benefits
              vendors, consultants and competitive research — the same attribution
              framework, pointed at someone else&rsquo;s portfolio or claim, with a
              hard wall between it and client work.
            </p>
            <div className="mt-7">
              <GhostButton href="/research">See research engagements</GhostButton>
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
              A few minutes to request, reviewed by a person, and in your inbox within
              24 hours. It benchmarks your portfolio against comparable employers,
              costs nothing, and has no sales call attached to it.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Get your free report</GradientButton>
              <GhostButtonLight href="/contact">Talk to us first</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
