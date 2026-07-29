/**
 * The category argument: four capabilities, and who actually has them.
 *
 * Deliberately fair rather than flattering. Analytics platforms genuinely do
 * consolidate and analyse well — their gap is that they hand you a dashboard
 * and leave the decision to you. Brokers genuinely do recommend — their gap is
 * compensation that rises with your spend. Overstating either would be the
 * same move a vendor deck makes, which is the thing we sell against.
 */

type Level = "yes" | "partial" | "no";

const PLAYERS = [
  { id: "analytics", label: "Benefits analytics platform" },
  { id: "broker", label: "Broker / consultant" },
  { id: "vendor", label: "The vendor's own study" },
  { id: "axionia", label: "Axionia" },
] as const;

const ROWS: {
  capability: string;
  detail: string;
  scores: Record<(typeof PLAYERS)[number]["id"], Level>;
}[] = [
  {
    capability: "Consolidates your data",
    detail: "Pulls vendor materials, claims summaries and census into one place",
    scores: { analytics: "yes", broker: "partial", vendor: "no", axionia: "yes" },
  },
  {
    capability: "Produces the analysis",
    detail: "Turns that data into something with a point of view",
    scores: { analytics: "partial", broker: "yes", vendor: "yes", axionia: "yes" },
  },
  {
    capability: "Tells you what to do",
    detail: "A specific, prioritised action — not a dashboard to interpret yourself",
    scores: { analytics: "no", broker: "yes", vendor: "yes", axionia: "yes" },
  },
  {
    capability: "Has nothing to gain from the answer",
    detail: "No commission, no vendor relationship, no fee that rises with your spend",
    scores: { analytics: "yes", broker: "no", vendor: "no", axionia: "yes" },
  },
];

const DOT: Record<Level, string> = {
  yes: "bg-pos",
  partial: "bg-caution",
  no: "bg-gray-cool",
};

const WORD: Record<Level, string> = {
  yes: "Yes",
  partial: "Partly",
  no: "No",
};

const TEXT: Record<Level, string> = {
  yes: "text-pos",
  partial: "text-caution",
  no: "text-gray-cool",
};

export default function CategoryMatrix() {
  return (
    <div>
      {/* ── desktop matrix ── */}
      <div className="hidden md:block border border-border">
        <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] bg-base-2 border-b border-border">
          <span className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            Capability
          </span>
          {PLAYERS.map((p) => (
            <span
              key={p.id}
              className={`px-4 py-4 font-mono text-[9px] uppercase tracking-[0.12em] text-center ${
                p.id === "axionia" ? "text-navy bg-base" : "text-gray-warm"
              }`}
            >
              {p.label}
            </span>
          ))}
        </div>

        {ROWS.map((row) => (
          <div
            key={row.capability}
            className="grid grid-cols-[1.6fr_repeat(4,1fr)] border-b border-border last:border-b-0"
          >
            <span className="px-5 py-5">
              <span className="block text-[15px] text-navy">{row.capability}</span>
              <span className="block text-[12px] leading-[1.5] text-gray-cool mt-1">
                {row.detail}
              </span>
            </span>
            {PLAYERS.map((p) => {
              const level = row.scores[p.id];
              return (
                <span
                  key={p.id}
                  className={`px-4 py-5 flex flex-col items-center justify-center gap-1.5 ${
                    p.id === "axionia" ? "bg-blue-light/40" : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${DOT[level]}`} />
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] ${TEXT[level]}`}
                  >
                    {WORD[level]}
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── mobile: one card per player ── */}
      <div className="md:hidden space-y-4">
        {PLAYERS.map((p) => (
          <div
            key={p.id}
            className={`border p-5 ${
              p.id === "axionia" ? "border-navy bg-blue-light/30" : "border-border"
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy mb-3">
              {p.label}
            </div>
            <div className="space-y-2">
              {ROWS.map((row) => {
                const level = row.scores[p.id];
                return (
                  <div
                    key={row.capability}
                    className="flex items-baseline gap-2.5"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-2px] ${DOT[level]}`}
                    />
                    <span className="text-[13px] leading-[1.5] text-gray-warm flex-1">
                      {row.capability}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.1em] shrink-0 ${TEXT[level]}`}
                    >
                      {WORD[level]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
