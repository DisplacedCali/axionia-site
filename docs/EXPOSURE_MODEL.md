# Population exposure model — specification

Draft, 27 August 2026. Nothing here is built. Written before code because the
alternative is four plausible constants in a React component that nobody can
defend in a room.

> ## → Stage 0 was run on 2026-08-31. It does not work as specified.
>
> The test was to check that the model's `cost_index` ordering across
> industries correlates with MEPS-IC published premiums, with **failing
> treated as disqualifying**. Run against MEPS-IC 2020 Table I.C.1, the
> correlation is **Spearman rho = −0.70** — significant at n=9, and pointing
> the wrong way.
>
> The model is not what failed. **Premium measures what an employer chose to
> buy, not what its population costs.** Professional services carries the
> highest premium in the table and among the lowest physical exposure;
> agriculture carries the lowest premium and the highest. Any exposure-based
> index will anti-correlate with premium, because plan generosity tracks
> compensation and compensation is inversely related to physical work.
>
> Stage 0 as written would have deleted a working model. It is now a **confound
> check** rather than a validation — see *Calibration and falsification*.

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
              × cost_index          // how much of this is here, and how expensive
              × addressability      // can a program of this shape reach it?
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

### Two indices, not three — resolved 27 August 2026

The draft carried `prevalence` and `severity_mix` separately. Public sources
cannot separate them, so they collapse into one **`cost_index`**: how much of
this category is present in this population, and how expensive the presentation
is, as one number.

The reason is in the sources. MEPS and HCCI publish spend by age band, which
conflates prevalence and severity by construction — a 55-year-old costs more
both because more of them have the condition and because their presentation is
worse, and the published figure does not separate the two. SOII does carry both
incidence and days-away-from-work, so MSK is partially separable, but one
category being separable does not justify a model-wide split.

Two indices that can be defended beat three that cannot. They separate when
client claims data allows it, not before.

### Not every category takes a cost index

A structural distinction the draft missed. The things employers buy are not all
the same kind of thing:

| Kind | Examples | Takes `cost_index`? | Takes `addressability`? |
|---|---|---|---|
| **Condition category** | MSK, behavioral, cardiometabolic, fertility | Yes | Yes |
| **Delivery mechanism** | Navigation, second opinion, onsite clinic, EAP | **No** — it is not a condition and has no prevalence | Yes, and it is the whole story |

A navigation vendor's value is not driven by how much navigation a population
has. It is driven entirely by whether the people who need steering can be
reached, which is why Northrock's clinic finding is an addressability finding
and not a prevalence one. Applying a cost index to a delivery mechanism would
be a category error with a number attached.

### Strong — public, annual, citable, directly on point

**cost_index** — age and sex mix from **BLS Current Population Survey** by
industry and occupation. Musculoskeletal disorder rates from the **BLS Survey
of Occupational Injuries and Illnesses**, published annually by NAICS.

> **SOII measures the workers' compensation channel, not the group health
> channel.** Work-related musculoskeletal injury is paid by comp; non-work
> musculoskeletal cost lands on the health plan. SOII is therefore a proxy for
> a population's musculoskeletal loading, not a measure of its health-plan MSK
> spend, and it must be described that way. A model that quietly presents an
> occupational injury rate as a health-plan prevalence rate is doing the exact
> thing this company exists to catch, and it would not survive one actuary in
> the room.

Work-context exposure from **BLS Occupational Requirements Survey**
environmental conditions, or **O\*NET** work context (Exposed to Contaminants,
Exposed to Hazardous Conditions, Spend Time Standing, Spend Time Making
Repetitive Motions), scored per occupation. ORS is preferred where both cover a
field — it is BLS-collected, O\*NET is incumbent-surveyed. O\*NET's advantage is
breadth and that it is SOC-keyed.

**addressability** — night and alternative shift prevalence by occupation from
BLS. Site dispersion and remote share from the segments' existing `work`
dimension. This is the Northrock access finding generalised: a program's value
is bounded by the share of the affected population that can physically reach it.

### An input, not a coefficient

**covered_lives is a policy variable and it is moving right now.** Disney
confirmed on 24 August 2026 that spouses with coverage available from their own
employer come off the plan. A model that bakes covered-lives-per-employee into
a constant is hardcoding something employers are actively re-cutting, and would
have been wrong about Disney four days ago. So it is asked, not assumed.

---

## Category coverage at v1 — resolved 27 August 2026

**The framework is category-agnostic. Exactly one category is populated at
launch: musculoskeletal.**

Every other category carries the same structure with its indices at 1.00 and
the gap stated, which is what the reference-population design is for — an
unsourced factor does nothing rather than quietly doing something.

MSK is first because it is the only category where the occupation-to-cost link
is directly published: SOII carries musculoskeletal disorder rates by NAICS,
annually, and has for decades. It is also the largest point-solution category
by spend, the Northrock headline, and the demo's default — so the one category
we can evidence is also the one we most need.

Behavioral and cardiometabolic follow on age, sex and shift structure, which is
weaker evidence and should be labelled as such when it lands. Fertility waits
on the pathway problem below. Delivery mechanisms never get a cost index at all.

