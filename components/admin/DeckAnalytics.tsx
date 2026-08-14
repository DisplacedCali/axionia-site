import type { DeckAnalytics as Data, DeckPerson } from "@/lib/deckAnalytics";

/**
 * Deck traction, above the raw log.
 *
 * The activity feed below this answers "what just happened", which is the wrong
 * question once more than a handful of people have opened something: sixty rows
 * of "Anonymous · view" is a fact about the table rather than about anybody.
 * This answers "who is paying attention", which is a question about people, so
 * the unit here is a person and not an event.
 *
 * Presentational and server-rendered. Every number arrives computed from
 * `analyzeDeckEvents` — nothing is derived in JSX, so the judgements about what
 * counts as attention all live in one file that can be read without layout in
 * the way.
 *
 * Brand: numbers in Cormorant light, labels in DM Mono caps, the gradient used
 * only as a data fill. Accents are ink, not paint — no filled rows, and every
 * status is a word before it is a colour.
 */

const DECK_NAME: Record<string, string> = {
  buyer: "Buyer",
  founders: "Founders · $250K",
  investor: "Investor · $1.0M",
};

function when(ts: string) {
  const h = (Date.now() - new Date(ts).getTime()) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  if (h < 24 * 14) return `${Math.round(h / 24)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * How far a typical reader got.
 *
 * A bar rather than a percentage on its own because the useful comparison is
 * between decks, and three numbers in a column are read one at a time while
 * three bars are read at once. The slide count sits beside it because "68%"
 * of a thirteen-slide deck and of a seven-slide deck are different afternoons.
 */
function Depth({ pct, sample }: { pct: number | null; sample: number }) {
  if (pct === null) {
    return (
      <div className="mt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
          Depth — not yet measured
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="flex-1 h-1.5 bg-base-2">
          <span
            className="block h-full bg-axionia-gradient"
            style={{ width: `${Math.max(3, pct * 100)}%` }}
          />
        </span>
        <span className="font-mono text-[11px] text-navy tabular-nums">
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool">
        Median depth · {sample} {sample === 1 ? "reader" : "readers"}
      </div>
    </div>
  );
}

function DeckCard({ s }: { s: Data["summaries"][number] }) {
  return (
    <div className="border border-border p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue">
        {DECK_NAME[s.deck] ?? s.deck}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-serif font-light text-4xl leading-none tabular-nums">
          {s.opens}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          opens · {s.people} {s.people === 1 ? "person" : "people"}
        </span>
      </div>

      {/*
        Requests and prints sit together and are labelled differently on
        purpose. Before migration 036 these were the same event, so a request
        that nobody ever acted on was counted as a download — the two numbers
        being adjacent and distinct is the whole point of splitting them.
      */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <div className="font-mono text-[13px] text-navy tabular-nums">{s.requests}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            Asked for it
          </div>
        </div>
        <div>
          <div className="font-mono text-[13px] text-navy tabular-nums">{s.prints}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
            Took the file
          </div>
        </div>
      </div>

      <Depth pct={s.medianDepth} sample={s.depthSample} />

      <div className="mt-4 font-mono text-[10px] text-gray-cool">
        {s.lastAt ? `Last opened ${when(s.lastAt)}` : "No opens yet"}
      </div>
    </div>
  );
}

function Trend({ daily }: { daily: Data["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.n));
  return (
    <div className="border border-border p-6">
      <div className="flex items-end gap-1 h-24">
        {daily.map((d) => (
          <div
            key={d.label}
            className="flex-1 flex flex-col justify-end h-full group"
            title={`${d.label} · ${d.n}`}
          >
            <span className="text-center font-mono text-[9px] text-gray-cool mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
              {d.n}
            </span>
            <span
              className="w-full bg-axionia-gradient"
              style={{ height: `${Math.max(2, (d.n / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 font-mono text-[9px] text-gray-cool">
        <span>{daily[0]?.label}</span>
        <span>{daily[daily.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Who they are, in the order the log actually learns it. */
function Who({ p }: { p: DeckPerson }) {
  const primary = p.name || p.label || p.email || "Anonymous";
  const secondary = [p.org, p.name && p.email ? p.email : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-w-0">
      <div className="text-[14px] text-navy truncate">{primary}</div>
      {secondary && (
        <div className="text-[12px] text-gray-cool truncate">{secondary}</div>
      )}
      {/*
        A label with no email means a link was opened by somebody who never
        identified themselves — which is a fact about forwarding, not a gap in
        the data, so it's stated rather than left blank.
      */}
      {!p.name && !p.email && p.label && (
        <div className="text-[12px] text-gray-cool truncate">
          Opened {p.label}&rsquo;s link
        </div>
      )}
    </div>
  );
}

function People({ people }: { people: DeckPerson[] }) {
  if (people.length === 0) {
    return (
      <p className="px-5 py-8 text-[13px] text-gray-cool">
        Nobody outside the team has opened a deck in this window. Staff opens are
        counted separately — presenting a deck isn&rsquo;t traction.
      </p>
    );
  }

  return (
    <>
      {people.map((p) => (
        <div
          key={p.key}
          className="grid md:grid-cols-[1.7fr_1fr_0.6fr_1.4fr_0.6fr] gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-b-0"
        >
          <Who p={p} />

          <div className="self-center min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-warm truncate">
              {p.decks.map((d) => DECK_NAME[d] ?? d).join(", ") || "—"}
            </div>
            {p.depth !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex-1 h-1 bg-base-2 max-w-[70px]">
                  <span
                    className="block h-full bg-axionia-gradient"
                    style={{ width: `${Math.max(4, p.depth * 100)}%` }}
                  />
                </span>
                <span className="font-mono text-[10px] text-gray-cool tabular-nums">
                  {p.depthLabel}
                </span>
              </div>
            )}
          </div>

          <div className="self-center font-mono text-[11px] text-navy tabular-nums">
            {p.opens}
            <span className="text-gray-cool">
              {p.days > 1 ? ` · ${p.days}d` : ""}
            </span>
          </div>

          {/*
            Words, not a heat scale. Colour appears only on "Has the PDF" —
            the one line here that changes what you'd write to somebody — and
            it carries a dot and a word, never colour alone.
          */}
          <div className="self-center flex flex-wrap gap-1.5">
            {p.reasons.length === 0 ? (
              <span className="font-mono text-[10px] text-gray-cool">Opened once</span>
            ) : (
              p.reasons.map((r) => (
                <span
                  key={r}
                  className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 border ${
                    r === "Has the PDF"
                      ? "border-pos text-pos-dark bg-green-light"
                      : r === "Asked, never collected"
                      ? "border-caution text-caution-dark bg-amber-light"
                      : "border-border text-gray-warm"
                  }`}
                >
                  {r}
                </span>
              ))
            )}
          </div>

          <div className="self-center md:text-right">
            <div className="font-mono text-[11px] text-gray-cool">{when(p.lastAt)}</div>
            {p.device && (
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
                {p.device}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function Bars({ data, empty }: { data: [string, number][]; empty: string }) {
  if (data.length === 0) {
    return <p className="text-[13px] text-gray-cool py-2">{empty}</p>;
  }
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div className="space-y-2">
      {data.map(([label, n]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="flex-1 min-w-0 text-[13px] text-gray-warm truncate">
            {label}
          </span>
          <span className="w-24 h-1.5 bg-base-2 shrink-0">
            <span
              className="block h-full bg-axionia-gradient"
              style={{ width: `${Math.max(4, (n / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 text-right font-mono text-[11px] text-navy tabular-nums shrink-0">
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DeckAnalytics({
  data,
  days,
}: {
  data: Data;
  days: number;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
          Traction · last {days} days
        </h2>
        <span className="font-mono text-[10px] text-gray-cool">
          {data.staffOpens} staff {data.staffOpens === 1 ? "open" : "opens"} excluded
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {data.summaries.length === 0 ? (
          <p className="text-[13px] text-gray-cool">
            No deck has been opened in this window.
          </p>
        ) : (
          data.summaries.map((s) => <DeckCard key={s.deck} s={s} />)
        )}
      </div>

      <Trend daily={data.daily} />

      {!data.hasDepth && (
        <div className="mt-6 border-l-2 border-caution bg-amber-light px-5 py-4 max-w-measure">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
            Depth not recording
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.7] text-gray-warm">
            Run{" "}
            <code className="font-mono text-[13px]">036_deck_depth.sql</code> in
            the Supabase SQL editor. Until it exists, an open and a full read are
            the same row — every other number on this page is unaffected.
          </p>
        </div>
      )}

      <h2 className="mt-14 mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm">
        Who has been reading
      </h2>
      <div className="border border-border">
        <div className="hidden md:grid grid-cols-[1.7fr_1fr_0.6fr_1.4fr_0.6fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          <span>Who</span>
          <span>Deck &amp; depth</span>
          <span>Opens</span>
          <span>Signals</span>
          <span className="text-right">Last</span>
        </div>
        <People people={data.people} />
      </div>

      <div className="grid md:grid-cols-2 gap-x-14 gap-y-10 mt-10 mb-14">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Where the link travelled
          </h2>
          <Bars
            data={data.referrers}
            empty="Every open was direct — pasted into a message or typed, which is what a deck link normally does."
          />
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Read on
          </h2>
          <Bars
            data={data.devices}
            empty="No device recorded yet."
          />
        </div>
      </div>
    </>
  );
}
