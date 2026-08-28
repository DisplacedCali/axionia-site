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
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "Who it's for",
  description:
    "Axionia is bought at a decision, not on a schedule: a renewal with no math behind it, a point solution under evaluation, a broker change, an RFP, or a CFO asking what $12M is buying.",
};

/**
 * Organised by decision trigger rather than by product.
 *
 * A product list invites price comparison and anchors the work in the "report"
 * mental category, which /pricing deliberately avoids. Nobody wakes up wanting
 * benefit analysis — they want it the week something lands on their desk. So
 * the unit here is the moment, and the buyer role is a filter laid over it.
 *
 * `ask` is written in the buyer's own words on purpose. It's the sentence we
 * want someone to recognise, and recognition is what converts on this page.
 */
const MOMENTS = [
  {
    n: "01",
    trigger: "Renewal is 60–90 days out",
    who: "CFO · Benefits leader",
    ask: "The recommendation arrived as a slide. Where’s the arithmetic?",
    body: "A renewal packet arrives with a proposed structure, a rate, and a narrative. What it rarely arrives with is the model underneath — what was assumed about engagement, which savings are already being counted by another vendor, and how sensitive the whole thing is to the two or three numbers nobody wants to name.",
    back: "An independent read on the recommendation before you sign it, with the assumptions listed and adjustable.",
  },
  {
    n: "02",
    trigger: "A point solution is under evaluation",
    who: "Benefits leader · CFO",
    ask: "Their study says 3:1. Does that transfer to us?",
    body: "MSK, GLP-1, fertility, diabetes, behavioural health — the categories with the loudest evidence are the ones where selection bias and double-counted value do the most work. The study is usually real. The question is whether the population that produced it looks anything like yours, and who else you’re already paying to touch the same member.",
    back: "The vendor’s claim adjusted for selection, overlap and evidence transfer — as a range, with their unadjusted figure shown alongside.",
  },
  {
    n: "03",
    trigger: "You’re running an RFP",
    who: "Benefits leader · Procurement",
    ask: "Four vendors, four sets of savings. They can’t all be right.",
    body: "Responses land in different formats, quoting different baselines, over different time horizons, each claiming the full value of an outcome the others also claim. Scored by committee, the vendor with the best narrative wins. Nobody de-duplicates the claims, and the arithmetic across the shortlist frequently exceeds the spend available to save.",
    back: "A normalised comparison across responses, with overlapping claims separated and each figure’s evidence quality scored on the same scale.",
  },
  {
    n: "04",
    trigger: "You’re changing broker or consultant",
    who: "CFO · Owner",
    ask: "How do I judge the new recommendations against the old ones?",
    body: "A broker change resets the advice but not the baseline. Without an independent measure taken before the transition, the incoming recommendations are evaluated against nothing, and the first renewal under new advice is impossible to attribute.",
    back: "A baseline portfolio assessment you own — independent of whoever is advising you this year or next.",
  },
  {
    n: "05",
    trigger: "Stop-loss renewal or attachment point",
    who: "CFO · Finance",
    ask: "Are we buying the right amount of protection?",
    body: "The attachment point is one of the few benefit decisions that is purely financial, and one of the least often modelled independently. It is usually inherited from last year, adjusted at the margin, and quoted by a party whose revenue moves with the answer.",
    back: "The attachment decision modelled across scenarios, with the expected case stated as a range and the tail explicit.",
  },
  {
    n: "06",
    trigger: "The CFO asked what the spend is buying",
    who: "Benefits leader",
    ask: "I need an answer that survives a finance meeting.",
    body: "This is the moment the two conversations finally meet — and the benefits team is asked to defend a portfolio in language it was never asked to build one in. The programs may well be sound. The problem is that the case for them lives in vendor decks and lived experience rather than in a model anyone in finance recognises.",
    back: "A portfolio score across eight dimensions, with the reasoning written out so it can be handed to someone who will argue with it.",
  },
];

