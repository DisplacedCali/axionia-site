/**
 * Founders deck. Ten seats at $250,000.
 *
 * Written to be shown AFTER the buyer deck, to someone who already accepts the
 * problem and the method. It doesn't re-argue either — it's the commercial
 * conversation, and re-explaining selection bias to someone who has already
 * nodded at it is how you lose the room.
 *
 * The tonal inversion worth preserving: on the public site, "we're early" is a
 * liability and the language is availability and sequencing. Here it's the
 * entire product. A founding member is buying influence over an unfinished
 * roadmap, and pretending otherwise would both insult them and make the offer
 * incoherent — you cannot sell a council seat on a finished product.
 */

const SEAT = [
  [
    "A rate locked for five years",
    "$250,000 covers the full term. Whatever we charge in year three, you don't pay it. The lock is in the agreement, not the pitch.",
  ],
  [
    "A council seat, and a vote",
    "You see the roadmap before it's built and you vote on the order. Nine of the deliverables are published with their release sequence; founding members decide which of the unbuilt ones moves first.",
  ],
  [
    "Quarterly working sessions",
    "Not a check-in. Your live decisions, run through the model with you in the room, four times a year.",
  ],
  [
    "An annual summit",
    "Ten employers, one room, once a year. The other nine are the reason to come — there is no forum where this group compares notes honestly, because everyone else in the room is usually selling something.",
  ],
];

const TERMS = [
  [
    "If we ever take vendor money, you're released",
    "Not a stated principle you have to trust — a term in your agreement. If Axionia ever accepts a commission, fee or referral from a vendor whose program we evaluate for you, you are released from the agreement and refunded.",
  ],
  [
    "Your terms survive us",
    "Your rate and your rights persist through a change of control. If Axionia is acquired, the acquirer inherits them. A commitment that evaporates the moment it becomes inconvenient isn't one.",
  ],
  [
    "Ninety days' notice, either way",
    "Any material change in direction comes with ninety days' notice, and the door is open for the whole of it. The commitment runs both ways or it isn't a commitment.",
  ],
];

const FIT = [
  "Self-funded or level-funded, so savings accrue to you rather than a carrier",
  "A renewal, RFP or major program decision inside the next twelve months",
  "A named executive sponsor who will actually attend the sessions",
  "Willing to share vendor materials and program economics — we can't analyse what we can't see",
  "Enough covered lives that independent analysis pays for itself. No upper limit.",
];

