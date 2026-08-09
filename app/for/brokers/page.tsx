import AudienceLanding, { type AudienceConfig } from "@/components/AudienceLanding";

export const metadata = {
  title: "For brokers & consultants",
  description:
    "Within a category you can compare bids properly. Across categories there's no common unit and no independent benchmark to anchor to. Axionia supplies that layer — as a partner, not a competitor.",
};

/**
 * The broker entrance.
 *
 * Written narrower than the employer pages on purpose. `WhoItsFor` already
 * treats brokers and health plans as distribution partners rather than direct
 * clients, and the buyer deck says the same; a full buy-side pitch here would
 * contradict both. So this page qualifies and positions — it does not sell a
 * report — and the relationship note is load-bearing rather than decorative.
 *
 * The line this page must never cross: nothing here may imply the broker is
 * the reason employers lack independent analysis. That claim appears in the
 * other two variants nowhere either, which is what lets all three coexist
 * when they inevitably reach the same inbox.
 */
const cfg: AudienceConfig = {
  eyebrow: "For brokers & consultants",
  headlineTail: "Your recommendation deserves evidence that isn’t yours.",
  lede:
    "Within a category you can compare bids properly — you do it every year. Across categories there’s no common unit and no independent benchmark to anchor to, which is a gap in the market rather than in your work. Axionia supplies that layer, and doesn’t sit between you and your client.",
  againstTitle: "What’s actually in the way",
  against: [
    {
      k: "No common denominator",
      v: "Four MSK bids normalise cleanly. MSK against behavioural health against navigation does not — the outcomes don’t share a denominator, so the comparison comes down to which case was argued best on the day.",
    },
    {
      k: "Claims that can’t all be right",
      v: "Responses quote different baselines over different horizons, each taking full credit for outcomes the others also claim. Summed across a shortlist, the arithmetic routinely exceeds the spend available to save.",
    },
    {
      k: "Attribution after the fact",
      v: "When a renewal lands well, nothing establishes which recommendation did it. When it lands badly, the same. Without a baseline taken beforehand, good advice and lucky advice look identical in hindsight.",
    },
  ],
  changesTitle: "What you get",
  changes: [
    {
      k: "Evidence that isn’t yours",
      v: "An independent read your recommendation sits on top of. The whole value of the number is that you didn’t produce it — which is exactly what makes it usable in the conversations where your judgment is the thing being weighed.",
    },
    {
      k: "A defensible shortlist",
      v: "Overlapping claims separated and each figure’s evidence quality scored on the same scale, before the committee meets rather than after it has already anchored on the best narrative.",
    },
    {
      k: "A second opinion with no history",
      v: "We didn’t place any of it, which means we can say “remove this” without indicting anyone’s prior advice — including our own, because we don’t have any. That is occasionally the most useful thing a client can hear, and the hardest thing for an incumbent adviser to say.",
    },
    {
      k: "A baseline that outlasts the year",
      v: "A portfolio measure the client owns. Counter-intuitively that works in your favour: it’s what makes your contribution attributable in the renewals that follow.",
    },
  ],
  note: {
    k: "How the relationship works",
    v: "We treat brokers, consultants and health plans as distribution partners rather than as clients to be displaced. Axionia doesn’t place coverage, doesn’t take commissions and doesn’t hold the client relationship — the analysis is the entire product, and it’s more useful to you when it comes from somewhere with nothing at stake in the outcome.",
    href: "/contact",
    hrefLabel: "Talk about a partnership",
  },
  ctaPrimary: { href: "/contact", label: "Start a conversation" },
  ctaSecondary: { href: "/methodology", label: "How the scoring works" },
  ctaFootnote: "Partner enquiries · no commission, no placement, no client conflict",
};

export default function ForBrokers() {
  return <AudienceLanding cfg={cfg} />;
}
