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
import DoubleCountedValue from "@/components/DoubleCountedValue";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: { absolute: "Axionia — Independent analysis of employee benefit programs" },
  description:
    "A vendor says their program saves you money. Axionia checks whether that's true — then tells you what the same budget could buy instead. Independent, with every assumption on the table.",
};


/**
 * Who actually looks at a benefit decision, and what each of them is for.
 *
 * This replaced three abstract method failures — reviewed-not-evaluated,
 * judged-in-isolation, not-disinterested. All three were true and none named
 * anybody, which meant a reader already carrying Springbuk, or three years
 * into a Mercer contract, could not tell whether we replace them, sit beside
 * them, or duplicate them. That is the question a buyer actually has.
 *
 * Framed as market design rather than as accusation, and deliberately generous
 * in the third column. A clean sweep reads as marketing; conceding that
 * actuarial firms do this properly and that vendor-funded validation produces
 * real critique is what makes the closing line land.
 *
 * Categories, not firms, and no Axionia row. Naming Mercer and Aon as
 * conflicted on the home page while /for/brokers pitches them as distribution
 * partners is a conflict we would have to live with; and a table with us alone
 * in the winning row is a competitive chart, which is the opposite of the
 * position. The prose underneath carries it instead. Named detail lives on
 * /where-we-fit.
 *
 * The broker row's language is lifted from /for/brokers deliberately — "a gap
 * in the market rather than in your work" is already the site's line, and two
 * pages agreeing is worth more than either saying it once.
 */
const LANDSCAPE = [
  {
    who: "Brokers and consultants",
    paid: "Commission and overrides from the market",
    good: "Market access, placement, plan design, service. Most employers should keep theirs.",
    why: "Across categories there is no common denominator and no independent benchmark to anchor to — a gap in the market rather than in their work.",
  },
  {
    who: "Vendor-funded validation",
    paid: "The vendor being validated",
    good: "Real methodology critique, often better than a buyer could do alone.",
    why: "The buyer isn't the client.",
  },
  {
    who: "Claims analytics",
    paid: "You",
    good: "Showing what actually happened inside your own claims.",
    why: "Looks backward at what you already bought, one program at a time.",
  },
  {
    who: "Actuarial firms",
    paid: "You",
    good: "All of it, properly. The honest answer to \u201cwho else does this\u201d.",
    why: "Bespoke, six figures, one program at a time, aimed at jumbo employers.",
  },
  {
    who: "Independent assessors",
    paid: "Philanthropy",
    good: "Category verdicts nobody can buy.",
    why: "Category-level, and not about your population.",
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
                  else the same money could buy — including options nobody sells
                  you, because they carry no commission and appear in no
                  catalogue.
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
          negligence for a problem that was built around them.

          The headline stayed and the evidence under it changed. It asserted
          something the table now demonstrates, which is the whole reason this
          section was the right place for the landscape rather than a ninth
          section arguing the same thing again. */}
      <DarkSection>
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
            committees, finance. It isn&rsquo;t that nobody is paying attention.
            It&rsquo;s that attention and scrutiny aren&rsquo;t the same thing,
            and almost nobody in that chain is positioned to supply the second
            one.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
            Five kinds of organisation look at benefit decisions. Each is good
            at something, and most employers need more than one of them. None is
            built for this particular job.
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-12 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr>
                  {["Who looks", "Who pays them", "What they're good at", "Why it isn't this"].map(
                    (h) => (
                      <th
                        key={h}
                        className="font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-white/40 align-bottom pb-3 pr-8 border-b border-white/20"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {LANDSCAPE.map((r) => (
                  <tr key={r.who} className="align-top">
                    <td className="py-5 pr-8 border-b border-white/10 text-[15px] leading-snug w-[19%]">
                      {r.who}
                    </td>
                    <td className="py-5 pr-8 border-b border-white/10 font-mono text-[11px] leading-[1.6] tracking-[0.02em] text-teal w-[19%]">
                      {r.paid}
                    </td>
                    <td className="py-5 pr-8 border-b border-white/10 text-[14px] leading-[1.65] text-gray-cool w-[31%]">
                      {r.good}
                    </td>
                    <td className="py-5 border-b border-white/10 text-[14px] leading-[1.65] text-gray-cool w-[31%]">
                      {r.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-12 border-l-2 border-teal pl-6 max-w-2xl">
            <p className="text-[16px] leading-[1.75] text-gray-cool">
              An actuarial firm will do this for a jumbo employer at six figures,
              one program at a time. Nobody does it for the nine-hundred-person
              manufacturer, and nobody untangles double-counted value across a
              whole portfolio at any price.
            </p>
            <p className="mt-4 font-serif italic text-xl md:text-2xl leading-snug text-white">
              This is a job that didn&rsquo;t exist, not a job someone else was
              doing badly.
            </p>
          </div>
          <div className="mt-8">
            <GhostButtonLight href="/where-we-fit">
              Where we fit, in detail
            </GhostButtonLight>
          </div>
        </Reveal>
      </DarkSection>

      {/* ─────────────── THE ARITHMETIC ───────────────
          One section, two views. Cost accumulates cleanly; claimed value does
          not — and the second fact only means anything once you have seen the
          first. These ran as two full-height sections with two headlines and
          about 115 words of setup between them, on adjacent bg-base-2 blocks,
          so they already merged visually without the benefit of having been
          edited together.

          Deliberately on the plain base rather than base-2: the radar section
          below is base-2, and two tinted sections in a row is what produced
          the collapse this merge is fixing.

          Written so a vendor could read it without being insulted — every
          program here is reporting its own results correctly, and the
          duplication is a property of owning all five, which is not a fact any
          one of them is in a position to know. That sentence lives in
          DoubleCountedValue's own footnote, directly under the chart, rather
          than here. Saying it in both places was the repetition this merge
          exists to remove. */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>The arithmetic nobody does</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              The costs add up.{" "}
              <em className="italic">The savings don&rsquo;t.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Point solutions arrive one at a time — telehealth, then MSK, then
              behavioral health, then weight management. Each looks trivial on
              the day it&rsquo;s approved, and each came with a study showing it
              pays for itself. The costs accumulate cleanly. The savings do not:
              an avoided surgery can only be avoided once, and when two vendors
              both count it, the arithmetic across your portfolio quietly
              exceeds what was ever there to claim.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-5">
            What you pay
          </div>
          <PmpmStack />
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-14 mb-12 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
            Costs only ever add. Claimed savings don&rsquo;t — and nobody is
            double-charging you for that. The same result is simply being
            counted more than once, and no single program is positioned to see
            it happen.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-5">
            What you&rsquo;re actually getting
          </div>
          <DoubleCountedValue />
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-12 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
            And value was never only claims cost. Every one of these programs
            also claims time back in the seat, fewer absence days, better
            productivity — against the same people, in the same year. Those
            claims are harder to check than a medical trend line, which is
            exactly why nobody checks them. Sorting out what is genuinely
            additive is the difference between a number you can take into a
            renewal and a number you can only repeat.
          </p>
        </Reveal>
      </Section>

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
                The same scale ranks things you don&rsquo;t currently run. Some of
                the strongest cost nothing at all.
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
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
              No software to roll out &middot; no data feed to build
            </p>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
