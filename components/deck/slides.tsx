import { OBJECTIVES, OBJECTIVE_NAMES } from "@/lib/objectives";
import type { DeckCustom } from "@/lib/deck/custom";
import DeckFlow from "./DeckFlow";

/**
 * Buyer deck content.
 *
 * Colour here follows the reserved semantic scale in axionia_brand_tokens.md:
 * amber = a vendor's own unadjusted claim, blue = the expected case we stand
 * behind, green = savings or a recommendation, red = risk. The previous deck
 * spent red on the conservative scenario; a low case is the bottom of a range,
 * not a risk, and burning red on it makes the reserved meaning unreadable.
 *
 * ── Shape of the argument ──
 *
 * Cover, ONE problem slide, the pivot into what's missing, then the product,
 * then price and when to call. Eight slides.
 *
 * The version before this spent five slides establishing that the benefit
 * review is broken before anything said what Axionia does, and then described
 * the method in static slides — Meridian's $180 → $54, the portfolio overlap —
 * without ever showing the thing that produces them. Those two slides are now
 * screens inside the walkthrough, where they arrive with the product around
 * them instead of as assertions.
 */

/*
  Four failures, not six. Each one now sets up something later — isolation sets
  up the portfolio half of the walkthrough, averaging sets up population fit,
  strategy sets up the weights slide, interest sets up "we didn't place any of
  it". The two that were cut ("reviewed, not evaluated", "and no baseline")
  restated the headline with nothing downstream pointing back at them.
*/
const REVIEW_GAPS = [
  ["Judged in isolation", "Each program is approved on its own merits, in its own meeting. Nobody asks whether the fourth overlaps the first three — so savings are counted twice and no one owns the arithmetic."],
  ["Averaged, not specific", "Results are quoted against a broad national base rather than your covered population. Your age mix, the work your people actually do, where they live and how readily they seek care all decide whether any of it transfers to you."],
  ["Disconnected from strategy", "A recommendation can be defensible in benefits terms and still pull against the strategy it exists to serve. Those two conversations usually happen in different rooms."],
  ["Not disinterested", "Preference, familiarity and relationship shape which options reach the table at all. Most of that is ordinary human judgment rather than bad faith — which is exactly why it goes unexamined."],
];

const EMPLOYERS = [
  {
    tag: "Employer A",
    name: "Cost-pressured manufacturer",
    size: "820 covered lives",
    feature: false,
    weights: [
      ["Cost reduction", 65, true],
      ["Absence & productivity", 20, false],
      ["Employee experience", 10, false],
      ["Talent retention", 5, false],
    ],
    tone: "blue",
    out: (
      <>
        Scores <strong>56</strong> on evidence — and the recommendation is{" "}
        <strong>proceed</strong>. The return clears the threshold at this cost
        structure.
      </>
    ),
  },
  {
    tag: "Employer B",
    name: "Professional services, competing for talent",
    size: "2,400 covered lives",
    feature: true,
    weights: [
      ["Talent retention", 50, true],
      ["Women's health & family building", 25, true],
      ["Employee experience", 15, true],
      ["Cost reduction", 10, false],
    ],
    tone: "blue",
    out: (
      <>
        The same <strong>56</strong> — and the recommendation is the{" "}
        <strong>premium tier</strong>. Retention and the family-building gap
        outweigh the uncertainty in the financial case.
      </>
    ),
  },
  {
    tag: "Employer C",
    name: "Health system, access-led",
    size: "26,000 covered lives",
    feature: false,
    weights: [
      ["Access breadth", 45, true],
      ["Health equity", 25, true],
      ["Clinical outcomes", 20, true],
      ["Cost reduction", 10, false],
    ],
    tone: "amber",
    out: (
      <>
        The same <strong>56</strong> — and the program is flagged for{" "}
        <strong>attention</strong>. Its reach is too narrow for a workforce that
        needs universal access.
      </>
    ),
  },
] as const;

