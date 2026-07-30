# Project state — read this first

Session handoff. Nothing about a Claude session persists: folder access,
conversation, and task list all reset. This file plus the commit log is the
durable record.

**To resume: connect both folders below, then say "read docs/PROJECT_STATE.md".**

Last updated: 2026-07-29

---

## The two folders

| Folder | What it is |
|---|---|
| `~/Desktop/axionia-site` | **The live product.** Next.js 14 on Vercel at axionia.com. Marketing site, client portal, admin, and the research pipeline. `git@github.com:DisplacedCali/axionia-site.git` |
| `~/Desktop/axionia-app` | **Superseded.** The original CRA research agent. Kept as reference; its `/research/save` is disabled. `git@github.com:DisplacedCali/axionia-app.git` |

Both need connecting — the site for all work, the app only if comparing old
output. Almost all work is in the site.

---

## Where things stand

The free-report workflow runs end to end in the admin:

```
/admin/new              create a request (company, domain, industry, notes)
/admin/requests/[id]    Run research → wave progress → "Read the report →"
/admin/reports/[id]     the report, rendered. Edit scores inline. Comment on a
                        section and regenerate it. Print / PDF.
```

Ten model calls across seven waves, ~60–90s. One wave per request, so a failure
costs one wave and the job survives a closed tab.

### What's done

- **Pipeline** ported from axionia-app into `lib/modules/research/`. Pure step
  functions, DAG with a self-check, resumable wave runner.
- **Benefit library** — 30 benefits, 9 segments keyed on dimensions, 17 vendors,
  13 state mandates. Every benefit reachable from some segment.
- **Report** — `reports.content` holds immutable research; `reports.edits` is an
  overlay applied at render. Same renderer for admin preview and client view.
- **Revise agent** — comment on a section, one model call rewrites it. Writes to
  the overlay, never to content.
- **Intake customisation** — the form's "programs or vendors you'd like looked
  at" feeds the benefits, scoring and brief prompts.
- **Health endpoint** — `GET /api/modules/research/health` (admin, in browser).
  Reports env, schema version, migrations, grants. `POST` adds a write probe.
- **Staff roles** — `client` / `analyst` / `admin` / `owner` (migration 011).
  The privilege boundary is **release**, not "admin": everything upstream is
  recoverable, release leaves the building. `analyst` works the queue and edits;
  `admin` adds release; `owner` adds role assignment. Gates live in
  `lib/auth.ts` (`requireStaff` / `requireRelease` / `requireOwner`).
- **Company hub** — `/admin/companies/[id]`. Contacts, requests, reports and
  files for one account in one place. Read-only; actions stay where they work.
- **Open queue** — `/admin` now has view (open / unassigned / mine / all) as a
  separate axis from status, with inline claim-and-release on each row.

### Not built

- **Client-facing report page.** `reports.content` is populated and the renderer
  exists, but the dashboard still only lists reports and links to uploaded
  files. A released free report has nothing for the client to open. **This is
  the next piece.**
- Release email for a rendered (non-file) report.
- Paid tier: artifact ingestion, entitlement checks, module registry.

### Open, deliberately

- **Output is long-winded.** Tabled. When you return to it, the single biggest
  contributor is the regulatory prompt in `pipeline/prompts.ts`, which asks the
  model to enumerate mandates, paid leave, federal overlay and watch signals for
  *every* detected state — that produced five pages for one company. Now that
  the curated mandate table carries the load, that prompt could ask for
  commentary on the two or three highest-exposure states only.
- **Mandate library covers 5 states** (CA IL MA MN NY). Runs detect more; states
  outside the library are labelled model-generated and unverified in the report.
- **`BEN029` doesn't exist.** `BENEFIT_VENDORS` maps a BetterUp offering to it.
  Either add the benefit (leadership/executive coaching) or drop the mapping.
- **`VEN_WIN` is the only vendor with an enriched profile** and is `featured` in
  the fertility set. It's also your employer. Defensible, but a sceptical buyer
  would notice — worth an explicit disclosure rather than leaving it implicit.

---

## Invariants — don't break these

**`reports.content` is immutable.** Corrections go in `reports.edits` and are
applied at render by `assembleReport()`. This is what makes "we expose the
entire model" true in the data: every correction is reversible and the model's
original output stays inspectable.

**Overall score is always recomputed** from the eight axes using normalised
weights. Never store or trust a model-supplied total — the original prompt asked
the model to redistribute a 0.09 weight residual in prose, which made the
headline number irreproducible between runs.

**Fallback scores block release.** When scoring fails the pipeline substitutes
estimates flagged `_fallback`. Those are excluded from benchmark views and
`releaseBlockers()` refuses to release them. For a product selling analytical
rigour, showing estimated defaults as a real assessment is the worst available
failure.

**The `research` schema is not PostgREST-exposed.** Don't add it to Project
Settings → API → Exposed schemas. That's why `db.ts` uses direct `pg` over
`DATABASE_URL` rather than supabase-js — the isolation is structural.

**axionia-app must not write.** Both codebases target the same benchmark tables
but derive `overallScore` differently. Its save path returns 410 unless
`ALLOW_LEGACY_WRITES=true`.

**Brand tokens win.** `axionia_brand_tokens.md` in project knowledge is
canonical. `lib/modules/research/data/tokens.ts` tracks it; if they disagree,
tokens.ts is the bug.

---

## Verify before and after changes

```bash
npm run research:dryrun     # 79 checks, no DB, no API key, no tokens spent
npx tsc --noEmit            # the real type gate; no ESLint configured
```

The dry run covers wave ordering, dependency resolution, JSON extraction from
fenced and prose-wrapped output, score recomputation, optional-step degradation,
resumability without repeating work, the concurrency claim, report assembly, the
edit overlay, release blockers, segment matching across 13 role types, and the
revise agent. Run it before touching prompts, the wave plan, or scoring weights.

---

## Environment

Server-side only, set in Vercel (Production) and `.env.local`:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler**, port 6543. URL-encode `@` as `%40`. |
| `ANTHROPIC_API_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Must be `service_role` or `sb_secret_…`, never `sb_publishable_…` |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | |

Supabase project ref: `vzybdifqwvrlheuyzcui`

Keep `DATABASE_URL` **Production-only**. Preview deploys share the same
database, so a branch could otherwise write test runs into the benchmark.

### Migrations applied

`schema.sql`, then `002`–`011`, plus `supabase/research_schema.sql` for the
research schema. `010` added the report body, edit overlay and `client_view`;
`011` added staff roles and queue assignment. The health endpoint reports which
are missing.

**`011` promotes every existing `admin` to `owner`.** Correct only because there
was exactly one admin row when it was written. Check the table before applying
it anywhere else.

---

## Lessons worth keeping

**Migrations written in one session and never run.** Four of them sat as files
while code assumed they were applied, which cost five debugging round trips —
`report_requests.origin` didn't exist, `service_role` had no grants,
`normalize_domain()` was missing. The health endpoint exists because of this.
Run migrations when you write them.

**Schema next to its consumer.** `research_schema.sql` lived in axionia-app
while axionia-site called its functions. That's how the database ended up a
version behind. It's now in `supabase/`.

**Measure, don't theorise.** Three diagnoses in a row were wrong from reasoning
about plausibility — blaming a missing grant, then the service-role key, then
the PostgREST cache. One diagnostic endpoint settled it. With three roles and
two same-named `companies` tables in play, read the code path.

**Exported PDFs found real bugs.** The summary was findings[0] verbatim; Benefit
Design repeated one template string; the report analysed one workforce and
prescribed for another. None was visible from the admin form. Export and read
the actual output.
