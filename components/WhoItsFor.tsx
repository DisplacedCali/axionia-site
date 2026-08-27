import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "./Reveal";
import { Eyebrow } from "./ui";

/**
 * Audience routing. The site previously never let a visitor self-identify —
 * an HR leader, a CFO and a PE associate all landed on the same undifferentiated
 * pitch. Employers only, on purpose. A second tier for private equity,
 * investors and consultants used to sit under this section and was pitched a
 * second time ninety words further down the page, on the same link. Both are
 * gone from the home page as of 2026-08-27: research engagements are real
 * revenue but they are not what a first-time visitor is here to find out, and
 * /research is reachable from the nav and twice from the footer.
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
    </>
  );
}
