# Population exposure model — specification

Draft, 27 August 2026. Nothing here is built. Written before code because the
alternative is four plausible constants in a React component that nobody can
defend in a room.

---

## Why this exists

`lib/modules/research/data/segments.ts` carries nine canonical segments, each
with a `dimensions` block: `comp`, `work`, `replaceability`, `licensed`,
`clinical`, `supervisory`. Every one of those is a **labour-market** property.
They answer *what does this workforce value*, which is why segments carry
ordered benefit preferences and why the library works.

Not one of them is epidemiological. The library can tell you a skilled-trades
workforce wants own-occupation disability. It cannot tell you that workforce's
musculoskeletal burden, whether a nine-to-five clinic can reach it, or how much
of its spend sits in eleven people.

That gap is currently filled by a single opaque number. `ReportDemo` carries a
per-industry `transfer` rate — 0.46 to 0.63 across four profiles — doing all
the population work at once, with no derivation and no source. Every
population-fit claim on the public site rests on it.

**A fifth taxonomy problem sits underneath this.** `ReportDemo`'s four
workforce profiles (manufacturing, professional, healthcare, retail) are
unrelated to the library's nine segments, with no mapping between them and no
shared vocabulary. This is the same failure recorded as E1 in the review, one
layer down. Whatever is built here must land on the nine segments, and the
demo's private taxonomy must be deleted rather than extended.

---

## What this is not

Written first, deliberately.

This model predicts **population-level** cost and addressability to inform
which programs an employer should buy. It is never used to price an
individual's coverage, determine anyone's eligibility, steer any person to or
from care, or differentiate what any individual is offered.

Age and sex appear as population cost predictors. That is ordinary actuarial
practice for plan projection and it is the same arithmetic any carrier applies
to the same census. It is not, and must never become, an input to what any
named person receives.

Where a recommendation would reduce access for a subgroup, that surfaces as an
equity finding in its own right rather than disappearing into a net number.
The Northrock report's section 07 is the precedent: the clinic returns more
than it costs *and* is unreachable by 61% of production, and both facts are
stated.

**Before any recommendation varies by health status, this needs counsel.**
ADA, GINA and ACA nondiscrimination all constrain benefit design in ways this
model does not encode. Flagging the constraint is not the same as clearing it.

---

## Structural form

One number per segment is a guess. A product of named multipliers against a
reference population is a model, because every term is separately arguable —
which is the whole promise the site makes.

```
expected_PMPM = category_gross
              × prevalence          // is the condition here?
              × addressability      // can a program of this shape reach it?
              × severity_mix        // is it the expensive presentation?
              × (1 − duplication)   // already built: duplicationShare(n)
              × (1 − selection)     // already built: SELECTION_BIAS
              × (engagement / reference_engagement)

annual_dollars = expected_PMPM × covered_lives × 12
```

Every index is **1.00 at the reference population**. That is the load-bearing
design choice: it makes each number a ratio a client can dispute rather than an
absolute they have to trust, and it means an unsourced factor sits at 1.00 and
does nothing rather than quietly doing something.

### Reference population

US private-sector employer-sponsored, all industries, BLS CPS age and sex mix,
KFF EHBS average coverage-tier distribution. Stated explicitly wherever an
index is shown, because "1.15× prevalence" is meaningless without it.

---

## Factors, drivers and sources

### Strong — public, annual, citable, directly on point

**prevalence** — age mix and sex mix from **BLS Current Population Survey** by
industry and occupation. Ergonomic and chemical exposure from the **BLS Survey
of Occupational Injuries and Illnesses**, published annually by NAICS, which
carries musculoskeletal disorder rates directly. Work-context exposure from
**BLS Occupational Requirements Survey** environmental conditions, or **O\*NET**
work context (Exposed to Contaminants, Exposed to Hazardous Conditions, Spend
Time Standing, Spend Time Making Repetitive Motions), scored per occupation.

ORS is preferred over O\*NET where both cover a field: ORS is BLS-collected,
O\*NET is incumbent-surveyed. O\*NET's advantage is coverage breadth and that it
is occupation-keyed, which matches the segment shape better than NAICS does.