const ROLES = [
  {
    role: "CFO or owner",
    stance: "The wedge",
    body: "Benefits are frequently the second or third largest line on the P&L and the only one with no independent analytical layer. Every other spend of that size gets a second opinion as a matter of course. This one gets a renewal meeting.",
    signal: "You&rsquo;ve started asking benefits questions in finance language and getting answers in benefits language.",
  },
  {
    role: "Benefits or HR leader",
    stance: "The early adopter",
    body: "Not a threat to your judgment — a source for it. The leaders who bring us in are the ones already sceptical of the decks they’re handed and looking for numbers that hold up when someone senior pushes back. We work alongside brokers routinely.",
    signal: "You believe the recommendation is right and you want something more than belief to say so with.",
  },
  {
    role: "Broker, consultant or health plan",
    stance: "The channel",
    body: "Independence is more useful to a good advisor than it is threatening. An analysis your client can interrogate makes your recommendation more defensible, not less — particularly where the honest answer is to spend less. Bulk and white-label arrangements are available.",
    signal: "Your client is asking for evidence you’d rather not produce about your own recommendation.",
  },
];

const FIT = [
  "Self-funded or level-funded, roughly 100 covered lives and up",
  "A decision actually in front of you — a renewal, an evaluation, an RFP",
  "Someone willing to read a model and argue with it",
];

const NOT_FIT = [
  "Fully insured with no discretion over plan or vendor selection",
  "Looking for a claims data warehouse or an ongoing analytics platform",
  "Needing an actuarial opinion, a legal clearance or a compliance certification",
];

