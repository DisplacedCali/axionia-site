import AudienceLanding, { type AudienceConfig } from "@/components/AudienceLanding";

export const metadata = {
  title: "For benefits & HR leaders",
  description:
    "You're asked to defend numbers you didn't produce. Axionia puts every program on one scale, with every assumption listed and adjustable — so the recommendation you carry forward is yours, and it holds.",
};

/**
 * The HR entrance.
 *
 * The trap this page exists to avoid: most "independent analysis" pitches
 * read to a benefits leader as an audit of their past decisions. That framing
 * loses the room and is also untrue — independent analysis defends incumbent
 * programs at least as often as it displaces them, and "this one is working"
 * is a finding rather than a non-answer. Hence the third card.
 */
const cfg: AudienceConfig = {
  eyebrow: "For benefits & HR leaders",
  headlineTail: "You shouldn’t have to defend them on someone else’s math.",
  lede:
    "You’re pitched constantly, asked to justify last year’s decisions, and handed vendor studies nobody was ever expected to be trained to audit. An independent read means you walk into the renewal with numbers finance will accept — including for the programs you want to keep.",
  againstTitle: "What’s actually in the way",
  against: [
    {
      k: "Reviewed, not evaluated",
      v: "Reading a vendor’s ROI study and assessing one are different skills. Judging whether an effect survives its own study design takes training most people in the chain were never expected to have, and were never given time for.",
    },
    {
      k: "Approved one at a time",
      v: "Each program cleared its own meeting, in its own year, against its own study. Nobody was ever asked whether the fourth overlaps the first three — not because it didn’t matter, but because no one was holding all four at once.",
    },
    {
      k: "Someone else’s arithmetic",
      v: "When finance asks how you know, the honest answer is that the vendor said so. That isn’t a lapse in diligence. It’s the only evidence that was ever put in front of you.",
    },
  ],
  changesTitle: "What you get",
  changes: [
    {
      k: "Air cover",
      v: "Every recommendation arrives with its assumptions listed and adjustable. When you’re challenged, the model is on the table rather than inside a vendor’s deck — and the person challenging you can change an input and watch what happens.",
    },
    {
      k: "Leverage in the renewal",
      v: "An independent expected value is the strongest thing you can carry into a contract conversation. Vendors negotiate differently against a number they didn’t produce, particularly when it’s a range with the reasoning attached.",
    },
    {
      k: "Options nobody sold you",
      v: "We didn’t place any of your current programs, so we have no reason to leave one alone — and no catalogue to sell from. Some of the strongest options for a given workforce carry no commission and appear in no vendor deck, which is exactly why they never reach the table.",
    },
    {
      k: "Permission to keep things",
      v: "Independent analysis defends incumbent programs as often as it unseats them. “This one is working, here’s why, here’s what it’s worth” is a finding — and it’s the one that’s hardest to say convincingly without an outside model.",
    },
  ],
  ctaPrimary: { href: "/request-report", label: "Get your free report" },
  ctaSecondary: { href: "/methodology", label: "How the scoring works" },
  ctaFootnote: "Free · reviewed by a person · in your inbox within 24 hours",
};

export default function ForHR() {
  return <AudienceLanding cfg={cfg} />;
}