**addressability** — night and alternative shift prevalence by occupation from
BLS. Site dispersion and remote share from the segments' existing `work`
dimension, which already carries it. This is the Northrock access finding
generalised: a program's value is bounded by the share of the affected
population that can physically reach it.

### Moderate

**severity_mix** — age-band spend curves from MEPS or HCCI. High-cost-claimant
concentration from `MARKET_STATS.md`, which already carries the stop-loss and
cell-and-gene figures. This is where the eleven-people-twenty-one-percent
finding becomes a coefficient rather than an anecdote.

**covered_lives** — coverage-tier distribution from KFF EHBS.

### An input, not a coefficient

**covered_lives is a policy variable and it is moving right now.** Disney
confirmed on 24 August 2026 that spouses with coverage available from their own
employer come off the plan. A model that bakes covered-lives-per-employee into
a segment constant is hardcoding something employers are actively re-cutting,
and would have been wrong about Disney four days ago.

So it is asked, not assumed. The event that makes the point also makes the case
for asking, which is a good line for the site as well as a modelling decision.

---

## What is not modelled

Recorded rather than filled, per CLAUDE.md. An index with no source sits at
1.00.

**Care-seeking pathway — and it has a known failure direction.** The sharpest
illustration in this whole area is that a manufacturing workforce can have
substantially more births than a large law firm while the law firm spends
substantially more on fertility. One population conceives without medical
intervention; the other buys IVF, because it is older, can afford it, and has a
plan that covers it. Prevalence and spend move in *opposite* directions.

A prevalence-only model is therefore wrong in a specific, predictable way, and
saying so is more useful than pretending otherwise. NCHS natality carries
mother's education, not occupation, so the proxy is weak. This belongs in the
copy as an argument — it persuades — and stays out of the model as a
coefficient until it can be evidenced.

**Plan design interaction.** Whether the plan covers a category at all
dominates prevalence for elective and fertility spend.

**Local price variation.** The same procedure at different market prices.

**Productivity and absence.** Already the report's stated position: real,
unmeasurable with the data available, counted in neither direction.

---

## Calibration and falsification

Without this section the model is a story.

When *N* client engagements have observed claims, compare predicted against
observed PMPM per segment, out of sample. The test is not whether predictions
are close. It is whether **segment-adjusted predictions beat a flat
all-industry baseline** on out-of-sample error.

*What would change our mind:* if they do not beat the flat baseline, the
exposure model is decoration and should be deleted rather than tuned. Tuning a
model that does not beat its own null is how a methodology becomes astrology.

*N to be set before the first engagement, not after.* Choosing the threshold
once results are visible is not a test.

---

## Implementation shape

1. `exposure` block on the `Segment` type, alongside the existing `dimensions`.
   Nine segments, populated from the strong tier only.
2. A sources file in the manner of `MARKET_STATS.md` — every field carrying
   source, vintage and retrieval date, so an index can be aged and challenged.
3. `matchSegmentToLibrary` already exists. `ReportDemo`'s four profiles map onto
   the nine segments and its private taxonomy is deleted.
4. `CATEGORY_BASELINE` in `ReportDemo` becomes a function of the matched
   segment rather than a constant. That closes the open item from D3.
5. Indices are surfaced in the Assumptions tab with their sources, the same way
   every other constant in that component already is.

---

## Open decisions

- **Segment granularity.** Nine segments against roughly twenty NAICS sectors
  and hundreds of occupations. Some segments will span very different exposure
  profiles — SEG002 covers hygienists and home health aides, whose ergonomic
  loads are not the same. Do segments subdivide, or does exposure attach to an
  occupation mix *within* a segment?
- **Category granularity.** `category_gross` is currently one illustrative
  figure for one category. How many categories does v1 carry — MSK, behavioral,
  cardiometabolic, navigation, fertility?
- **Whether prevalence and severity are separable** with the sources available,
  or collapse into one index until claims data arrives.
- **N**, above.
