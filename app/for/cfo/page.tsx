import AudienceLanding, { type AudienceConfig } from "@/components/AudienceLanding";

export const metadata = {
  title: "For CFOs & finance",
  description:
    "Benefit decisions reach you as a recommendation and a vendor's ROI study, rarely as a model you can challenge. Axionia puts every program on one scale, as ranges, with every assumption inspectable.",
};

/**
 * The CFO entrance.
 *
 * Deliberately does not argue that HR is the problem. That version of the
 * pitch wins a nod in the room and costs the relationship the moment it's
 * forwarded — and the forward is the likeliest thing to happen to this page.
 * The constraint is structural: what reaches finance is a conclusion, and
 * conclusions can't be interrogated. That's true without anyone failing.
 */
const cfg: AudienceConfig = {
  eyebrow: "For CFOs & finance",
  headlineTail: "And they reach you as a recommendation, not a model.",
  lede:
    "It’s among your largest recurring costs and the one you can least interrogate. Benefit decisions arrive as a rate, a slide and a vendor’s ROI study. Axionia turns them into economics you can actually challenge — ranges, assumptions, and what each claim is worth after adjustment.",
  againstTitle: "What’s actually in the way",
  against: [
    {
      k: "A conclusion, not a model",
      v: "What lands on your desk is a recommendation with a number attached. What’s missing is what was assumed about engagement, which savings another vendor is already counting, and how much of the case rests on two or three figures nobody wants to name.",
    },
    {
      k: "A sum of local optima",
      v: "Every program was optimised in its own meeting against its own evidence. The total was never anyone’s decision — which is why it behaves like an accumulation rather than an allocation.",
    },
    {
      k: "No baseline you own",
      v: "Advice changes; the baseline doesn’t reset with it. Without an independent measure taken beforehand, this year’s recommendations are being evaluated against nothing, and next year’s results are impossible to attribute.",
    },
  ],
  changesTitle: "What you get",
  changes: [
    {
      k: "Ranges, not point estimates",
      v: "Expected, optimistic and conservative modelled together, with the vendor’s unadjusted figure shown alongside rather than argued with. A single number in this category is a claim about precision nobody can support.",
    },
    {
      k: "An allocation question",
      v: "Every program scored on one scale, so the question stops being “is this vendor credible” and becomes “where does the next dollar do the most work.” That’s a question finance is already equipped to answer.",
    },
    {
      k: "The other side of the question",
      v: "Knowing what a program is worth tells you the real size of the budget. It doesn’t tell you whether the budget is pointed at the right things. We do both, in that order — a mix proposed without an audit behind it is just another opinion.",
    },
    {
      k: "Standing, earlier",
      v: "You get into the decision while it’s still a decision, with something to contribute beyond the size of the cheque — and with a model your benefits team can use rather than one that overrules them.",
    },
  ],
  ctaPrimary: { href: "/request-report", label: "Get your free report" },
  ctaSecondary: { href: "/methodology", label: "How the scoring works" },
  ctaFootnote: "Free · reviewed by a person · in your inbox within 24 hours",
};

export default function ForCFO() {
  return <AudienceLanding cfg={cfg} />;
}
