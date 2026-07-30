import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { Eyebrow } from "./ui";

/**
 * Audience routing. The site previously never let a visitor self-identify —
 * an HR leader, a CFO and a PE associate all landed on the same undifferentiated
 * pitch. Two tiers on purpose: employers are the business, everyone else routes
 * to /research so the core positioning doesn't get diluted by the side revenue.
 *
 * Deliberately no headcount band. An earlier version qualified on "100 to 5,000
 * people", which excluded the employers with the most accumulated point
 * solutions and the largest covered populations — the ones this is most useful
 * to. Scale changes how it's deployed, not whether it applies.
 */

const ROLES = [
  {
    role: "Benefits & HR leaders",
    line: "You're being pitched constantly and asked to justify last year's decisions.",
    body: "An independent read means you walk into the renewal with numbers your CFO will accept and a defensible reason for every recommendation — including the ones where the answer is to keep what you have.",
  },
  {
    role: "CFOs & finance",
    line: "It's one of your largest recurring costs and the one you can least interrogate.",
    body: "Benefit decisions arrive as a recommendation and a vendor's ROI study. We translate them into economics you can actually challenge — ranges, assumptions, and what the claim is worth after adjustment.",
  },
  {
    role: "Owners, CEOs & boards",
    line: "You've been told the number goes up every year and that's just how it is.",
    body: "Sometimes it is. Often a meaningful share of the increase is programs that overlap, contracts that trailed the market, or a claim nobody checked. We'll tell you which, without a stake in the answer.",
  },
];

const OTHERS = [
  { k: "Private equity & corp dev", v: "Benefit spend as an EBITDA line in diligence" },
  { k: "Investors in benefits vendors", v: "Does the ROI story survive a real buyer's data?" },
  { k: "Consultants & brokers", v: "An independent read before the client conversation" },
  { k: "Competitive & market research", v: "How your claims hold up against an outside model" },
];

export default function WhoItsFor() {
  return (
    <>
      <Reveal>
        <div className="max-w-2xl mb-12">
          <Eyebrow>Who it&rsquo;s for</Eyebrow>
          <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
            Anyone carrying the risk{" "}
            <em className="italic">and the decision.</em>
          </h2>
          <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
            Headcount isn&rsquo;t the qualifier. What matters is whether
            you&rsquo;re self-funded or level-funded — so the savings accrue to
            you rather than to a carrier — and whether point solutions have been
            arriving one at a time for long enough that nobody has added them up.
            That describes an eight-hundred-person manufacturer and a
            forty-thousand-person health system equally well.
          </p>
          <p className="mt-4 text-[16px] leading-[1.7] text-gray-warm">
            At larger scale the analysis doesn&rsquo;t change; the deployment
            does. Organisations with data-residency, security or procurement
            requirements run the same agents{" "}
            <Link href="/pricing" className="text-blue underline">
              on their own infrastructure
            </Link>
            .
          </p>
        </div>
      </Reveal>

      <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
        {ROLES.map((r) => (
          <StaggerItem key={r.role} className="bg-base p-7 md:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
              {r.role}
            </div>
            <p className="font-serif text-xl md:text-[22px] leading-snug mb-3">
              {r.line}
            </p>
            <p className="text-[14px] leading-[1.7] text-gray-warm">{r.body}</p>
          </StaggerItem>
        ))}
      </Stagger>

      {/* second tier — routed away so it doesn't dilute the core pitch */}
      <Reveal delay={0.1}>
        <div className="mt-10 border border-border bg-base-2 p-7 md:p-8">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 md:gap-12 items-start">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                Not an employer?
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-warm">
                We also run research on organisations from the outside — as a paid
                engagement, with a hard wall between it and client work.
              </p>
              <Link
                href="/research"
                className="inline-block mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
              >
                Research engagements →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {OTHERS.map((o) => (
                <div key={o.k} className="flex items-baseline gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0 translate-y-[-2px]" />
                  <span>
                    <span className="block text-[14px] text-navy leading-snug">
                      {o.k}
                    </span>
                    <span className="block text-[12px] leading-[1.5] text-gray-cool mt-0.5">
                      {o.v}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}
