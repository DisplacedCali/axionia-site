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
import ResearchPipeline from "@/components/ResearchPipeline";
import IncentiveMap from "@/components/IncentiveMap";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Methodology",
  description:
    "How Axionia adjusts a vendor's savings claim: selection bias, double-counted value, evidence transfer, engagement realism, secular trend and verifiability — the attribution framework behind every report, written down.",
};

/**
 * The six adjustments, and why there are six rather than four.
 *
 * This page carried four — selection bias, program overlap, evidence transfer,
 * engagement realism — which are exactly the four `ReportDemo` implements. The
 * Northrock report's attribution waterfall deducts a different four: selection
 * bias, double-counting, secular trend and no counterfactual. Two of four
 * disagreed, which read as two documents describing the same method
 * differently.
 *
 * They were not disagreeing. The method has six steps and each surface had
 * picked a different four. All six are listed here, with `modelled` marking
 * the ones the interactive report can move.
 *
 * The split is worth stating rather than hiding: four of these are dials, and
 * two of them are findings that come out of reading the vendor's actual study.
 * That is the honest difference between the free tool and the engagement.
 *
 * "Program overlap" renamed to "Double-counted value" on 2026-08-27, matching
 * the rest of the site — the old name asserted that the programs overlap,
 * which is a clinical claim we have no data to make. The claim we can make is
 * that the attributed value is counted more than once.
 */
const ADJUSTMENTS = [
  {
    n: "01",
    name: "Selection bias",
    q: "Who was actually in the study?",
    body: "Programs are usually evaluated on the people who enrolled — and people who enroll in a musculoskeletal program are people who already decided to do something about their back. They were going to improve at a higher rate than the general population regardless. Unless the study used a matched comparison group drawn the same way, some of the reported effect belongs to the enrollment decision, not the program.",
    effect: "Typically removes 30–40% of a claimed effect.",
    modelled: true,
  },
  {
    n: "02",
    name: "Double-counted value",
    q: "Who else is already being paid for this outcome?",
    body: "A new program rarely lands on empty ground. Care management, the PBM's clinical programs, the health plan's own outreach and an EAP may all touch the same member and the same claim. Each vendor counts the full saving, correctly, in isolation. Added together, the value claimed across a portfolio routinely exceeds what was ever there to claim — and no single program is positioned to see that happen.",
    effect: "Typically removes another 15–25%.",
    modelled: true,
  },
  {
    n: "03",
    name: "Evidence transfer",
    q: "Does this result move to your workforce?",
    body: "A result generated in a 40-year-old professional services population doesn't transfer cleanly to a 52-year-old manufacturing workforce with different injury patterns, different scheduling and different care-seeking behaviour. We score the distance between the study population and yours across several dimensions and discount accordingly.",
    effect: "Varies most — the single biggest driver of the adjusted figure.",
    modelled: true,
  },
  {
    n: "04",
    name: "Engagement realism",
    q: "What happens if fewer people show up?",
    body: "Almost every savings figure is quoted at an engagement rate the vendor achieved somewhere. It's the assumption vendors are least specific about and the one that moves the answer most, so we never accept it as fixed — we model across a range and show you where their number sits inside it.",
    effect: "Shown as a range, never a point estimate.",
    modelled: true,
  },
  {
    n: "05",
    name: "Secular trend",
    q: "Was this already happening without anyone?",
    body: "A category can improve on its own. Surgical rates fall, a drug goes generic, a national care pattern shifts. A program running through that period will show a saving whether or not it caused one, so we take out the movement the category was making anyway. Where a category's trend was already negative nationally, no program gets credit for matching it.",
    effect: "Removes whatever the market was doing without you.",
    modelled: false,
  },
  {
    n: "06",
    name: "Verifiability",
    q: "Was there anything to compare against?",
    body: "Some claims rest on a before-and-after inside the enrolled group with no comparison group at all. That is rarely dishonest — it is often all the vendor had — but it means the figure carries no evidence about what would have happened otherwise. Where nothing can be compared, we report the number as unverifiable rather than discounting it to a smaller number that would look more precise than it is.",
    effect: "Reported as unverifiable, never estimated.",
    modelled: false,
  },
];

