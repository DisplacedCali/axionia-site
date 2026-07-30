# Research module

The Axionia Research Agent, moving from `axionia-app` into the site as a module.

**Status: step 1 of 4 complete.** The data layer is here. The pipeline is not yet
— it still runs in `~/Desktop/axionia-app` against a local Express server.
Nothing in the site imports this module yet, so it is inert.

## Layout

```
lib/modules/research/
  data/
    types.ts       contracts for Benefit / Segment / Vendor / Mandate / Axis
    benefits.ts    30 curated benefit programs, 4 value scores each
    segments.ts    5 workforce segments with ordered benefit preferences
    vendors.ts     17 vendors, 18 benefit→vendor mappings, fertility set
    mandates.ts    13 state mandates across CA IL MA MN NY
    axes.ts        the 8 radar dimensions, weights, score bands
    tokens.ts      brand colours, from axionia_brand_tokens.md
    validate.ts    integrity checks — run these in CI
    index.ts       public surface: re-exports + lookup functions
```

## The module boundary

`data/` is pure. No React, no Next, no Supabase, no `fetch`. It is safe in a
server action, an API route, a script, or a client component.

Keep it that way. It's what lets the pipeline be tested without a browser and
lets each future paid module follow the same shape.

## Planned remaining steps

2. Extract the pipeline into pure step functions, driven off `report_requests`
   as a job queue. **A single serverless invocation cannot run this** — the
   pipeline takes 60–90s and Vercel's default ceiling is 10–15s. Step-wise
   execution against the queue also makes a failed step resumable instead of
   forcing a full re-run.
3. Port the six report tabs as React components.
4. Add the module registry and entitlement check, then retire the Express server.

## Verification

`validateResearchData()` returns structured issues; `formatDataIssues()` prints
them. Wire it into CI once step 2 gives it a natural call site.

Current state: **0 errors, 2 warnings.**

## Open data questions

Two findings from the port. Both are product-data decisions, not code bugs, so
they're recorded rather than silently fixed.

### 1. `BEN029` does not exist

`BENEFIT_VENDORS` maps a BetterUp offering to benefit `BEN029`, but `BENEFITS`
runs `BEN028` → `BEN030`. The mapping is unreachable, so it's dead data rather
than a crash. Either add the missing benefit (leadership / executive coaching,
Career Development) or drop the mapping.

### 2. Ten of thirty benefits can never appear in a report

No segment references them, and `getSegmentBenefits` only surfaces what a
segment lists. The gap is not random — it is precisely the clinical and
cost-management categories:

| | Unreachable | Reachable |
|---|---|---|
| Avg financial leverage | **4.20** | 3.05 |
| Avg clinical impact | **4.40** | 3.30 |

Three whole categories are absent from every segment: **Healthcare Access**,
**Clinical Value**, **Risk / Income Protection**.

Six of the eight benefits scored `financial: 5` are unreachable — PBM strategy,
primary care navigation, direct primary care, centers of excellence, MSK care,
diabetes management. GLP-1 management is also unreachable.

The consequence is structural: the Benefit Design tab can currently only
recommend perks and retention levers, never the highest-financial-leverage
clinical interventions. For a product whose thesis is economic rigour for a CFO
audience, that's the wrong half of the library to be able to reach. Fixing it
means extending the five segments' benefit lists to include the clinical
categories — a content decision about which segments should surface which
clinical programs.
