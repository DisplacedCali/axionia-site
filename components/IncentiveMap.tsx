/**
 * Replaces the earlier four-way capability matrix.
 *
 * A checkmark grid is a category-defence artifact — it answers "why do we
 * exist," which the reader hasn't asked yet, and everyone knows the vendor
 * chose the rows. This does one thing instead: follows the money.
 *
 * Critically, it goes after the compensation STRUCTURE, not the people.
 * "Commission-based compensation rises with your spend" is a structural fact.
 * "Brokers are conflicted" is an accusation — and one that also insults the
 * reader's own choice of advisor, and contradicts the /research page where we
 * actively sell to brokers and consultants.
 */

type Direction = "rises" | "flat";

const PARTIES: {
  who: string;
  optimizing: string;
  direction: Direction;
  note: string;
  self?: boolean;
}[] = [
  {
    who: "The vendor selling the program",
    optimizing:
      "Closing the sale. Their outcomes study is, quite reasonably, sales collateral.",
    direction: "rises",
    note: "Paid per member, per month",
  },
  {
    who: "A commission-based broker",
    optimizing:
      "Serving you well — inside a structure that happens to pay more when you spend more.",
    direction: "rises",
    note: "Commission scales with premium",
  },
  {
    who: "A benefits analytics platform",
    optimizing:
      "Showing you the data. Deciding what to do about it is still your job.",
    direction: "flat",
    note: "Flat per-employee fee",
  },
  {
    who: "Axionia",
    optimizing: "Being right. That's the only thing we're paid for.",
    direction: "flat",
    note: "No commission, no vendor money",
    self: true,
  },
];

function Indicator({ direction }: { direction: Direction }) {
  if (direction === "rises") {
    return (
      <span className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 12L13 4M13 4H7M13 4V10"
            stroke="#9C6B1A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-caution">
          Rises with it
        </span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 8H13"
          stroke="#3CBF6C"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-pos">
        Unaffected
      </span>
    </span>
  );
}

export default function IncentiveMap() {
  return (
    <div>
      <div className="border border-border">
        {/* header */}
        <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr] gap-6 px-6 py-3.5 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          <span>Who&rsquo;s at the table</span>
          <span>What they&rsquo;re optimising for</span>
          <span>If your spend rises</span>
        </div>

        {PARTIES.map((p) => (
          <div
            key={p.who}
            className={`grid md:grid-cols-[1.5fr_2fr_1fr] gap-3 md:gap-6 px-6 py-6 border-b border-border last:border-b-0 ${
              p.self ? "bg-blue-light/40" : ""
            }`}
          >
            <div>
              <span
                className={`block text-[16px] leading-snug ${
                  p.self ? "text-navy font-medium" : "text-navy"
                }`}
              >
                {p.who}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool mt-1.5">
                {p.note}
              </span>
            </div>
            <p className="text-[14px] leading-[1.65] text-gray-warm self-center">
              {p.optimizing}
            </p>
            <div className="self-center">
              <Indicator direction={p.direction} />
            </div>
          </div>
        ))}
      </div>

      {/* the honest note — this is what keeps the argument defensible */}
      <div className="mt-6 border-l-2 border-border pl-6 py-1 max-w-2xl">
        <p className="text-[14px] leading-[1.7] text-gray-warm">
          None of this says anyone is behaving badly. Plenty of brokers are
          excellent, fee-based advisors don&rsquo;t carry this conflict at all, and a
          vendor publishing a real result from a real study is doing what any company
          would. We work alongside brokers and consultants regularly — several
          commission us directly.
        </p>
        <p className="mt-4 font-serif italic text-xl md:text-2xl leading-snug text-navy">
          The point is narrower than that: nobody in this picture is paid
          specifically to check the number.
        </p>
      </div>
    </div>
  );
}
