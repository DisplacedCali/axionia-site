import { Eyebrow, Section, PrimaryButton, GhostButton } from "@/components/ui";

const modules = [
  {
    name: "Portfolio Scorer",
    tag: "Free",
    body: "A benchmark of your current benefit portfolio against comparable employers — score bands from Foundation to Strong, framed as opportunity, never failure. The front door to everything else.",
  },
  {
    name: "Research Agent",
    tag: "Included",
    body: "Independent, vendor-by-vendor research delivered as a leave-behind before your next renewal conversation — reviewed for accuracy, not auto-published.",
  },
  {
    name: "Scenario Modeling",
    tag: "Included",
    body: "Every recommendation is shown as a range — low, expected, high — never a single false-precision number. You see the assumptions, not just the output.",
  },
  {
    name: "Workforce-Aligned Strategy",
    tag: "Included",
    body: "Benefit economics differ for a manual/replaceable workforce versus a knowledge/talent-retention workforce. We model your actual composition, not a generic template.",
  },
  {
    name: "On-Prem HR AI Agents",
    tag: "Enterprise buy-up",
    body: "A custom, on-premises implementation of the same AI agents for organizations with strict data-residency, security, or procurement requirements.",
  },
];

export default function Platform() {
  return (
    <>
      <Section className="pt-20 pb-10">
        <Eyebrow>The Platform</Eyebrow>
        <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight max-w-3xl">
          Decision intelligence, <em className="italic">not another dashboard.</em>
        </h1>
        <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
          Axionia combines independent benchmarking, transparent scenario modeling, and
          AI-native research agents into one methodology — built to serve HR leaders and
          CFOs at the same time, with the same numbers.
        </p>
      </Section>

      <Section className="border-t border-border">
        <div className="grid gap-10">
          {modules.map((m) => (
            <div
              key={m.name}
              className="grid md:grid-cols-[1fr_2fr] gap-4 md:gap-10 border-t border-border pt-8"
            >
              <div>
                <h2 className="font-serif text-2xl">{m.name}</h2>
                <span className="eyebrow inline-block mt-2 px-2 py-1 border border-border">
                  {m.tag}
                </span>
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-warm max-w-measure">
                {m.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-serif font-light text-3xl md:text-4xl mb-10">
          Start free. Go as deep as you need.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Score your portfolio",
              body: "Run the free Portfolio Scorer to see where your benefits stand against comparable employers.",
            },
            {
              step: "02",
              title: "Get the full analysis",
              body: "Structured intake feeds a scenario model and independent research — delivered as a report, not a sales call.",
            },
            {
              step: "03",
              title: "Bring it to the decision",
              body: "Use the ranges and the exposed assumptions in the room, whether that's with your broker, your board, or your CFO.",
            },
          ].map((s) => (
            <div key={s.step}>
              <span className="font-mono text-[11px] text-gray-cool">{s.step}</span>
              <h3 className="font-serif text-xl mt-2 mb-2">{s.title}</h3>
              <p className="text-[15px] leading-[1.65] text-gray-warm">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex gap-4">
          <PrimaryButton href="/signup">Create an account</PrimaryButton>
          <GhostButton href="/contact">Talk to us</GhostButton>
        </div>
      </Section>
    </>
  );
}