export default function WhoItsFor() {
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
            <Eyebrow>Who it&rsquo;s for</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              Nobody buys analysis.{" "}
              <em className="italic">They buy it the week a decision lands.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              So this page isn&rsquo;t a product list. It&rsquo;s the six moments
              where employers call us, written the way they describe them. If one
              of them is on your desk right now, that&rsquo;s the conversation to
              have.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── THE SIX MOMENTS ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>Decision moments</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Six times the arithmetic starts to matter.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                None of these require anything to be going wrong. They&rsquo;re
                ordinary points in a benefits year — the difference is that at
                each one, a number is about to be accepted without anyone
                independent having checked it.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-px bg-border border border-border">
            {MOMENTS.map((m) => (
              <StaggerItem
                key={m.n}
                className="bg-base p-8 md:p-10 grid md:grid-cols-[1fr_2fr] gap-5 md:gap-12"
              >
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[13px] text-gray-cool">
                      {m.n}
                    </span>
                    <h3 className="font-serif text-2xl leading-snug">
                      {m.trigger}
                    </h3>
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-blue leading-relaxed">
                    {m.who}
                  </p>
                </div>
                <div>
                  <p className="font-serif italic text-xl leading-snug text-navy">
                    &ldquo;{m.ask}&rdquo;
                  </p>
                  <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm max-w-measure">
                    {m.body}
                  </p>
                  <div className="mt-5 border-l-2 border-blue pl-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
                      What comes back
                    </div>
                    <p className="mt-1.5 text-[15px] leading-[1.7] text-navy max-w-measure">
                      {m.back}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <GhostButton href="/methodology">
                How the adjustments work
              </GhostButton>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── WHAT WE NEED FROM YOU (dark) ─────────────── */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <div>
            <Reveal>
              <EyebrowLight>What it takes to start</EyebrowLight>
              <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-xl">
                End to end,{" "}
                <em className="italic">on what you already have.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Most benefits analytics begins with a data project: feeds to
                build, carriers to coordinate, a warehouse to populate, months
                before anyone sees an answer. We don&rsquo;t work that way. Most
                of what decides whether a claim holds up isn&rsquo;t in your
                claims file — it&rsquo;s in the study design, the contract terms,
                the overlap with what you already run, and who actually works for
                you.
              </p>
            </Reveal>
            <Reveal delay={0.22}>
              <p className="mt-6 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
                Those live in documents on your drive. Send those, and the
                analysis runs. If you already have a warehouse or an analytics
                vendor, we work on top of it rather than against it — we&rsquo;re
                the layer that reads the output and tells you what to do, not
                another place to put your data.
              </p>
            </Reveal>
          </div>

          <Stagger className="grid gap-8 lg:pt-4">
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                No integration, no rollout
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Nothing to install, no feed to build, nothing for IT to schedule.
                If you never talk to us again, nothing breaks.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Documents you already own
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Vendor decks, renewal packets, benefit summaries, a workforce
                profile. Aggregate and de-identified — we don&rsquo;t ask for
                member-level data, and the intake is built so you can&rsquo;t
                accidentally send it.
              </p>
            </StaggerItem>
            <StaggerItem className="border-t border-white/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                Complements what you have
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-cool">
                Broker, consultant, analytics platform, care management — none of
                it needs to be displaced for this to be useful. Independence is
                the product; replacement isn&rsquo;t.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── ROLES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>Around the table</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              The same report reads three ways.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
              A benefit decision is usually made by people with different
              incentives, different vocabularies and different definitions of a
              good outcome. One of the quieter things an independent analysis
              does is give all three the same set of numbers to argue over.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {ROLES.map((r) => (
            <StaggerItem key={r.role} className="bg-base p-8 md:p-9">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                {r.stance}
              </div>
              <h3 className="mt-2 font-serif text-2xl leading-snug">{r.role}</h3>
              <p className="mt-4 text-[15px] leading-[1.75] text-gray-warm">
                {r.body}
              </p>
              <div className="mt-6 pt-5 border-t border-border">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue">
                  You&rsquo;ll recognise it when
                </div>
                <p className="mt-2 text-[14px] leading-[1.7] text-navy">
                  {r.signal}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* ─────────────── FIT / NOT FIT ─────────────── */}
      <div className="bg-base-2">
        <Section className="py-16 sm:py-24">
          <Reveal>
            <div className="max-w-2xl mb-12">
              <Eyebrow>Fit</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Where this works, and{" "}
                <em className="italic">where it doesn&rsquo;t.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                Telling you plainly when we&rsquo;re the wrong call is cheaper
                for both of us than discovering it three weeks in.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
            <div className="bg-base p-8 md:p-10">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#3CBF6C" }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-pos-dark">
                  Good fit
                </span>
              </div>
              <ul className="mt-5 grid gap-4">
                {FIT.map((f) => (
                  <li
                    key={f}
                    className="text-[15px] leading-[1.7] text-gray-warm border-t border-border pt-4 first:border-t-0 first:pt-0"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-base p-8 md:p-10">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#AEB4BC" }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
                  Not us
                </span>
              </div>
              <ul className="mt-5 grid gap-4">
                {NOT_FIT.map((f) => (
                  <li
                    key={f}
                    className="text-[15px] leading-[1.7] text-gray-warm border-t border-border pt-4 first:border-t-0 first:pt-0"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Reveal delay={0.15}>
            <div className="mt-8 border-l-2 border-blue pl-6 py-1 max-w-2xl">
              <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
                &ldquo;Not us&rdquo; is a real answer and we give it early. A
                report nobody can act on is worse than no report.
              </p>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── CONVERSION ─────────────── */}
      <DarkSection>
        <div className="max-w-3xl">
          <Reveal>
            <EyebrowLight>Start here</EyebrowLight>
            <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.1]">
              Point it at the decision you already have.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.75] text-gray-cool">
              Free, reviewed by a person, back within 24 hours. No call attached
              and no obligation afterwards — if it isn&rsquo;t useful you&rsquo;ve
              lost twenty minutes and gained a benchmark.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">
                Get your free report
              </GradientButton>
              <GhostButtonLight href="/pricing">
                See how pricing works
              </GhostButtonLight>
            </div>
          </Reveal>
        </div>
      </DarkSection>
    </>
  );
}