A model that works on one category with real evidence is worth more than five
where four are guessed, and it is the only version consistent with the rule in
CLAUDE.md.

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

## Calibration and falsification — resolved 27 August 2026

Three stages, and **the first needs no clients at all.**

### Stage 0 — a confound check, not a validation. Run 2026-08-31.

**What was specified:** correlate the model's `cost_index` ordering across
industries with MEPS-IC published premiums; failing is disqualifying.

**What happened.** MEPS-IC 2020, Table I.C.1, average total single premium per
enrolled employee, nine industry groups:

| Industry group | Premium | Premium rank | Exposure rank |
|---|---:|---:|---:|
| Professional services | $7,661 | 1 | 9 |
| Utilities and transp. | $7,181 | 2 | 4 |
| Fin. svs. and real estate | $7,112 | 3 | 8 |
| Wholesale trade | $7,110 | 4 | 7 |
| Mining and manufacturing | $7,026 | 5 | 3 |
| Other services | $6,916 | 6 | 6 |
| Construction | $6,656 | 7 | 2 |
| Retail trade | $6,629 | 8 | 5 |
| Agric., fish., forest. | $5,716 | 9 | 1 |

Exposure rank is a stand-in — the model does not exist yet — but its direction
is not controversial: farm and construction work is harder on a body than
professional services. **Spearman rho = −0.70**, against a critical value of
about 0.683 for n=9 at p<0.05. Significant, and negative.

**Why, and why it is not the model's fault.** Premium is what the employer
chose to buy. Plan generosity tracks compensation, and compensation runs
opposite to physical exposure: the industries whose workers' bodies take the
most punishment buy the thinnest plans. Agriculture is not at $5,716 because
farm workers are healthy.

The same table rules out the obvious alternative explanations. Industry spread
is $1,945 (34%). The low-wage split is $546 (8%), firm size $424 (6%) and
non-monotonic, union presence $405 (6%). Industry carries real signal — it is
simply signal about purchasing, not about population.

**What Stage 0 is now.** A check that the index has *not* accidentally become a
compensation proxy, with the prediction registered before it is run:

- `cost_index` against MEPS-IC premium should show **|rho| below about 0.4**.
  A strong *positive* correlation means the index has picked up wage level and
  needs rebuilding. That is a real failure mode and this is a real test of it.
- A face-validity screen: an index that does not place construction and
  agriculture above professional services on musculoskeletal loading is broken
  in a way no statistic is needed to see.

Neither is validation. **Stage 0 cannot validate this model, and no public
dataset can**, because every public outcome at industry level is either
confounded by plan design or is one of the model's own inputs. The burden of
proof moves entirely to Stages 1 and 2, and the *what would change our mind*
below is the whole of it.

*The wider lesson, worth keeping:* the spec's own first test was invalid, and
finding that cost an afternoon with a public table rather than a build cycle
and a year of quietly wrong numbers. Specifying a falsification test before
building is what made the flaw findable at all.

### Stage 1 — sign test at eight engagements

For each engagement, the predicted index is **written down before the claims
data is opened**. That pre-registration is what makes it a test rather than a
story told afterwards, and it is the single most important operational
commitment in this document.

At eight, a binomial sign test on whether the segment-adjusted prediction beat
a flat all-industry baseline. Seven of eight is *p* ≈ 0.035. That is a real
early signal at a count reachable inside the first year.

### Stage 2 — error comparison at twenty-five

Out-of-sample prediction error, segment-adjusted against flat baseline.

*What would change our mind:* if segment-adjusted predictions do not beat the
flat baseline at Stage 2, the exposure model is decoration and gets **deleted
rather than tuned**. Tuning a model that cannot beat its own null is how a
methodology becomes astrology, and it is a failure mode this company is
supposed to be able to name in other people's work.

The thresholds are set here, before the first engagement, deliberately.
Choosing them once results are visible is not a test.

---

## Implementation shape

1. `matchSegmentToOccupation`, parallel to `matchSegmentToLibrary`. Maps a model
   segment to a SOC major-group mix, or returns null with a reason.
2. Exposure tables keyed on SOC major group and NAICS sector, populated from the
   strong tier only.
3. A sources file in the manner of `MARKET_STATS.md` — every field carrying
   source, vintage and retrieval date, so an index can be aged and challenged.
4. `ReportDemo`'s four private profiles are deleted. It reads a NAICS sector,
   which is the resolution its single industry control can honestly support.
5. `CATEGORY_BASELINE` becomes a function of the exposure blend rather than a
   constant. That closes the open item from D3.
6. Indices are surfaced in the Assumptions tab with their sources, the same way
   every other constant in that component already is.

---

## Open decisions

- ~~Segment granularity.~~ Resolved above. The nine segments are not touched.
- ~~Category granularity.~~ Resolved: MSK only at v1, framework category-agnostic.
- ~~Prevalence and severity separable.~~ Resolved: collapsed to one `cost_index`.
- ~~N.~~ Resolved: Stage 0 back-test now, sign test at 8, error comparison at 25.

**Nothing in this spec is open. It is ready to be built or argued with.**
