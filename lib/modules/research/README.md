# Research module

The Axionia Research Agent, moving from `axionia-app` into the site as a module.

**Status: steps 1–2 of 4 complete.** Data layer and pipeline are here and
runnable via the API. Not yet wired into `/admin/new` (that's step 3, alongside
the report UI), and the Express server in `~/Desktop/axionia-app` still works.

## Layout

```
lib/modules/research/
  data/                 pure — no React, no Next, no I/O
    types.ts            contracts for Benefit / Segment / Vendor / Mandate / Axis
    benefits.ts         30 curated benefit programs, 4 value scores each
    segments.ts         5 workforce segments with ordered benefit preferences
    vendors.ts          17 vendors, 18 benefit→vendor mappings, fertility set
    mandates.ts         13 state mandates across CA IL MA MN NY
    axes.ts             8 radar dimensions, normalised weights, score bands
    tokens.ts           brand colours, from axionia_brand_tokens.md
    validate.ts         integrity checks
    index.ts            public surface: re-exports + lookup functions
  pipeline/             pure except llm.ts (network) — no DB access
    prompts.ts          all prompts, ported verbatim
    json.ts             tolerant JSON extraction + array salvage
    llm.ts              Anthropic client + deterministic mock
    steps.ts            the 10 steps as pure functions
    plan.ts             DAG: dependencies, waves, plan self-check
    runner.ts           advances one wave per call, persists, resumable
    types.ts            job / step / result contracts
    __dryrun__.ts       in-memory harness (not imported by the app)
  db.ts                 research-schema access over direct pg
```

## The module boundary

`data/` and `pipeline/` (except `llm.ts`) are pure. Steps receive an `LlmClient`
rather than reaching for a global, and the runner owns all persistence. That
split is why the whole DAG is testable against a mock.

Keep it. It's the shape each future paid module should follow.

## Why direct `pg` and not supabase-js

The `research` schema is deliberately **not** in Project Settings → API →
Exposed schemas, so PostgREST doesn't serve it and supabase-js cannot reach it
at all. `db.ts` connects over `DATABASE_URL` instead. The only way into the
benchmark data is server-side code holding that connection string.

## Running a job

```
POST /api/modules/research            → { jobId }  (or a cached run, if one exists)
POST /api/modules/research/:id/advance → runs ONE wave; call until done:true
GET  /api/modules/research/:id         → status + per-step progress
DELETE /api/modules/research/:id       → cancel
```

Admin only. Ten model calls across seven waves, ~60–90s total.

Advancing one wave per request rather than running the whole pipeline in one
invocation is not about the timeout — Vercel's Fluid Compute would allow a
single long call. It's that a mid-run failure would otherwise re-spend every
prior call, progress would be invisible until the end, and closing the tab would
lose work already paid for. The queue row is also the audit trail.

Concurrency is safe: `claimJob()` is a conditional UPDATE, so a double-click
costs a queue row rather than ten model calls. A partial unique index blocks a
second live job for the same company.

## Verification

```
npm run research:dryrun
```

Exercises the full DAG against a deterministic mock: wave ordering, dependency
resolution, JSON extraction from fenced and prose-wrapped output, overall-score
recomputation, optional-step degradation, required-step failure, resumability
without repeating work, the concurrency claim, and the workforce fallback path.
No database, no API key, no tokens.

`validateResearchData()` returns structured data-integrity issues;
`formatDataIssues()` prints them. Currently **0 errors, 2 warnings** (below).

## Planned remaining steps

3. Port the six report tabs as React components; wire `/admin/new` to start a
   job and show wave progress.
4. Add the module registry and entitlement check.

## Schema

`supabase/research_schema.sql` — the `research` schema and everything in it.
Idempotent. It moved here from axionia-app: keeping it in a different repo from
its only consumer is how the database ended up a version behind, with
`normalize_domain()` missing while `db.ts` called it.

axionia-app is superseded and its `/research/save` is disabled. Both codebases
wrote to the same `research_runs` and `radar_scores`, but derived `overallScore`
differently — that repo takes it from the model, this one recomputes it from
normalised weights. Mixing the two would make the benchmark inconsistent about
how its headline number is produced.

## Open data questions

Two findings from the port. Both are product-data decisions, not code bugs, so
they're recorded rather than silently fixed.

### 1. `BEN029` does not exist

`BENEFIT_VENDORS` maps a BetterUp offering to benefit `BEN029`, but `BENEFITS`
runs `BEN028` → `BEN030`. The mapping is unreachable, so it's dead data rather
than a crash. Either add the missing benefit (leadership / executive coaching,
Career Development) or drop the mapping.

### 2. RESOLVED — ten of thirty benefits were unreachable

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

Fixed by the dimension rework. Four new segments (senior non-clinical
professionals, technical/engineering, skilled trades, distributed remote) carry
the clinical and income-protection benefits that no segment previously
referenced. **All 30 benefits are now reachable and all seven `financial: 5`
benefits can surface.**

## Segment dimensions

Segments are matched by DIMENSIONS, not role vocabulary:

| dimension | values |
|---|---|
| `comp` | low · medium · high · very_high |
| `work` | shift · field · onsite · hybrid · remote |
| `replaceability` | easy · moderate · hard |
| `licensed` | boolean |
| `clinical` | boolean |
| `supervisory` | boolean |

The original five were named after healthcare roles, which conflated "highly
paid and hard to replace" with "clinical" — so a portfolio manager matched
nothing while a maintenance technician matched *Clinical Support* on the word
"technician". A surgeon and an investment principal share every dimension except
`clinical`, and they want broadly the same things.

`supervisory` earns its place: it is the only thing separating a shift supervisor
from a maintenance technician — same pay band, same shift work, different
economic position. It matches specific phrases ("shift supervisor", "branch
manager") rather than the bare word "manager", which would misfile every
professional whose title contains it.

`replacementComplexity` comes from the model directly. Comp and work model are
inferred from the role name, with role-implied work models ("operator" means
shift, "maintenance" means plant floor) checked before falling back to a prior —
matching stays correct even with no description at all.

Adding an industry needs no new keyword list. Adding a segment means tagging it
with dimensions.
