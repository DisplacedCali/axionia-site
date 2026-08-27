import {
  Eyebrow,
  EyebrowLight,
  Section,
  DarkSection,
  GhostButton,
  GradientButton,
  GradientRule,
} from "@/components/ui";
import CountUp from "@/components/CountUp";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

export const metadata = {
  title: "About",
  description:
    "Built by a healthcare analytics executive with twenty years across payer, provider, pharma and consulting.",
};


/**
 * Disciplines rather than institutions.
 *
 * A named school list is a search key — combined with a job history it
 * identifies one person whether or not a name sits above it. What a buyer
 * actually needs to know is which methods sit behind the number, and that
 * survives de-identification intact.
 */
const disciplines = [
  { k: "Biostatistics", v: "Study design, inference, and what a result can carry" },
  { k: "Health economics", v: "Actuarial and cost-effectiveness modeling" },
  { k: "Payer strategy", v: "Risk products, value-based care design, fraud detection" },
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


export default function About() {
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
            <Eyebrow>About</Eyebrow>
            <h1 className="font-serif font-light text-[40px] sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.08] tracking-tight max-w-4xl">
              Built by someone who watched this problem{" "}
              <em className="italic">from the inside.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-14">
              <GradientRule />
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ─────────────── BIO ─────────────── */}
      <Section className="py-16 sm:py-24">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-14">
          <Reveal>
            <div className="md:sticky md:top-10">
              <p className="font-serif italic text-3xl leading-snug">
                What sits behind the number
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool mt-2">
                The methods, not the résumé
              </p>
              <div className="mt-8 space-y-4">
                {disciplines.map((c) => (
                  <div key={c.k} className="border-t border-border pt-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue">
                      {c.k}
                    </div>
                    <div className="text-[14px] text-gray-warm mt-1">{c.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Stagger className="text-[15px] leading-[1.8] text-gray-warm space-y-6">
            <StaggerItem>
              <p>
                Axionia is built by a healthcare analytics executive with more
                than twenty years across payer, provider, pharma and consulting —
                most of it spent building the models that benefit decisions are
                supposed to rest on, at organizations on the other side of the
                table from the employer.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p>
                That work spans biostatistics, health economics, actuarial
                modeling, fraud detection, value-based care design and payer
                strategy. It includes designing and selling risk products,
                underwriting more than $20B in risk, and peer-reviewed research
                in health economics. The attribution framework behind every Axionia
                report — de-duplicating vendor claims, adjusting for selection
                bias — comes directly out of it.
              </p>
            </StaggerItem>
            {/*
              Says plainly that the page is anonymous, and why, rather than
              leaving a visitor to notice the absence and draw their own
              conclusion. Framed as a policy with a resolution — you meet the
              person before you commit — which is also true.
            */}
            <StaggerItem>
              <p>
                You&rsquo;ll notice there&rsquo;s no name on this page. That
                is deliberate: we&rsquo;d rather the work were judged on whether
                the numbers hold up than on a biography, which is the same
                standard we apply to every vendor claim we take apart. Anyone
                considering working with us is introduced directly, before
                committing to anything — you should know exactly who
                you&rsquo;re dealing with, and you will.
              </p>
            </StaggerItem>
            <StaggerItem>
              <blockquote className="border-l-2 border-blue pl-6 py-1 my-2">
                <p className="font-serif italic text-2xl leading-snug text-navy">
                  Benefit purchasing is among the largest recurring financial decisions a
                  company makes — and it is almost entirely shaped by vendor narratives,
                  broker relationships, and misaligned incentives.
                </p>
              </blockquote>
            </StaggerItem>
            <StaggerItem>
              <p>
                Axionia exists because of what those twenty years showed
                directly: a benefit decision passes through a dozen careful
                people and still arrives unexamined. Not because anyone was
                careless — because nobody in the chain was positioned, paid or
                trained to be the one who checks. Axionia is that party.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </Section>

      {/* ─────────────── TRACK RECORD (dark) ─────────────── */}
      <DarkSection>
        <Reveal>
          <EyebrowLight>Track record</EyebrowLight>
          <h2 className="font-serif font-light text-4xl md:text-5xl leading-[1.12] max-w-2xl">
            Two decades of doing this{" "}
            <em className="italic">on the other side of the table.</em>
          </h2>
        </Reveal>

        <Stagger className="grid sm:grid-cols-3 gap-10 mt-14">
          <StaggerItem className="border-t border-white/15 pt-5">
            <div className="font-serif font-light text-5xl md:text-6xl leading-none">
              <CountUp to={20} suffix="+" />
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
              Years in
              <br />
              healthcare analytics
            </div>
          </StaggerItem>
          <StaggerItem className="border-t border-white/15 pt-5">
            <div className="font-serif font-light text-5xl md:text-6xl leading-none">
              <CountUp to={20} prefix="$" suffix="B+" />
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
              Total risk
              <br />
              underwritten
            </div>
          </StaggerItem>
          <StaggerItem className="border-t border-white/15 pt-5">
            <div className="font-serif font-light text-5xl md:text-6xl leading-none text-teal">
              <CountUp to={4} />
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool">
              Sectors worked across —
              <br />
              payer, provider, pharma, consulting
            </div>
          </StaggerItem>
        </Stagger>
      </DarkSection>

      {/* ─────────────── PRINCIPLES ─────────────── */}
      <div className="bg-base-2">
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
      </div>

      {/* ─────────────── CONVERSION ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-3xl">
            <Eyebrow>Start here</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              See what independent analysis looks like{" "}
              <em className="italic">on your portfolio.</em>
            </h2>
            <p className="mt-7 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
              The Portfolio Scorer is free, and there&rsquo;s no sales call attached to
              running it.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href="/request-report">Get your free report</GradientButton>
              <GhostButton href="/contact">Talk to us</GhostButton>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
