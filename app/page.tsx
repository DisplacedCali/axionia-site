import { Eyebrow, Section, PrimaryButton, GhostButton, GradientRule } from "@/components/ui";

const principles = [
  {
    title: "Independent Value Assessment",
    body: "We aren't paid more when your costs go up. Our analysis has no stake in which vendor you choose.",
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
      <Section className="pt-24 pb-16">
        <Eyebrow>Healthcare Decision Intelligence</Eyebrow>
        <h1 className="font-serif font-light text-5xl md:text-7xl leading-[1.08] tracking-tight max-w-4xl">
          The decisions are big.
          <br />
          <em className="italic">The tools to evaluate them shouldn&rsquo;t be a black box.</em>
        </h1>
        <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
          Axionia is an independent decision-intelligence platform for employer benefit
          strategy — built for the HR leaders and CFOs who want defensible numbers, not
          another vendor pitch deck.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <PrimaryButton href="/platform">See the platform</PrimaryButton>
          <GhostButton href="/founding-members">Explore founding membership</GhostButton>
        </div>
        <div className="mt-14">
          <GradientRule />
          <p className="mt-4 font-serif italic text-xl text-gray-warm max-w-lg">
            &ldquo;We tell you what we think — but we expose the entire model.&rdquo;
          </p>
        </div>
      </Section>

      <Section className="border-t border-border">
        <Eyebrow>The problem</Eyebrow>
        <h2 className="font-serif font-light text-3xl md:text-5xl max-w-3xl leading-tight">
          140,000 employers.{" "}
          <em className="italic">Zero independent intelligence.</em>
        </h2>
        <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
          Mid-market employers — 100 to 4,999 employees — control roughly $495B in
          healthcare spend. They&rsquo;re large enough to need sophisticated analysis and
          small enough to have no internal capacity to do it themselves. Every year they
          evaluate new benefit programs on a broker&rsquo;s recommendation and a
          vendor&rsquo;s own ROI study. Nobody checks the math independently — until now.
        </p>
      </Section>

      <Section className="border-t border-border">
        <Eyebrow>What we believe</Eyebrow>
        <h2 className="font-serif font-light text-3xl md:text-4xl mb-12">Five principles</h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {principles.map((p, i) => (
            <div key={p.title} className="border-t border-border pt-5">
              <span className="font-mono text-[11px] text-gray-cool">0{i + 1}</span>
              <h3 className="font-serif text-xl mt-2 mb-2">{p.title}</h3>
              <p className="text-[15px] leading-[1.65] text-gray-warm">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <Eyebrow>Enterprise &amp; On-Prem</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              For organizations that need it run <em className="italic">inside their walls.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
              Beyond the core service, Axionia offers a custom, on-premises implementation
              of its HR AI agents for organizations with strict data-residency or security
              requirements — a dedicated deployment layered on top of the standard service.
            </p>
            <div className="mt-6">
              <GhostButton href="/pricing">View pricing options</GhostButton>
            </div>
          </div>
          <div>
            <Eyebrow>Founding Members</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              10 seats. <em className="italic">Shaping where this goes.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
              We&rsquo;re inviting a founding cohort of 10 employers to lock in terms early
              and sit on the council shaping the future of benefits management and HR
              analytics — including an annual in-person summit.
            </p>
            <div className="mt-6">
              <GhostButton href="/founding-members">Learn about founding membership</GhostButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
