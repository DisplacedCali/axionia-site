import { Eyebrow, Section, PrimaryButton, GradientRule } from "@/components/ui";

const inclusions = [
  {
    title: "5-year price lock",
    body: "Your rate is set at enrollment and held for five years, regardless of how our pricing evolves as the platform grows.",
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
      <Section className="pt-20 pb-10">
        <Eyebrow>Founding Member Program</Eyebrow>
        <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight max-w-3xl">
          10 seats. <em className="italic">Ten years of influence.</em>
        </h1>
        <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
          We're inviting a founding cohort of 10 employers to help set the direction of
          Axionia's platform from the beginning — in exchange for locking in early terms
          and a real seat at the table.
        </p>
        <div className="mt-8">
          <GradientRule />
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {inclusions.map((item, i) => (
            <div key={item.title} className="border-t border-border pt-5">
              <span className="font-mono text-[11px] text-gray-cool">0{i + 1}</span>
              <h3 className="font-serif text-xl mt-2 mb-2">{item.title}</h3>
              <p className="text-[15px] leading-[1.65] text-gray-warm">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <Eyebrow>Why only 10</Eyebrow>
        <h2 className="font-serif font-light text-3xl md:text-4xl max-w-2xl leading-tight">
          A council only works if everyone's voice actually gets heard.
        </h2>
        <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
          The founding cohort is intentionally small. Ten employers is enough to represent
          real diversity of workforce composition and industry, and small enough that every
          member's perspective genuinely shapes what we build next — rather than being one
          voice lost in a large advisory board.
        </p>
      </Section>

      <Section className="border-t border-border text-center">
        <h2 className="font-serif font-light text-3xl md:text-4xl mb-6">
          Terms are shared directly, not published.
        </h2>
        <p className="max-w-measure mx-auto text-[15px] leading-[1.7] text-gray-warm mb-10">
          Pricing and enrollment details for the founding cohort are discussed one-on-one.
          Reach out and we'll walk through whether it's a fit.
        </p>
        <PrimaryButton href="/contact?interest=founding-member">
          Inquire about founding membership
        </PrimaryButton>
      </Section>
    </>
  );
}
