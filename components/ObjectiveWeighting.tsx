import { OBJECTIVES } from "@/lib/objectives";
import { Eyebrow } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

/**
 * Objective weighting.
 *
 * The neutrality here is load-bearing and worth not softening in a later edit:
 * Axionia scores the evidence, not the objective. Whether cost, retention,
 * equity or access should lead is a question about what an organisation is for,
 * and taking a position on it would both lose half the market and make the
 * transparency claim false — the thumb would be on the scale before the data
 * arrived.
 *
 * The last paragraph is the one that keeps this honest against /methodology,
 * which commits publicly to not putting a dollar figure on soft outcomes.
 * Weights reorder recommendations. They must never quietly monetise retention.
 */
export default function ObjectiveWeighting() {
  return (
    <>
      <Reveal>
        <div className="max-w-2xl mb-12">
          <Eyebrow>Before the analysis runs</Eyebrow>
          <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
            Tell us what you&rsquo;re optimising for.{" "}
            <em className="italic">We&rsquo;ll show our work either way.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
            An employer buying to hold margin and an employer buying to win a
            hiring market are not making the same decision, even when they&rsquo;re
            looking at the same program. So the first thing we ask is what this
            portfolio is for — and the answer changes the recommendation, not the
            evidence.
          </p>
        </div>
      </Reveal>

      <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {OBJECTIVES.map((f) => (
          <StaggerItem key={f.family} className="bg-base p-6 flex flex-col">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              {f.family}
            </div>
            <div className="space-y-3">
              {f.items.map((i) => (
                <div key={i.name} className="border-t border-border pt-2.5">
                  <div className="text-[14px] leading-snug text-navy">{i.name}</div>
                  <div className="text-[12px] leading-[1.5] text-gray-cool mt-0.5">
                    {i.measure}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-5 font-serif italic text-[13px] leading-[1.6] text-gray-warm">
              {f.note}
            </p>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <div className="mt-10 grid lg:grid-cols-2 gap-8">
          <div className="border-l-2 border-blue pl-6">
            <p className="font-serif italic text-xl md:text-2xl leading-snug text-navy">
              We don&rsquo;t score the objective — only the evidence.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm">
              Whether equity, cost or retention should lead is a question about
              what your organisation is for, and it isn&rsquo;t ours to answer.
              What we guarantee is that the weights are written down, visible in
              the output, and applied the same way whichever you choose. Two
              employers can receive opposite recommendations from identical
              analysis and both be right.
            </p>
          </div>
          <div className="border-l-2 border-border pl-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
              What weighting does not do
            </p>
            <p className="text-[15px] leading-[1.7] text-gray-warm">
              Weights change what gets recommended and in what order. They
              don&rsquo;t put a dollar figure on a soft outcome. Retention,
              satisfaction and productivity stay directionally scored and openly
              labelled as such — they&rsquo;re too confounded by pay, management
              and the labour market to attribute honestly, and a weighting slider
              is not a licence to pretend otherwise.
            </p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