const FAQ = [
  {
    q: "Isn't this what my broker already does?",
    a: "Partly — and if your broker is good, we'll say so. The difference is compensation. Most broker and consultant revenue rises as your benefit spend rises, which makes an honest recommendation to spend less structurally difficult. We take no commission from any vendor, carrier or broker, so the only thing we're optimising is whether the number holds up. We work alongside brokers regularly; we're not a replacement for one.",
  },
  {
    q: "What benchmark data are you comparing me to?",
    a: "Today: published industry survey data, public filings and regulatory sources, vendor-published outcomes, and two decades of prior modelling work across payer, provider and pharma. That's enough to place a portfolio credibly, and we'll tell you plainly when a comparison is directional rather than precise. Over time the benchmark becomes proprietary — every relationship adds to it — but we'd rather understate what we have now than overstate it.",
  },
  {
    q: "Do I have to switch anything or install software?",
    a: "No. There's nothing to roll out, no data feed to build, and no integration. You send us what you already have — vendor decks, renewal packets, benefit summaries — and we send back an analysis. If you never talk to us again, nothing breaks.",
  },
  {
    q: "What if the answer is that our programs are fine?",
    a: "Then that's the report. A finding of 'nothing to change here' is worth as much as a finding of savings — it's what stops you renegotiating something that's already working, or replacing a vendor who's performing. We'd rather be useful than dramatic.",
  },
  {
    q: "How can you analyse our programs without our claims data?",
    a: "Most of what determines whether a vendor's claim holds up isn't in your claims file — it's in the study design, the contract terms, the overlap with what you already run, and your workforce composition. Those come from documents you already have. Claims-level analysis is a deeper level of the relationship and needs a secure path we'll set up separately.",
  },
  {
    q: "Why is the report free? What's the catch?",
    a: "It's how we meet people, and it's the fastest way for you to judge the work without a sales process. There's no call attached to it and no obligation afterwards. If it's useful, the ongoing relationship is there; if it isn't, you've lost twenty minutes and gained a benchmark.",
  },
];