function Weights({ rows }: { rows: readonly (readonly [string, number, boolean])[] }) {
  return (
    <div className="dk-w">
      {rows.map(([label, n, lead]) => (
        <div className="dk-w-row" key={label}>
          <span className="dk-w-l">{label}</span>
          <span className="dk-w-bar">
            <span
              className="dk-w-fill"
              style={{
                width: `${n}%`,
                background: lead ? "var(--dk-blue)" : "var(--dk-slate)",
              }}
            />
          </span>
          <span
            className="dk-w-n"
            style={{ color: lead ? "var(--dk-blue)" : "var(--dk-gray)" }}
          >
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Build the buyer deck, optionally tailored to one company.
 *
 * `custom` patches exactly three things — the cover headline, the cover sub,
 * and one inserted slide that is about them. See lib/deck/custom.ts for why
 * the surface is that small: a version nobody can review in a minute is a
 * version nobody reviews.
 *
 * Everything else is the argument as written. A tailored deck is this deck
 * with their name on the front, not a different deck.
 */
export function buildSlides(custom: DeckCustom = {}) {
  const ctx = custom.context;

  return [
  /* ── 00 · cover ──
     "None of them was compared" was the old second line, and comparison takes
     a plural object — you compare things WITH each other, so a singular "none
     of them" left the sentence reaching for something that wasn't there.
     Changing the subject rather than the verb fixes the grammar and states the
     actual thesis, which is that the unit nobody examines is the portfolio. */
  <div className="dk-navy dk-cover" key="s0">
    <span className="dk-orb dk-orb-a" />
    <span className="dk-orb dk-orb-b" />
    <div className="dk-cover-in">
      <div className="dk-eyebrow dk-eyebrow-l">Axionia — Healthcare Decision Intelligence</div>
      {custom.cover?.headline ? (
        <h1 className="dk-h1">{custom.cover.headline}</h1>
      ) : (
        <h1 className="dk-h1">
          Every program was approved.
          <br />
          <em>The portfolio never was.</em>
        </h1>
      )}
      <p className="dk-sub dk-sub-l">
        {custom.cover?.sub ?? (
          <>
            A benefit decision passes through more hands than almost anything
            else a company buys, and every one of those reviews is reasonable on
            its own terms. What nobody is positioned to do is look at all of
            them together — or ask what the same money could buy instead.
          </>
        )}
      </p>
    </div>
  </div>,

  /* ── 00b · this company (only when tailored) ──
     Marked as ours-about-them on purpose. A reader can see which claims are
     about their business and which are Axionia's standing position, and that
     line is what makes a wrong fact cheap to spot instead of expensive. */
  ...(ctx
    ? [
        <div className="dk-navy dk-pad" key="s0b">
          <div className="dk-eyebrow dk-eyebrow-l">
            {ctx.eyebrow ?? "Where this starts for you"}
          </div>
          {ctx.title && <h2 className="dk-h2 dk-h2-l">{ctx.title}</h2>}
          {ctx.lede && <p className="dk-sub dk-sub-l">{ctx.lede}</p>}
          {ctx.points && ctx.points.length > 0 && (
            <div className="dk-grid-2 dk-tight">
              {ctx.points.map((p) => (
                <div className="dk-gap" key={p.k}>
                  <div className="dk-gap-k">{p.k}</div>
                  <div className="dk-gap-v">{p.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>,
      ]
    : []),

  /* ── 01 · the problem ──
     Two slides became one. The silos framing and the failure list were making
     the same argument twice, and the second slide carried six items in a
     two-column grid that nobody read past the third. The vendor quote that
     used to sit here now opens the walkthrough, where it does real work. */
  <div className="dk-navy dk-pad" key="s1">
    <div className="dk-eyebrow dk-eyebrow-l">The problem</div>
    <h2 className="dk-h2 dk-h2-l">
      The decisions are big.
      <br />
      The evidence is <em>locked in silos.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      Brokers, carriers, consultants, internal committees, finance — a program is
      looked at by all of them before it&rsquo;s approved, and every one of those
      reviews is reasonable on its own terms. None of them is positioned to weigh
      it against everything else competing for the same money. Four failures
      follow, and not one of them requires anybody to be careless or dishonest.
    </p>
    <div className="dk-grid-2 dk-tight">
      {REVIEW_GAPS.map(([k, v]) => (
        <div className="dk-gap" key={k}>
          <div className="dk-gap-k">{k}</div>
          <div className="dk-gap-v">{v}</div>
        </div>
      ))}
    </div>
    <div className="dk-partner">
      <div className="dk-gap-k">The people paying for it know</div>
      <div className="dk-gap-v">
        The <strong>majority of CFOs cannot confirm</strong> that their long-term
        benefit cost strategies are actually saving money — and roughly one in
        five say they aren&rsquo;t satisfied with their own level of input into
        the decision.
        <br />
        <span className="dk-fine">Mercer, CFO Perspective on Health, 2024</span>
      </div>
    </div>
  </div>,

  /* ── 02 · category gap ── */
  <div key="s2">
    <div className="dk-eyebrow">The intelligence gap</div>
    <h2 className="dk-h2">
      Every other major spend has
      <br />
      an <em>independent check.</em> This one doesn&rsquo;t.
    </h2>
    <p className="dk-sub">
      Capital expenditure gets financial modelling. An acquisition gets diligence.
      Real estate gets an independent appraisal. Healthcare benefits — your second
      or third largest operating expense — gets a vendor deck and a
      recommendation from someone paid on what you spend.
    </p>
    <div className="dk-grid-2">
      <div>
        <div className="dk-led-h dk-amber">What reaches the decision today</div>
        {[
          "Vendor-commissioned ROI studies",
          "Recommendations from parties paid on what you spend",
          "Point estimates with no range around them",
          "Engagement and attribution assumptions left undisclosed",
          "No independent baseline to measure against later",
        ].map((t) => (
          <div className="dk-led" key={t}>
            <span className="dk-amber">—</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="dk-led-h dk-green-d">What Axionia adds</div>
        {[
          "Independent scoring across eight dimensions",
          "Modelling adjusted to your covered population",
          "Selection bias and overlapping claims quantified separately",
          "Every assumption visible, and adjustable by your team",
          "A number your CFO can defend, as a range",
        ].map((t) => (
          <div className="dk-led" key={t}>
            <span className="dk-green">+</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
    <blockquote className="dk-quote">
      We&rsquo;re not replacing your broker or your benefits team. We&rsquo;re
      giving everyone in the room the same independent picture to argue from.
    </blockquote>
  </div>,

  /* ── 03 · the walkthrough ──
     This slide replaces two. Meridian's $180 → $54 and the portfolio
     double-count were static slides that asserted what the product does
     without ever showing it, and they said the same numbers the walkthrough
     now says with the product around them.

     The pivot at screen 10 — that was one vendor, Meridian has eight — is the
     structural move the deck was missing entirely. Everything before it is a
     decision; everything after it is a strategy, and the difference between
     those two is the difference between a report and an engagement.

     The illustrative line under it is deliberately ONE line rather than a
     badge on each screen. Twelve badges make a product walkthrough read as a
     roadmap, and a roadmap doesn't sell anything — but the deck is a PDF that
     travels, so it cannot silently claim a benchmark cohort that doesn't exist
     yet. See the header comment in DeckFlow.tsx. */
  <div key="s3">
    <div className="dk-eyebrow">Axionia Insight</div>
    <h2 className="dk-h2">
      One vendor, taken apart.
      <br />
      <em>Then all eight at once.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Meridian Manufacturing: 820 covered lives, light manufacturing, fourteen
      days from an MSK renewal their broker wants signed. Nine screens on the
      program in front of them — then the same framework across everything else
      they already run, which is the view nobody in the chain can assemble.
    </p>

    <DeckFlow />

    <div className="dk-grid-2 dk-tight">
      <div className="dk-note-blue">
        <div className="dk-led-h dk-blue">Where free stops</div>
        The free Portfolio Score is the first two screens and a designed mix — a
        real deliverable, no call attached. Everything past it is the paid
        engagement, and most people stop at the score. That&rsquo;s a fine place
        to stop.
      </div>
      <div className="dk-note-gray">
        <div className="dk-led-h">Why it doesn&rsquo;t end at the report</div>
        Renewals stagger, vendors revise their claims, mandates move, and the
        workforce you designed for last year isn&rsquo;t the one you have now.
        Screens twelve and thirteen are the reason the relationship continues
        after the analysis lands.
      </div>
    </div>

    <p className="dk-fine">
      Illustrative throughout. Meridian is a composite employer and every figure
      on these screens is an example rather than a client result. Simulation,
      sensitivity, peer benchmarking, the vendor landscape and continuous
      monitoring are in build.
    </p>
  </div>,

  /* ── 04 · weights ──
     Was two slides: the objective menu, then the three employers. They made one
     point and the join between them was the weakest transition in the deck —
     the first posed the question and the second answered it two minutes later,
     by which time a headline had also been spent on "why there is no universal
     right answer", which is the same sentence again.

     It sits AFTER the walkthrough on purpose. A reader who has just watched one
     evidence score drive eight recommendations arrives at this slide already
     holding the objection it answers: how can a single score serve employers
     who want different things? Asked first, it's abstract. Asked here, it's the
     next question.

     The four-family grid moved to /platform. On a slide it listed thirteen
     objectives and demonstrated none of them. */
  <div key="s4">
    <div className="dk-eyebrow">The one thing you set</div>
    <h2 className="dk-h2">
      You decide what it&rsquo;s for.
      <br />
      <em>We score the evidence either way.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Everything you just saw ran against Meridian&rsquo;s weights: cost 65,
      absence 20. An employer competing for talent gets the same evidence and a
      different answer — which is not a weakness in the model, it&rsquo;s the
      only honest way to hold one. Below: one evidence score of 56, three sets of
      weights. The scoring is ours and it doesn&rsquo;t move.
    </p>

    <div className="dk-obj-strip">
      {OBJECTIVES.map((f) => (
        <span key={f.family}>{f.family}</span>
      ))}
      <em>{OBJECTIVE_NAMES.length} objectives, weighted by you</em>
    </div>

    <div className="dk-grid-3">
      {EMPLOYERS.map((e) => (
        <div className={`dk-emp ${e.feature ? "is-feature" : ""}`} key={e.tag}>
          <div className="dk-emp-h">
            <div className="dk-emp-tag">{e.tag}</div>
            <div className="dk-emp-n">{e.name}</div>
            <div className="dk-emp-s">{e.size}</div>
          </div>
          <div className="dk-emp-b">
            <Weights rows={e.weights} />
            <div className={`dk-emp-out dk-out-${e.tone}`}>{e.out}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="dk-callout">
      <strong>We don&rsquo;t score the objective — only the evidence.</strong>{" "}
      Whether equity, cost or retention should lead is a question about what your
      organisation is for, and it isn&rsquo;t ours to answer. What we guarantee is
      that the weights are written down, visible in the output, and applied the
      same way whatever you choose. Two employers can get opposite recommendations
      from identical analysis and both be right — and headcount decides none of
      it, since 820 lives and 26,000 lives are the same analysis differently
      weighted.
    </div>
  </div>,

  /* ── 05 · what else the money buys ──
     The deck used to end its argument at "we check things". That undersells
     the firm and it also implicates the buyer's past decisions, because an
     audit frame always does. This is the other half.

     Stated as RANK, never as dollar equivalence — /methodology commits
     publicly to not pricing retention, and this slide must not quietly break
     that. See lib/objectives.ts. */
  <div className="dk-navy dk-pad" key="s5">
    <div className="dk-eyebrow dk-eyebrow-l">And then the harder half</div>
    <h2 className="dk-h2 dk-h2-l">
      Knowing what it&rsquo;s worth is the start.
      <br />
      <em>Knowing what else it could buy is the point.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      Repricing a claim tells you the real size of the budget. It doesn&rsquo;t
      tell you whether the budget is pointed at the right things. Those are two
      different jobs, and the second is where the money is — it&rsquo;s why the
      unbrokered fitness stipend outranked four programs somebody sold Meridian.
    </p>

    <div className="dk-grid-2 dk-tight">
      <div className="dk-gap">
        <div className="dk-gap-k">Options with no seller</div>
        <div className="dk-gap-v">
          The strongest option for a given workforce frequently carries no
          commission and appears in no catalogue — a fitness benefit against a
          fourth overlapping clinical program, or predictable scheduling, which
          costs nothing at all. Nothing in a brokered process surfaces an option
          nobody sells.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">We didn&rsquo;t place any of it</div>
        <div className="dk-gap-v">
          Your broker cannot recommend removing a program they placed without
          indicting their own advice. Nor can the person who championed it, nor
          the CFO who has now approved it four times. We have no past
          recommendation to defend, which is the only reason we can say
          &ldquo;replace this&rdquo; plainly.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">Balanced across your people</div>
        <div className="dk-gap-v">
          One mix rarely serves everyone equally. We model by workforce group,
          so the answer meets each group on the axis that group actually
          feels — inside the existing budget rather than by growing it.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">We rank. We don&rsquo;t price.</div>
        <div className="dk-gap-v">
          Under your stated objectives we will tell you what outranks what. We
          will not put a dollar figure on retention or satisfaction, because
          nobody honestly can — and a method that invents one is the thing we
          exist to catch.
        </div>
      </div>
    </div>

    <blockquote className="dk-quote dk-quote-l">
      We didn&rsquo;t choose any of it, so we have nothing to defend by leaving
      it alone.
    </blockquote>
  </div>,

  /* ── 06 · commercial ── */
  <div className="dk-navy dk-pad" key="s6">
    <div className="dk-eyebrow dk-eyebrow-l">Commercial shape</div>
    <h2 className="dk-h2 dk-h2-l">
      Priced against the portfolio,
      <br />
      <em>not the headcount.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      An 800-person employer with four overlapping point solutions is a harder
      analysis than a 5,000-person employer with two. Headcount is a poor proxy for
      the work and a worse one for the value, so we scope against the portfolio
      under review and quote directly.
    </p>
    <div className="dk-grid-3 dk-tight">
      <div className="dk-gap">
        <div className="dk-gap-k">What sets the number</div>
        <div className="dk-gap-v">
          Programs in scope, vendors under review, whether claims data is in play,
          and the cadence you want afterwards.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">What doesn&rsquo;t</div>
        <div className="dk-gap-v">
          Headcount alone, and anything a vendor pays us — which is nothing. We take
          no commission, fee or referral from any vendor, carrier or broker.
        </div>
      </div>
      <div className="dk-gap">
        <div className="dk-gap-k">Where it starts</div>
        <div className="dk-gap-v">
          The free Portfolio Score. A real deliverable rather than a teaser, so you
          can judge the work before there is a commercial conversation.
        </div>
      </div>
    </div>
    <div className="dk-partner">
      <div className="dk-gap-k">Brokers and health plans</div>
      <div className="dk-gap-v">
        Treated as <strong>distribution partners, not direct clients</strong>. Bulk
        licensing and white-label arrangements are available. Partners bring
        relationships and market access; Axionia brings the independent analysis —
        structured so the employer always receives an unbiased read, which is the
        only version worth distributing.
      </div>
    </div>
  </div>,

  /* ── 07 · when to partner ──
     The three questions stayed; the frame around them didn't. "We're not here
     to sell you something today" is a sales line about not selling, and
     closing on "we expose the entire model" makes a slogan out of a claim the
     walkthrough already demonstrated screen by screen.

     Qualifying reads better than closing, and it's consistent with
     /who-its-for, which carries an explicit not-a-fit list. Saying who
     shouldn't buy this is the most credible thing on the slide. */
  <div className="dk-navy dk-pad" key="s7">
    <div className="dk-eyebrow dk-eyebrow-l">When to partner with Axionia</div>
    <h2 className="dk-h2 dk-h2-l">
      Not every employer needs this.
      <br />
      <em>Three signs that you might.</em>
    </h2>
    <div className="dk-asks">
      {[
        ["01", "Is the problem real for you?", "Have you sat in a room where a savings claim went unchallenged — not because anyone was careless, but because nobody present was the one whose job it was to test it?"],
        ["02", "Would it change the conversation?", "If the Meridian analysis landed on your desk two days before a renewal, what would you do differently in that meeting — and what would that be worth?"],
        ["03", "Is there a decision in front of you now?", "The most useful thing you can give us is a real decision with a real deadline. We'll run the analysis, show you the whole model, and you can tell us where it's wrong."],
      ].map(([n, t, d]) => (
        <div className="dk-ask" key={n}>
          <div className="dk-ask-n">{n}</div>
          <div>
            <div className="dk-ask-t">{t}</div>
            <div className="dk-ask-d">{d}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="dk-partner">
      <div className="dk-gap-k">What happens next</div>
      <div className="dk-gap-v">
        Start with the free Portfolio Score. It takes a form, not a meeting, and
        it comes back as a real document. If it&rsquo;s wrong about your
        portfolio, tell us where — that is a more useful first conversation than
        a pitch, and it&rsquo;s the one we&rsquo;d rather have.
      </div>
    </div>
    <p className="dk-fine">
      And if your portfolio is one carrier and nothing bolted onto it, there is
      nothing here to de-duplicate. We&rsquo;ll tell you that rather than sell
      you an analysis of it.
    </p>
    <div className="dk-site">axionia.com</div>
  </div>,
  ];
}

/**
 * The untailored deck. Every existing caller keeps working — /deck without a
 * version, the founders route, the print stylesheet — because the default is
 * exactly what the array used to be.
 */
export const SLIDES = buildSlides();
