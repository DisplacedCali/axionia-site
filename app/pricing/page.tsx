import { Eyebrow, Section, PrimaryButton, GhostButton } from "@/components/ui";

export default function Pricing() {
  return (
    <>
      <Section className="pt-20 pb-10">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight max-w-3xl">
          Start free. <em className="italic">Scale to what you need.</em>
        </h1>
        <p className="mt-6 max-w-measure text-[16px] leading-[1.7] text-gray-warm">
          Axionia is priced around a share of the value we help you protect, not a flat
          per-report fee. Every engagement starts with the free Portfolio Scorer.
        </p>
      </Section>

      <Section className="border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-border p-8 flex flex-col">
            <span className="eyebrow">Portfolio Scorer</span>
            <span className="font-serif text-3xl mt-3 mb-1">Free</span>
            <p className="text-[14px] leading-[1.6] text-gray-warm mt-3 flex-1">
              Benchmark your current benefit portfolio against comparable employers. No
              cost, no commitment — the front door to everything else we do.
            </p>
            <GhostButton href="/signup">Create a free account</GhostButton>
          </div>

          <div className="border border-navy p-8 flex flex-col relative">
            <span className="eyebrow">Standard Service</span>
            <span className="font-serif text-3xl mt-3 mb-1">Custom quote</span>
            <p className="text-[14px] leading-[1.6] text-gray-warm mt-3 flex-1">
              Full scenario modeling, independent vendor research, and workforce-aligned
              strategy. Priced as a share of advised spend, scaled to your workforce size
              and complexity.
            </p>
            <GhostButton href="/contact">Get a quote</GhostButton>
          </div>

          <div className="border border-border p-8 flex flex-col">
            <span className="eyebrow">Founding Membership</span>
            <span className="font-serif text-3xl mt-3 mb-1">10 seats only</span>
            <p className="text-[14px] leading-[1.6] text-gray-warm mt-3 flex-1">
              A 5-year price lock plus a seat on the council shaping Axionia's roadmap,
              including an annual in-person summit. Terms discussed directly.
            </p>
            <GhostButton href="/founding-members">Learn more</GhostButton>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <Eyebrow>Enterprise Add-On</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-4xl leading-tight">
              On-Prem HR AI Agents
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
              For organizations with strict data-residency, security, or procurement
              requirements, Axionia offers a custom on-premises implementation of its HR
              AI agents — a dedicated buy-up layered on top of the standard service, not a
              replacement for it. Your data stays inside your infrastructure.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm max-w-measure">
              Because every on-prem deployment is scoped to the buyer's environment,
              pricing is quoted directly rather than published.
            </p>
            <div className="mt-6">
              <PrimaryButton href="/contact?interest=on-prem">
                Contact us about on-prem
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