export default function Methodology() {
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
            <Eyebrow>Methodology</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              How a $180 claim{" "}
              <em className="italic">becomes a $54 expectation.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              We ask you not to take a vendor&rsquo;s number on faith. It would be
              hypocritical to then ask you to take ours. This is the framework behind
              every adjustment we make — written out, so you can disagree with it
              specifically rather than generally.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── THE SIX ADJUSTMENTS ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>The adjustments</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Six questions asked of every claim.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                None of these assume bad faith. A vendor reporting a real result from a
                real study is behaving reasonably — the problem is that the result was
                produced under conditions that aren&rsquo;t yours, and nobody adjusts
                for the difference before the number reaches your desk.
              </p>
              <p className="mt-4 text-[16px] leading-[1.7] text-gray-warm">
                Four of the six are dials — you can move them yourself on the{" "}
                <a href="/platform#report" className="text-blue underline">
                  interactive report
                </a>{" "}
                and watch the answer respond. The other two come out of reading
                the vendor&rsquo;s actual study, which is the honest difference
                between the free tool and an engagement.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-px bg-border border border-border">
            {ADJUSTMENTS.map((a) => (
              <StaggerItem
                key={a.n}
                className="bg-base p-8 md:p-10 grid md:grid-cols-[1fr_2fr] gap-5 md:gap-12"
              >
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[13px] text-gray-cool">{a.n}</span>
                    <h3 className="font-serif text-2xl">{a.name}</h3>
                  </div>
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
                    {a.modelled ? "Modelled in the demo" : "From reading the study"}
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-blue leading-relaxed">
                    {a.q}
                  </p>
                </div>
                <div>
                  <p className="text-[15px] leading-[1.75] text-gray-warm max-w-measure">
                    {a.body}
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-caution">
                    {a.effect}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-8 border-l-2 border-blue pl-6 py-1 max-w-2xl">
              <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
                Every one of these adjustments is visible in your report, with the
                figure we used and where it came from. Disagree with one and the model
                re-runs.
              </p>
            </div>
            <div className="mt-8">
              <GhostButton href="/platform#report">
                See the assumption ledger
              </GhostButton>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── INSIDE THE ANALYSIS (dark) ─────────────── */}
      <DarkSection>
        <Reveal>
          <EyebrowLight>Inside the analysis</EyebrowLight>
          <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight max-w-2xl">
            What actually runs{" "}
            <em className="italic">when we look at a vendor&rsquo;s claim.</em>
          </h2>
          <p className="mt-6 text-[15px] leading-[1.7] text-gray-cool max-w-measure">
            Six research passes run against your intake — four at once, then two
            more — before anything reaches the attribution model. The pipeline
            ends on human review, which is the point: nothing is published
            automatically.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-12">
            <ResearchPipeline />
          </div>
        </Reveal>
      </DarkSection>

      {/* ─────────────── INCENTIVES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-10">
            <Eyebrow>Follow the money</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Everyone advising you gets paid.{" "}
              <em className="italic">
                Almost none of them get paid less if you overspend.
              </em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              A method is only worth as much as the independence behind it. You
              have no shortage of people telling you things about your benefit
              programs — it&rsquo;s worth knowing what happens to each of their
              revenue when your spend goes up.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <IncentiveMap />
        </Reveal>
      </Section>

      {/* ─────────────── THE LINE NOBODY CROSSES ───────────────
          Placed immediately before the Limits section on purpose. This makes
          a real capability claim, and the very next thing a reader sees is
          where that claim stops — which is the only honest way to make it.

          The claim is RANK, never EQUIVALENCE. "Under these weights the
          stipend outranks the fourth point solution" is supported by the
          model. "The stipend is worth $40 PMPM in retention" is the /methodology
          commitment below, broken. See lib/objectives.ts. */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>The comparison nobody runs</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              A gym membership and an MSK program{" "}
              <em className="italic">compete for the same dollar.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              They are never compared, because they aren&rsquo;t sold in the same
              units. Point solutions are quoted in avoided claims. Perks are
              quoted in retention and attraction — or not quoted at all. Two
              currencies, one budget line, and no exchange rate.
            </p>
            <p className="mt-4 text-[16px] leading-[1.7] text-gray-warm">
              Nobody in the advice chain crosses that line, and not because
              anyone is failing at their job. Perks are largely unbrokered:
              there&rsquo;s no commission, no catalogue entry and no reason for
              the question to reach the table. A musculoskeletal vendor
              cannot recommend a fitness stipend instead of itself.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              One scale, both halves
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              Every program in our library — clinical and not — carries the same
              four scores: perceived value, financial leverage, retention, and
              clinical impact. That is what allows a stipend and a point
              solution to appear in one ranking rather than two conversations.
            </p>
          </StaggerItem>
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              It bites hardest at the top
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              High-paid, hard-to-replace workforces have low claims utilisation
              relative to compensation. The clinical case is weakest precisely
              where the retention case is strongest — so this is the population
              where the standard stack is most likely to be the wrong answer.
            </p>
          </StaggerItem>
          <StaggerItem className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              We rank. We don&rsquo;t price.
            </div>
            <p className="text-[14px] leading-[1.7] text-gray-warm">
              Under a retention-weighted objective set we will tell you the
              stipend outranks the fourth overlapping point solution. We will
              not tell you it is worth forty dollars a month in retention,
              because nobody honestly can. See below.
            </p>
          </StaggerItem>
        </Stagger>
      </Section>

      {/* ─────────────── WHAT WE WON'T CLAIM (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>Limits</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-xl">
                What this method{" "}
                <em className="italic">can&rsquo;t tell you.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                A framework that claims to answer everything is the same kind of
                overreach we exist to catch. Here&rsquo;s where ours stops.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid gap-8 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                We model ranges, not outcomes
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                We can tell you what a program is likely worth under stated assumptions.
                We cannot tell you what it will return. Anyone who says otherwise is
                selling something.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Soft outcomes stay soft
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Satisfaction, retention and productivity effects are real but too
                confounded by compensation, management and the labour market to
                attribute to a benefit decision with any honesty. We&rsquo;ll discuss
                them; we won&rsquo;t put a number on them.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                We aren&rsquo;t your actuary or your counsel
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Our analysis informs a decision; it doesn&rsquo;t certify a reserve or
                clear a compliance question. Where something needs an actuarial opinion
                or legal review, we&rsquo;ll say so rather than approximate it.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── FAQ ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>Straight answers</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              The questions we actually get asked.
            </h2>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-x-14 gap-y-11">
          {FAQ.map((f) => (
            <StaggerItem key={f.q}>
              <h3 className="font-serif text-xl md:text-2xl leading-snug mb-3">
                {f.q}
              </h3>
              <p className="text-[15px] leading-[1.75] text-gray-warm">{f.a}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Start here</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              Run it on something you&rsquo;re actually being sold.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              The fastest way to judge a method is to point it at a claim you already
              have on your desk. Free, reviewed by a person, back within 24 hours.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Get your free report
              </GradientButton>
              <GhostButtonLight href="/platform">See the platform</GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
