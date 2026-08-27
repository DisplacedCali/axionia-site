import Link from "next/link";
import {
  Eyebrow,
  EyebrowLight,
  Section,
  DarkSection,
  GhostButtonLight,
  GradientButton,
  GradientRule,
} from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Where we fit",
  description:
    "Who else looks at benefit decisions, who pays them, and the one thing none of them is built to do. Named, and generous about what each is genuinely good at.",
};

/**
 * The positioning page, and the order of its sections is the argument.
 *
 * The first draft led with four sections of what Axionia does NOT do and one
 * short section of what it is. A reader would have left knowing what this
 * isn't. Collaborative was supposed to be the tone, not the content — so the
 * claim comes first and largest, the reassurance is one paragraph, and the
 * generous detail is limited to the two organisations a buyer might actually
 * be choosing between.
 *
 * PHTI and the fee-only movement were cut from here on purpose. PHTI is a
 * citation and belongs on /methodology; Health Rosetta is channel and belongs
 * on /for/brokers. Neither is something a buyer weighs against us, and putting
 * them here made the page longer without making it more useful.
 *
 * Named here, categories on the home page. The home table calling brokers
 * conflicted while /for/brokers pitches them as distribution partners would be
 * a conflict on the highest-traffic page on the site. Here the framing is
 * compensation design rather than character, which survives being said with
 * names attached.
 */
const MAP = [
  {
    who: "Brokers and consultants",
    names: "Mercer, Aon, WTW, Lockton, Gallagher, Alliant, USI, Marsh McLennan Agency",
    paid: "Commission and overrides",
    good: "Market access, placement, plan design, service, and knowing what exists in a market that changes every year.",
    stops:
      "Within a category they compare bids properly. Across categories there is no common denominator to anchor to — a gap in the market rather than in their work.",
  },
  {
    who: "Vendor-funded validation",
    names: "Validation Institute, Beyond Banyan",
    paid: "The vendor being validated",
    good: "Methodology critique that is frequently excellent, and better than most buyers could produce alone.",
    stops: "The buyer is not the client.",
  },
  {
    who: "Claims analytics",
    names: "Artemis Console, Springbuk, Innovu, Merative, MedInsight",
    paid: "You",
    good: "What actually happened inside your own claims, measured rather than modeled.",
    stops:
      "Descriptive and post-purchase. It grades what you already bought, one program at a time.",
  },
  {
    who: "Actuarial firms",
    names: "Milliman, Wakely, Axene, Aon Health Analytics",
    paid: "You",
    good: "All of it, properly, by people who do this for a living. The honest answer to “who else does this”.",
    stops:
      "Bespoke six-figure engagements, one program at a time, aimed at jumbo employers.",
  },
  {
    who: "Independent assessors",
    names: "PHTI, ICER",
    paid: "Philanthropy",
    good: "Category verdicts nobody can buy, from organisations that take no money from what they assess.",
    stops: "Category-level, and not about your population.",
  },
];

