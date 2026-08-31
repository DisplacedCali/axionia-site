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
import ClaimCheck from "@/components/ClaimCheck";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Check a vendor's claim",
  description:
    "Before you read the clinical study, check whether the vendor's own numbers are possible. Ninety seconds, four inputs, and it settles a surprising number of meetings.",
};

/**
 * The outbound door-opener.
 *
 * It gives something away and asks for nothing, which is the whole design.
 * A benefits leader can run this on the deck sitting on their desk and be
 * better off whether or not they ever reply to us.
 *
 * NO VENDOR IS NAMED, deliberately. The worked example below is real — the
 * figures come from a published claim and that company's own filing with
 * securities regulators — but naming it turns a method into an attack, invites
 * a legal letter, and contradicts the position taken on /where-we-fit that
 * everyone in this market is good at something. The reader can apply it to
 * whoever pitched them, which is more useful anyway.
 *
 * The page also carries no benchmark data of our own. Every number in the tool
 * is typed by the visitor. That is what makes it impossible to argue with, and
 * it is why the tool is more persuasive than any chart we could put here.
 */

const LIMITS = [
  {
    k: "It does not tell you the programme is bad",
    v: "A claim can fail this test and the programme can still be worth buying. What fails is the headline, and what that changes is the price you should pay rather than whether to buy at all.",
  },
  {
    k: "It does not check the study",
    v: "Selection bias, population fit, engagement realism and whether there was a comparison group at all are separate questions. This test just decides whether they are worth asking.",
  },
  {
    k: "It does not need your claims data",
    v: "Two of the four inputs are on your renewal packet and one is on the vendor's own slide. That is the point — you can run it in the meeting.",
  },
];
export default function CheckAClaim() {
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
            <Eyebrow>The ninety-second test</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              Before you argue about whether it works,{" "}
              <em className="italic">check whether the number is possible.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              Most vendor savings claims can be tested in about ninety seconds,
              with four numbers and one division, before anyone opens a clinical
              study. It settles more meetings than the study does.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── THE TOOL ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-10">
            <Eyebrow>Run it</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Four numbers. <em className="italic">Two of them you already have.</em>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              Covered lives and annual plan spend are on your renewal packet. The
              claimed saving is on the vendor&rsquo;s slide. Engagement is the one
              they are least specific about, and the one that moves the answer
              most.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ClaimCheck />
        </Reveal>
      </Section>

      {/* ─────────────── THE WORKED EXAMPLE ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <Eyebrow>A real one</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                The same claim, <em className="italic">read two ways.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                A large digital physical therapy company published a saving of
                $2,941 per member per year — a 3.14&times; return. We have not
                named it, because the point is the shape of the arithmetic rather
                than the company. You will recognise the shape.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-caution mb-3">
                What the headline implies
              </div>
              <div className="font-serif font-light text-3xl leading-none tabular-nums text-caution-dark">
                29.4%
              </div>
              <p className="mt-4 text-[14px] leading-[1.7] text-gray-warm">
                Of everything the plan pays in a year, from back pain alone.
                All musculoskeletal care is roughly 13% of plan spend, so the
                claim as a buyer reads it would erase more than twice the whole
                category.
              </p>
            </StaggerItem>

            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-blue mb-3">
                What it actually supports
              </div>
              <div className="font-serif font-light text-3xl leading-none tabular-nums text-blue">
                1.0%
              </div>
              <p className="mt-4 text-[14px] leading-[1.7] text-gray-warm">
                The company&rsquo;s own filing with securities regulators
                discloses that 3.4% of covered people were active users. On that
                denominator the same claim is a real number, and a fine thing to
                buy at the right price.
              </p>
            </StaggerItem>

            <StaggerItem className="bg-base p-7 md:p-8">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                What changed
              </div>
              <div className="font-serif font-light text-3xl leading-none tabular-nums text-navy">
                Nothing
              </div>
              <p className="mt-4 text-[14px] leading-[1.7] text-gray-warm">
                Same claim, same maths, same company. &ldquo;Per member&rdquo;
                means per member <em className="italic">who used it</em>. It is
                not a lie. It is a different denominator, and it is the single
                most common way a savings figure misleads without anyone
                intending it to.
              </p>
            </StaggerItem>
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-10 border-l-2 border-blue pl-6 max-w-2xl">
              <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
                This test takes ninety seconds and it settles a lot of meetings
                before anyone opens a clinical study.
              </p>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── LIMITS ─────────────── */}
      <Section className="py-16 sm:py-24 border-t border-border">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>What it doesn&rsquo;t do</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              A test worth running is a test{" "}
              <em className="italic">with edges.</em>
            </h2>
          </div>
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {LIMITS.map((l) => (
            <StaggerItem key={l.k} className="bg-base p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                {l.k}
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm">{l.v}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <GhostButton href="/methodology">
              The other five adjustments
            </GhostButton>
            <GhostButton href="/example-report.html">
              See it applied to a whole portfolio
            </GhostButton>
          </div>
        </Reveal>
      </Section>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>If it was useful</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              This is one programme. Most employers own six.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              The same test across a whole portfolio is the free report — every
              programme on one scale, the overlapping claims separated, and every
              assumption written down where you can argue with it. Reviewed by a
              person, in your inbox within 24 hours, with no call attached.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Get your free report
              </GradientButton>
              <GhostButtonLight href="/where-we-fit">
                Where we fit
              </GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
