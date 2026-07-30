import { OBJECTIVES } from "@/lib/objectives";

/**
 * Buyer deck content.
 *
 * Colour here follows the reserved semantic scale in axionia_brand_tokens.md:
 * amber = a vendor's own unadjusted claim, blue = the expected case we stand
 * behind, green = savings or a recommendation, red = risk. The previous deck
 * spent red on the conservative scenario; a low case is the bottom of a range,
 * not a risk, and burning red on it makes the reserved meaning unreadable.
 */

const REVIEW_GAPS = [
  ["Reviewed, not evaluated", "Reading an ROI study and assessing one are different skills. Judging whether an effect survives its own study design takes training most people in the chain were never expected to have."],
  ["Judged in isolation", "Each program is approved on its own merits, in its own meeting. Nobody asks whether the fourth overlaps the first three — so savings are counted twice and no one owns the arithmetic."],
  ["Averaged, not specific", "Results are quoted against a broad national base rather than your covered population. Your age mix, injury patterns, geography and care-seeking behaviour decide whether any of it transfers."],
  ["Disconnected from strategy", "A recommendation can be defensible in benefits terms and still pull against the strategy it exists to serve. Those two conversations usually happen in different rooms."],
  ["Not disinterested", "Preference, familiarity and relationship shape which options reach the table at all. Most of that is ordinary human judgment rather than bad faith — which is exactly why it goes unexamined."],
  ["And no baseline", "Without an independent measure taken before the decision, there is nothing to check the outcome against afterwards. The absence compounds every year it continues."],
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

export const SLIDES = [
  /* ── 00 · cover ── */
  <div className="dk-navy dk-cover" key="s0">
    <span className="dk-orb dk-orb-a" />
    <span className="dk-orb dk-orb-b" />
    <div className="dk-cover-in">
      <div className="dk-eyebrow dk-eyebrow-l">Axionia — Healthcare Decision Intelligence</div>
      <h1 className="dk-h1">
        Fifteen people reviewed it.
        <br />
        <em>None of them checked it.</em>
      </h1>
      <p className="dk-sub dk-sub-l">
        A benefit decision passes through more hands than almost anything else a
        company buys. Attention isn&rsquo;t the problem. Almost nobody in that
        chain is positioned to supply scrutiny.
      </p>
    </div>
  </div>,

  /* ── 01 · the problem ── */
  <div key="s1">
    <div className="dk-eyebrow">The problem</div>
    <h2 className="dk-h2">
      The decisions are big.
      <br />
      The scrutiny is <em>surprisingly thin.</em>
    </h2>
    <p className="dk-sub">
      Brokers, carriers, consultants, internal committees, finance — a program is
      looked at by all of them before it&rsquo;s approved. Every one of those
      reviews is reasonable on its own terms. Added together they still
      don&rsquo;t constitute a check.
    </p>
    <blockquote className="dk-quote">
      A vendor tells your team their MSK program saves $180 per member per month —
      backed by a study they commissioned, on a population they selected, with
      adjustments they never disclosed. Five people read it. None of them is the
      person whose job is to test it.
    </blockquote>
    <div className="dk-grid-2">
      <div className="dk-stat">
        <div className="dk-stat-n">Majority</div>
        <div className="dk-stat-l">
          Of CFOs cannot confirm their long-term benefit cost strategies are
          actually saving money
        </div>
        <div className="dk-stat-s">Mercer, CFO Perspective on Health, 2024</div>
      </div>
      <div className="dk-stat">
        <div className="dk-stat-n">~1 in 5</div>
        <div className="dk-stat-l">
          CFOs are not satisfied with their level of input into benefit decisions
        </div>
        <div className="dk-stat-s">Mercer, CFO Perspective on Health, 2024</div>
      </div>
    </div>
  </div>,

  /* ── 02 · the five gaps ── */
  <div className="dk-navy dk-pad" key="s2">
    <div className="dk-eyebrow dk-eyebrow-l">Where the review fails</div>
    <h2 className="dk-h2 dk-h2-l">
      Six ways a well-attended review
      <br />
      <em>still isn&rsquo;t a check.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      None of these requires anyone to be careless or dishonest. They are failures
      of method, not of effort — which is why they persist in rooms full of
      competent people.
    </p>
    <div className="dk-grid-2 dk-tight">
      {REVIEW_GAPS.map(([k, v]) => (
        <div className="dk-gap" key={k}>
          <div className="dk-gap-k">{k}</div>
          <div className="dk-gap-v">{v}</div>
        </div>
      ))}
    </div>
  </div>,

  /* ── 03 · category gap ── */
  <div key="s3">
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

  /* ── 04 · objectives ── */
  <div key="s4">
    <div className="dk-eyebrow">Before the analysis runs</div>
    <h2 className="dk-h2">
      Tell us what you&rsquo;re optimising for.
      <br />
      <em>We&rsquo;ll show our work either way.</em>
    </h2>
    <p className="dk-sub">
      An employer buying to hold margin and an employer buying to win a hiring
      market are not making the same decision, even when they&rsquo;re looking at
      the same program. So the first thing we ask is what this portfolio is for.
    </p>

    <div className="dk-obj">
      {OBJECTIVES.map((f) => (
        <div className="dk-obj-fam" key={f.family}>
          <div className="dk-obj-h">{f.family}</div>
          {f.items.map((it) => (
            <div className="dk-obj-i" key={it.name}>
              <span className="dk-obj-n">{it.name}</span>
              <span className="dk-obj-m">{it.measure}</span>
            </div>
          ))}
          <div className="dk-obj-note">{f.note}</div>
        </div>
      ))}
    </div>

    <div className="dk-callout">
      <strong>We don&rsquo;t score the objective — only the evidence.</strong>{" "}
      Whether equity, cost or retention should lead is a question about what your
      organisation is for, and it isn&rsquo;t ours to answer. What we guarantee is
      that the weights are written down, visible in the output, and applied the
      same way whatever you choose. Two employers can get opposite recommendations
      from identical analysis and both be right.
    </div>
  </div>,

  /* ── 05 · three employers ── */
  <div key="s5">
    <div className="dk-eyebrow">Why there is no universal right answer</div>
    <h2 className="dk-h2">
      The same benefit. Three employers.
      <br />
      <em>Three different conclusions.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      One evidence score of 56. Three sets of weights. The scoring is ours and it
      doesn&rsquo;t move — the weights are yours.
    </p>

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
      Headcount doesn&rsquo;t decide any of this — 820 lives and 26,000 lives are
      the same analysis, differently weighted. What changes at scale is how
      it&rsquo;s deployed, not whether it applies.
    </div>
  </div>,

  /* ── 06 · meridian ── */
  <div key="s6">
    <div className="dk-eyebrow">Worked example</div>
    <h2 className="dk-h2">
      How a $180 claim becomes
      <br />
      a <em>$54 expectation.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Meridian Manufacturing, 820 covered lives, light manufacturing. Their broker
      recommends a virtual MSK program at $180 PMPM in claimed savings. Nothing
      below assumes bad faith — the vendor&rsquo;s study is real. It was produced
      under conditions that aren&rsquo;t Meridian&rsquo;s.
    </p>

    <div className="dk-mer">
      <div className="dk-mer-c">
        <div className="dk-mer-k dk-amber">Vendor claim, unadjusted</div>
        <div className="dk-mer-n dk-amber">$180</div>
        <div className="dk-mer-d">
          PMPM as published. Sits at the 97th percentile of the modelled range —
          around 3% of scenarios reach it.
        </div>
      </div>
      <div className="dk-mer-c">
        <div className="dk-mer-k dk-blue">Expected case</div>
        <div className="dk-mer-n dk-blue">$54</div>
        <div className="dk-mer-d">
          PMPM after adjustment. The number we stand behind, carried as a $30–78
          range rather than a point.
        </div>
      </div>
      <div className="dk-mer-c">
        <div className="dk-mer-k dk-green-d">Recommendation</div>
        <div className="dk-mer-n dk-green">Proceed</div>
        <div className="dk-mer-d">
          On restructured terms — base fee on enrolment, shared savings unlocked at
          verified engagement.
        </div>
      </div>
    </div>

    <div className="dk-adj">
      <div className="dk-adj-r">
        <span>Selection bias in the study population</span>
        <span>−35%</span>
      </div>
      <div className="dk-adj-r">
        <span>Overlap with programs Meridian already runs</span>
        <span>−20%</span>
      </div>
      <div className="dk-adj-r">
        <span>Transfer to Meridian&rsquo;s covered population</span>
        <span>×0.58</span>
      </div>
      <div className="dk-adj-r is-total">
        <span>Each adjustment shown separately, sourced, and adjustable by your team</span>
        <span>$54 PMPM</span>
      </div>
    </div>

    <p className="dk-fine">
      None of those adjustments was disclosed in the vendor&rsquo;s materials, and
      none of them is a criticism of the vendor. The failure is that nothing in the
      process was going to surface them. Illustrative example, composite employer
      profile.
    </p>
  </div>,

  /* ── 07 · what you receive ── */
  <div key="s7">
    <div className="dk-eyebrow">What you receive</div>
    <h2 className="dk-h2">
      A report is a moment.
      <br />
      A portfolio is <em>a cycle.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Renewals stagger, vendors revise their claims, mandates move, and the
      workforce you designed for last year isn&rsquo;t the one you have now. Set it
      up once, analyse it properly, then keep it current.
    </p>

    <div className="dk-grid-3">
      {[
        {
          n: "01 — SET UP",
          t: "Once, at the start",
          items: [
            ["Profile & benefits mix", "on"],
            ["Workforce segmentation", "soon"],
            ["Data & document load", "on"],
          ],
        },
        {
          n: "02 — ANALYSE",
          t: "What the numbers say",
          items: [
            ["Portfolio score & radar", "on"],
            ["Vendor claim teardown", "on"],
            ["Scenario & optimisation", "on"],
          ],
        },
        {
          n: "03 — STEWARD",
          t: "Then it keeps going",
          items: [
            ["Monthly signal update", "road"],
            ["Quarterly refresh", "soon"],
            ["Annual strategy review", "road"],
          ],
        },
      ].map((p) => (
        <div className="dk-phase" key={p.n}>
          <div className="dk-phase-n">{p.n}</div>
          <div className="dk-phase-t">{p.t}</div>
          {p.items.map(([label, state]) => (
            <div className="dk-del" key={label}>
              <span>{label}</span>
              <span className={`dk-pill is-${state}`}>
                {state === "on" ? "Available" : state === "soon" ? "Rolling out" : "Roadmap"}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>

    <div className="dk-grid-2 dk-tight">
      <div className="dk-note-blue">
        <div className="dk-led-h dk-blue">Where free stops</div>
        The Portfolio Score is free, with no call attached and no obligation
        afterwards. Everything below it is the paid engagement. Most people stop at
        the score, and that&rsquo;s a fine place to stop.
      </div>
      <div className="dk-note-gray">
        <div className="dk-led-h">On sequencing</div>
        The stewardship cadence lands across the engagement rather than on day one,
        which is also how you&rsquo;d consume it — a quarterly refresh has nothing
        to refresh in month one.
      </div>
    </div>
  </div>,

  /* ── 08 · commercial ── */
  <div className="dk-navy dk-pad" key="s8">
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

  /* ── 09 · the ask ── */
  <div className="dk-navy dk-pad" key="s9">
    <div className="dk-eyebrow dk-eyebrow-l">The ask</div>
    <h2 className="dk-h2 dk-h2-l">
      We&rsquo;re not here to sell you something today.
      <br />
      We&rsquo;re here to ask whether this <em>changes the decision.</em>
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
    <blockquote className="dk-quote dk-quote-l">
      We tell you what we think — but we expose the entire model.
    </blockquote>
    <div className="dk-site">axionia.com</div>
  </div>,
];