export const FOUNDERS_SLIDES = [
  /* ── 00 · cover ── */
  <div className="dk-navy dk-cover" key="f0">
    <span className="dk-orb dk-orb-a" />
    <span className="dk-orb dk-orb-b" />
    <div className="dk-cover-in">
      <div className="dk-eyebrow dk-eyebrow-l">Founding Member Program — Confidential</div>
      <h1 className="dk-h1">
        Ten employers.
        <br />
        <em>$250,000 each.</em>
      </h1>
      <p className="dk-sub dk-sub-l">
        You&rsquo;ve seen the method. This is the part that isn&rsquo;t on the
        website: what a founding seat costs, what it buys, and what we&rsquo;re
        contractually on the hook for.
      </p>
    </div>
  </div>,

  /* ── 01 · where this picks up ── */
  <div key="f1">
    <div className="dk-eyebrow">Where this picks up</div>
    <h2 className="dk-h2">
      You already agreed with the diagnosis.
      <br />
      <em>This is the commercial side of it.</em>
    </h2>
    <p className="dk-sub">
      So we won&rsquo;t re-argue selection bias or walk the Meridian numbers
      again. Three things carry over, and everything after this slide assumes
      them.
    </p>
    <div className="dk-grid-3 dk-tight">
      <div className="dk-obj-fam">
        <div className="dk-obj-h">Carried over</div>
        <div className="dk-obj-i">
          <span className="dk-obj-n">The review isn&rsquo;t a check</span>
          <span className="dk-obj-m">
            Many hands, none of them positioned to test the claim.
          </span>
        </div>
      </div>
      <div className="dk-obj-fam">
        <div className="dk-obj-h">Carried over</div>
        <div className="dk-obj-i">
          <span className="dk-obj-n">We score evidence, you set weights</span>
          <span className="dk-obj-m">
            Same analysis, different objectives, different answer.
          </span>
        </div>
      </div>
      <div className="dk-obj-fam">
        <div className="dk-obj-h">Carried over</div>
        <div className="dk-obj-i">
          <span className="dk-obj-n">Five of nine ship today</span>
          <span className="dk-obj-m">
            The stewardship cadence lands across the engagement.
          </span>
        </div>
      </div>
    </div>
    <div className="dk-callout">
      That last one is not a caveat here. It is the offer.{" "}
      <strong>
        A founding seat is a vote on what gets built next, and you can only sell
        that once.
      </strong>{" "}
      In eighteen months the roadmap will be somebody&rsquo;s finished product and
      this conversation won&rsquo;t exist.
    </div>
  </div>,

  /* ── 02 · what a seat is ── */
  <div key="f2">
    <div className="dk-eyebrow">What a founding seat is</div>
    <h2 className="dk-h2">
      Four things, <em>all of them in writing.</em>
    </h2>
    <div className="dk-grid-2 dk-tight">
      {SEAT.map(([k, v]) => (
        <div className="dk-obj-fam" key={k}>
          <div className="dk-obj-h">{k}</div>
          <div className="dk-obj-note" style={{ fontStyle: "normal", paddingTop: 0 }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  </div>,

  /* ── 03 · the number ── */
  <div key="f3">
    <div className="dk-eyebrow">The number</div>
    <h2 className="dk-h2">
      $250,000, once.
      <br />
      <em>Roughly one senior HR hire, for one year.</em>
    </h2>
    <p className="dk-sub dk-sub-tight">
      Except it&rsquo;s spread across five, and it doesn&rsquo;t replace anybody.
      It gives the people you already have something to argue with.
    </p>

    <div className="dk-mer">
      <div className="dk-mer-c">
        <div className="dk-mer-k dk-blue">Commitment</div>
        <div className="dk-mer-n dk-blue">$250K</div>
        <div className="dk-mer-d">
          Paid once, at the start. No renewal negotiation, no annual uplift, no
          scope creep priced back to you.
        </div>
      </div>
      <div className="dk-mer-c">
        <div className="dk-mer-k">Term</div>
        <div className="dk-mer-n">5 yrs</div>
        <div className="dk-mer-d">
          $50,000 a year equivalent — inside the range a single portfolio
          engagement is quoted at today, before the council seat.
        </div>
      </div>
      <div className="dk-mer-c">
        <div className="dk-mer-k dk-green-d">Seats</div>
        <div className="dk-mer-n dk-green">10</div>
        <div className="dk-mer-d">
          Then the program closes. Not scarcity theatre — see the next slide for
          why the number is ten.
        </div>
      </div>
    </div>

    <div className="dk-callout">
      <strong>What it funds, said plainly.</strong> Paid in full at the start,
      because this capital is what builds the four deliverables you&rsquo;d be
      voting on. You should price that in rather than discover it later: ten
      seats at this number is the funding mechanism for the next phase of the
      company, and that is precisely why the vote is worth something.
      It isn&rsquo;t equity and it isn&rsquo;t a donation — you receive the full
      engagement for five years, and the analysis stands on its own whether or
      not the wider program succeeds. It also isn&rsquo;t a discount available
      later by asking. The rate lock and the vote are the entire consideration
      for going first.
    </div>
  </div>,

  /* ── 04 · terms ── */
  <div className="dk-navy dk-pad" key="f4">
    <div className="dk-eyebrow dk-eyebrow-l">What we&rsquo;re on the hook for</div>
    <h2 className="dk-h2 dk-h2-l">
      Independence you can enforce,
      <br />
      <em>not independence we assert.</em>
    </h2>
    <p className="dk-sub dk-sub-l">
      Every advisor in this market claims to be objective. The difference worth
      paying for is whether the claim has a remedy attached to it. These are
      contract terms.
    </p>
    <div className="dk-grid-3 dk-tight">
      {TERMS.map(([k, v]) => (
        <div className="dk-gap" key={k}>
          <div className="dk-gap-k">{k}</div>
          <div className="dk-gap-v">{v}</div>
        </div>
      ))}
    </div>
  </div>,

  /* ── 05 · fit and why ten ── */
  <div key="f5">
    <div className="dk-eyebrow">Fit</div>
    <h2 className="dk-h2">
      Why ten, <em>and who they are.</em>
    </h2>
    <div className="dk-grid-2">
      <div>
        <div className="dk-led-h">A seat works if you have</div>
        {FIT.map((f) => (
          <div className="dk-led" key={f}>
            <span className="dk-blue">·</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="dk-led-h">Why the number is ten</div>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--dk-gray)" }}>
          Ten is enough to represent real variety in workforce composition and
          industry, and few enough that every member&rsquo;s vote visibly moves
          the roadmap rather than being averaged into an advisory board.
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--dk-gray)",
            marginTop: 12,
          }}
        >
          It is also the number we can genuinely serve at this depth. Quarterly
          working sessions with forty employers would be a webinar, and a
          webinar is not what you&rsquo;d be buying.
        </p>
        <div className="dk-callout" style={{ marginTop: 16 }}>
          <strong>What we get.</strong> Real decisions with real deadlines, told
          honestly when we&rsquo;re wrong, and the benchmark those decisions
          build. That&rsquo;s the trade, stated plainly — you are underwriting
          the compounding asset, and the rate lock is your share of it.
        </div>
      </div>
    </div>
  </div>,

  /* ── 06 · the ask ── */
  <div className="dk-navy dk-pad" key="f6">
    <div className="dk-eyebrow dk-eyebrow-l">Next step</div>
    <h2 className="dk-h2 dk-h2-l">
      Bring us the decision
      <br />
      <em>you&rsquo;re least comfortable with.</em>
    </h2>
    <div className="dk-asks">
      <div className="dk-ask">
        <div className="dk-ask-n">01</div>
        <div>
          <div className="dk-ask-t">We run it before you commit to anything</div>
          <div className="dk-ask-d">
            A live decision, analysed in full, with the whole model open to you.
            No charge and no obligation. If the work isn&rsquo;t good you&rsquo;ll
            know inside a week, and that is the cheapest possible way to find out.
          </div>
        </div>
      </div>
      <div className="dk-ask">
        <div className="dk-ask-n">02</div>
        <div>
          <div className="dk-ask-t">Then you meet the person behind it</div>
          <div className="dk-ask-d">
            Directly, before any commitment. You should know exactly who
            you&rsquo;re backing at this number, and you will.
          </div>
        </div>
      </div>
      <div className="dk-ask">
        <div className="dk-ask-n">03</div>
        <div>
          <div className="dk-ask-t">Terms are discussed, not published</div>
          <div className="dk-ask-d">
            Payment structure, start date and the shape of the first year are
            settled in conversation. Nothing on this slide is a click-through.
          </div>
        </div>
      </div>
    </div>
    <blockquote className="dk-quote dk-quote-l">
      We tell you what we think — but we expose the entire model.
    </blockquote>
    <div className="dk-site">axionia.com · Confidential</div>
  </div>,
];
