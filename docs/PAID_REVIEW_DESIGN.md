# Human review in a paid engagement — design

Status: **draft for discussion.** Nothing here is built. Written 2026-08-03.

Read `PROJECT_STATE.md` first for where the product actually is.

---

## The thesis

The paid tier's differentiator is not more analysis. It is **attributable
judgment**.

The free report says *here is the model*. A paid report should say *here is the
model, here is where a human overrode it, in what discipline, and why*. Most
products hide that layer because a visible correction looks like the machine
failed. For Axionia it is principle 5 — transparency over hidden assumptions —
made literal in the data rather than asserted in copy. It is also the one thing
a vendor-commissioned ROI study structurally cannot produce, because the party
doing the adjusting is the party being paid.

That reframes the tension between standardisation and judgment. Judgment does
not standardise. The **slots it goes into** do — and `/methodology` already
publishes what those slots are.

---

## What already points this way

Not starting from nothing. The existing architecture was built with this shape
even though it wasn't the goal at the time:

| Existing | What it gives us |
|---|---|
| `reports.content` immutable, `reports.edits` an overlay applied at render | Every human correction is already reversible and the model's original stays inspectable |
| `modelScore` kept beside every override; `anyScoreAdjusted` surfaced | The diff is already computable and already shown |
| Revise agent writes a `note` per revision | A rationale field already exists, it just isn't required |
| Staff roles with the privilege boundary at **release** | The right boundary is already drawn — everything upstream is recoverable |
| Hard vs soft release blockers (`hardReleaseBlockers`) | A gate that distinguishes "silently wrong" from "visibly incomplete" |

Three things are missing: **who**, **why**, and **stages**.

---

## The gaps

**Who.** `reports.edits` is anonymous. A score changed by Tom and a score
changed by a contract actuary are different facts, and today they're the same
row.

**Why.** A rationale is optional. For paid work an unexplained override is
precisely the hidden assumption the product exists to oppose — worse than the
model's original, because at least the model's was reproducible.

**Stages.** One `reviewed_at` timestamp. A paid engagement wants analytical
review, specialist review and editorial review as separate gates with separate
owners, because they fail in different ways and are done by different people.

---

## Decisions taken

| Question | Answer |
|---|---|
| Who reviews | Tom, plus a **subject-matter reviewer per engagement** (actuarial, clinical, legal), **contracted by Axionia** — not an external third party. Expected to convert to employment over time. Reviews attach to **sections**, not whole reports. |
| Client visibility | **Summarised, not a diff.** The client sees that judgment was applied and the headline reasoning. Polished but visibly customised. |
| What's different about paid | Client-supplied documents · the four adjustments as live parameters · scenario modelling · a live working session · for founding members, a seat on the panel |

The visibility decision is the subtle one. A raw override diff reads as
*machine corrected*. A summary reads as *expert reviewed*. Same underlying
data, opposite impression, and the second one is both more accurate and more
saleable. The full ledger stays internal and available on request — which is
the honest position, because "we'll show you the whole thing if you ask" is
transparency, while forcing a diff on every reader is theatre.

---

## Design

### 1. Contracted reviewers are scoped staff, not a separate class

An earlier draft of this document had it wrong. It designed a `reviewer` role
*below* `analyst` for external third parties, with a per-engagement NDA gate.
That's the right shape for an outside firm and the wrong shape for what this
actually is.

Reviewers are **contracted by Axionia** and expected to convert to employment
over time. They are staff on a different employment basis, not a trust
boundary. Two consequences:

**Confidentiality is onboarding, not per-engagement.** A contractor agreement
signed once covers the relationship. Gating each individual report behind an
NDA acceptance would be theatre and friction both.

**Design for the conversion.** Someone moving from contract to employee should
lose a scope, not move tables. A separate `reviewer` role means every
conversion is a migration and a permissions audit; scoping the existing
`analyst` role means it's `delete from report_scopes where user_id = …`.

So: keep `analyst`, add an **optional** scope.

```
report_scopes(
  id, user_id,
  report_id,
  sections    text[],   -- null = the whole report
  discipline  text,     -- actuarial | clinical | legal | editorial
  granted_by, granted_at,
  expires_at,           -- a grant that never lapses is a standing key
  completed_at
)
```

An `analyst` with **no rows** in `report_scopes` behaves exactly as today —
full queue access. An `analyst` **with** rows sees only those reports, and only
those sections. That's least-privilege hygiene rather than a distrust model,
and it means the feature is invisible until someone is actually scoped.

The PHI firewall still deserves a mention here. Intake being aggregate and
de-identified is what keeps a contracted reviewer outside HIPAA scope along
with everyone else. That must not quietly loosen to accommodate a reviewer who
asks for member-level detail — the right answer to that request is no.

### 2. The four adjustments become live parameters

The highest-value piece. `/methodology` publishes four adjustments — selection
bias, program overlap, evidence transfer, engagement realism. Today they are
prose. In a paid engagement they become **model-proposed, human-ratified
values with the delta recorded**.

```
report_adjustments(
  id, report_id,
  claim_ref     text,      -- which vendor claim this adjusts
  factor        text,      -- selection_bias | program_overlap
                           -- | evidence_transfer | engagement_realism
  model_value   numeric not null,
  human_value   numeric,   -- NULL = reviewer accepted the model
  rationale     text,
  set_by        uuid,
  discipline    text,
  set_at        timestamptz
)
```

Two rules that belong in the schema rather than the app:

- **`human_value IS NULL` means accepted, and is still recorded.** A reviewer
  agreeing with the model is information, not an absence of it. Over enough
  engagements, *where a human consistently agrees* is as valuable as where they
  don't — it tells you which parts of the model have earned autonomy.
- **A differing `human_value` requires a rationale.** A check constraint, not a
  form validation. `check (human_value is null or (rationale is not null and
  length(trim(rationale)) > 0))`.

This table is also the compounding asset. It is a longitudinal record of where
expert judgment diverges from the model, by factor and by discipline — which is
training data, a benchmark, and the honest answer to "how do you know your
adjustments are right" all at once. It is worth more than the reports it came
from.

### 3. Review stages replace one timestamp

```
report_reviews(
  id, report_id,
  stage      text,   -- analysis | specialist | editorial
  section    text,   -- null for whole-report stages
  reviewer_id uuid,
  status     text,   -- pending | approved | changes_requested
  note       text,
  required   boolean default false,
  at         timestamptz
)
```

`release` is not a stage in this table — it stays where it is, gated by
`requireRelease()`. The privilege boundary doesn't move.

**Extension to the release gate.** A paid report with an outstanding *required*
specialist review is a **hard** blocker, not soft. The reasoning follows the
split already built: a report that implies specialist review it did not receive
is silently wrong, which is the category the action refuses on. Missing
editorial polish is visibly incomplete, which stays advisory.

### 4. Client-facing: "Judgment applied"

A short panel, near the top of a paid report. Not a diff.

- How many adjustments were ratified as-modelled vs. moved by a reviewer
- Which **disciplines** reviewed which sections — "reviewed by a consulting
  actuary", not a name, unless the individual consents to be named
- One or two sentences on the most consequential judgment call in the report
- A line offering the full assumption ledger on request

Tone rule, and it is the whole design: this must read as *reviewed by people
who know this domain*, never as *the AI got it wrong and we fixed it*. The
second framing undermines the free report retroactively and invites the client
to discount everything the model produced anywhere else.

Naming individuals is a real decision, deferred: a named actuary is a genuine
credential and raises the report's standing, but it creates personal liability
for the reviewer, a dependency for you, and an expectation of the same name
next time.

### 5. Founding members on the panel

Out of scope for this document, noted so the connection isn't lost. A founding
member's seat is a governance surface, not a report surface — gate it the way
`/deck/founders` is gated, HMAC-signed and stateless. The link worth
remembering: **their own engagement's adjustment ledger is the raw material a
council session would actually discuss.** "Here is where we disagreed with the
model on your programs, and here is what we want to change about the model" is
a real agenda, and it's generated as a by-product of the work rather than
manufactured for the meeting.

---

## Sequencing

Ordered by ratio of value to new surface area. Each stage is useful shipped
alone, which is the test for whether the split is real.

**v1 — attribution and required rationale. BUILD NOW.** `set_by` on every edit,
and a required rationale on **score overrides only**. Render nothing new to
clients. No new authorization surface.

Narrower than "all overrides" on purpose: a prose edit is self-documenting —
you can read what changed — while a score moving 55 → 80 is opaque without a
reason, and it's the number that drives the headline.

Two reasons this doesn't wait for the first engagement. It works on **free**
reports, so every report run between now and then accumulates ledger data;
turning it on afterwards throws away every practice run. And the habit is
easier to form before a client is waiting — writing down why you moved a score
is a discipline, and adopting it under delivery pressure is how it gets
skipped.

**v2 — the four adjustments. WAIT FOR ENGAGEMENT ONE.** `report_adjustments`,
an admin UI to ratify or move each factor, and the client-facing "Judgment
applied" summary. This is the piece that makes the paid tier feel different.

The framework is right; the **granularity** is unknown. Per claim, per vendor,
per program? That's decided by what a real renewal packet actually contains,
and building four parameter slots before seeing one is how you get four slots
that don't fit.

> **During engagement one, keep a running note** of every judgment call: what
> it was, at what granularity, and which of the four factors it mapped to —
> including the ones that mapped to none. That note is the spec for v2, and it
> costs nothing to keep while the work is happening.

**v3 — scoped reviewers.** `report_scopes`, scoped routes, `report_reviews`
stages, and the release-gate extension. Do not start until v1 and v2 are in
use: designing an access model for a review practice you haven't run yet is
guessing, and there are no contracted reviewers yet to run it with.

**v4 — scenario modelling, working-session artifacts, founders council.**
Separate products in their own right.

---

## Open questions

Resolved by the contracted-not-external correction: reviewers get real auth
accounts as staff, they see the named employer as any analyst does, and the
contractor agreement covers confidentiality once rather than per report.

Still open:

- **Does the client get to decline a contracted reviewer?** Some will ask who
  else has seen their numbers. Better to have an answer before it's asked. The
  likely one: reviewers are Axionia personnel under contract, named by
  discipline in the report, and the client can request that no one outside the
  core team touches the engagement — at a price, because it removes the
  specialist depth they're paying for.
- **Does `reports.edits` stay the single overlay, or do adjustments live
  outside it?** The v2 recommendation splits them out for queryability. That
  means two things applied at render and `assembleReport()` grows a second
  input — worth confirming it stays comprehensible before committing.
- **Are reviewer names shown to the client?** Deferred. A named actuary is a
  genuine credential and raises the report's standing; it also creates personal
  liability for the reviewer, a dependency for you, and an expectation of the
  same name next time. Default to naming the discipline, not the person.
- **Founding-member panel: advisory or binding?** Affects everything about how
  it's built, and it's a commercial question, not a technical one.