export default function WhereWeFit() {
  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-48 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #4AC9DC 0%, #2463EB 55%, transparent 72%)",
          }}
        />
        <Section className="relative pt-24 pb-16">
          <Reveal>
            <Eyebrow>Where we fit</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              This is a job that didn&rsquo;t exist.{" "}
              <em className="italic">Not a job someone else was doing badly.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Employers already buy several kinds of help with benefit decisions,
              and most of them should keep buying it. This is the map — who does
              what, who pays them, and the one thing none of them is built to do.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── WHAT THIS IS ───────────────
          The largest section, and first. See the header note. */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-10">
            <Eyebrow>What this is</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Every cell is occupied{" "}
              <em className="italic">but one.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Sort the market on four questions — who pays, before or after the
              purchase, one program or the whole portfolio, your population or
              the category — and the map fills in almost completely.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-2 gap-px bg-border border border-border">
          {[
            {
              k: "Employer-paid",
              v: "We are not paid more when your costs rise, take no commission, and have no stake in which vendor you choose. Fees are a fixed share of advised spend, agreed before the work starts.",
            },
            {
              k: "Before the signature",
              v: "We model what a claim is worth rather than grading what already happened. Analytics tells you whether what you bought worked; this tells you whether to buy it.",
            },
            {
              k: "Across the whole portfolio",
              v: "Five vendors can each count the same avoided episode once. Untangling that is the part nobody else does at any price, because everyone else evaluates one program at a time.",
            },
            {
              k: "Adjusted to your workforce",
              v: "A category average is not a finding. The number has to be about your people — their age mix, their shifts, their exposure, and whether they can reach the thing you bought them.",
            },
          ].map((c) => (
            <StaggerItem key={c.k} className="bg-base p-7 md:p-9">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                {c.k}
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-warm">{c.v}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── THE MAP ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <Eyebrow>The map</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Everyone else, <em className="italic">and what they&rsquo;re for.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                Named, because being vague here would read as not having looked.
                The third column is not a courtesy — each of these does something
                we do not.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left bg-base border border-border">
                <thead>
                  <tr className="border-b border-border">
                    {["Who", "Who pays", "What they're good at", "What it doesn't cover"].map(
                      (h) => (
                        <th
                          key={h}
                          className="font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-gray-cool align-bottom p-5 pb-3"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {MAP.map((r) => (
                    <tr key={r.who} className="align-top border-b border-border last:border-b-0">
                      <td className="p-5 w-[21%]">
                        <span className="block text-[15px] leading-snug text-navy">
                          {r.who}
                        </span>
                        <span className="block mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] leading-[1.6] text-gray-cool">
                          {r.names}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-[11px] leading-[1.6] text-blue w-[14%]">
                        {r.paid}
                      </td>
                      <td className="p-5 text-[14px] leading-[1.65] text-gray-warm w-[33%]">
                        {r.good}
                      </td>
                      <td className="p-5 text-[14px] leading-[1.65] text-gray-warm w-[32%]">
                        {r.stops}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── KEEP WHAT YOU HAVE ───────────────
          One paragraph. It was four sections in the first draft, which made a
          positioning page read as a disclaimer. */}
      <Section className="py-16 sm:py-20 border-t border-border">
        <Reveal>
          <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-14 items-start">
            <Eyebrow>Keep what you have</Eyebrow>
            <div className="max-w-2xl">
              <p className="font-serif font-light text-2xl md:text-[30px] leading-[1.4] text-navy">
                Nothing here requires removing anything.
              </p>
              <p className="mt-6 text-[16px] leading-[1.75] text-gray-warm max-w-measure">
                We don&rsquo;t place coverage, take commission, hold the client
                relationship or want the renewal, so your broker stays your
                broker. If you run claims analytics, keep it — it tells you what
                happened inside your claims, which we don&rsquo;t do and which
                you need. The analysis is the entire product, and it is more
                useful to everyone in the room when it comes from somewhere with
                nothing at stake in the outcome.
              </p>
              <Link
                href="/for/brokers"
                className="inline-block mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
              >
                For brokers and consultants →
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ─────────────── THE TWO NEAREST ───────────────
          Naming the nearest competitor and being precise about the boundary is
          the highest-trust move available on this page. The instinct to soften
          it is the one to resist. */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <Eyebrow>The two you might be weighing</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                The closest, <em className="italic">and the best.</em>
              </h2>
            </div>
          </Reveal>

          <Stagger className="grid md:grid-cols-2 gap-10">
            <StaggerItem className="border-l-2 border-blue pl-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-3">
                Artemis Console — the closest
              </div>
              <p className="text-[15px] leading-[1.75] text-gray-warm">
                Artemis grades point solutions across engagement, care,
                utilisation, satisfaction and clinical outcomes, in your own
                claims data. It is the closest anyone has come, and it does that
                job genuinely well.
              </p>
              <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm">
                It is descriptive, single-vendor and post-purchase. It tells you
                whether what you bought worked. We tell you whether to buy it —
                and what happens to the arithmetic once you own eight of them.
              </p>
            </StaggerItem>

            <StaggerItem className="border-l-2 border-slate pl-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate mb-3">
                Milliman — the best
              </div>
              <p className="text-[15px] leading-[1.75] text-gray-warm">
                Milliman markets independent third-party review of vendor ROI
                methodology directly, and does it properly. There is no version
                of this page where we claim to do it better.
              </p>
              <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm">
                It is bespoke, six figures, one program at a time, and aimed at
                jumbo employers. If you are large enough to buy it, buy it. Most
                employers are not, which is the gap this exists to fill.
              </p>
            </StaggerItem>
          </Stagger>
        </Section>
      </div>

      {/* ─────────────── CONVERSION ─────────────── */}
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
              Free, reviewed by a person, and in your inbox within 24 hours. It
              costs nothing and has no sales call attached to it — including if
              the answer turns out to be that what you already have is working.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Get your free report
              </GradientButton>
              <GhostButtonLight href="/contact?interest=partnership">
                Talk about a partnership
              </GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
