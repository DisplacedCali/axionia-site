import { Eyebrow, Section, GradientRule } from "@/components/ui";

export default function About() {
  return (
    <>
      <Section className="pt-20 pb-10">
        <Eyebrow>About</Eyebrow>
        <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight max-w-3xl">
          Built by someone who watched this problem <em className="italic">from the inside.</em>
        </h1>
      </Section>

      <Section className="border-t border-border">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <GradientRule />
            <p className="mt-4 font-serif italic text-2xl leading-snug">
              Tom Dow
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-cool mt-1">
              Founder, Axionia
            </p>
          </div>
          <div className="text-[15px] leading-[1.75] text-gray-warm space-y-5">
            <p>
              Tom has spent over 20 years in healthcare analytics — currently SVP of
              Analytics at WIN, and previously in analytics and health economics
              leadership roles at Quartet Health, Emerging Therapy Solutions, and
              Genoa/Optum, plus healthcare advisory work at PwC. He also runs CareVisory,
              an independent advisory practice, which Axionia operates under.
            </p>
            <p>
              His background spans biostatistics, health economics, actuarial modeling,
              fraud detection, value-based care design, and payer strategy — work that has
              touched payer, provider, pharma, and consulting organizations. He has
              designed and sold risk products, underwritten deals up to $500M, and
              conducted peer-reviewed pharmaceutical economics research.
            </p>
            <p>
              He holds an Executive MBA from Yale with a healthcare focus, an M.S. in
              Biostatistics from UCLA, and a B.A. in Math, Economics, and Statistics from
              St. Olaf College — where he was a collegiate swimmer, five-time NCAA
              Division III All-American, and team captain.
            </p>
            <p>
              Axionia exists because of what that 20 years showed him directly: benefit
              purchasing decisions are among the largest recurring financial decisions a
              company makes, and they are almost entirely shaped by vendor narratives,
              broker relationships, and misaligned incentives. Nobody independently checks
              the math. Axionia is the tool that does.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
