# Project state — read this first

Session handoff. Nothing about a Claude session persists: folder access,
conversation, and task list all reset. This file plus the commit log is the
durable record.

**To resume: connect both folders below, then say "read docs/PROJECT_STATE.md".**

Last updated: 2026-08-03

---

## The two folders

| Folder | What it is |
|---|---|
| `~/Desktop/axionia-site` | **The live product.** Next.js 14 on Vercel at axionia.com. Marketing site, client portal, admin, and the research pipeline. `git@github.com:DisplacedCali/axionia-site.git` |
| `~/Desktop/axionia-app` | **Superseded.** The original CRA research agent. Kept as reference; its `/research/save` is disabled. `git@github.com:DisplacedCali/axionia-app.git` |

Both need connecting — the site for all work, the app only if comparing old
output. Almost all work is in the site.

### Project knowledge is a stale snapshot — the repo wins

The Claude.ai project knowledge for Axionia.com still carries the pre-port
artifacts. They read as current and they aren't. Treat this repo as ground
truth for everything except brand tokens.

| In project knowledge | Superseded by |
|---|---|
| `axionia_research_agent.jsx` | `lib/modules/research/` — different architecture, not a newer copy |
| `axionia_buyer_deck.html` | `/deck` → `components/deck/slides.tsx` |
| `axionia_investor_deck.html` | `/deck/founders` — ten seats at $250K as **prepaid service, not a raise** |
| `axionia_free_scorer.html` | `/pricing` (Portfolio Scorer, free) + `/request-report` |
| `axionia_supabase_schema.md` | `supabase/schema.sql` + migrations 002–014 |
| `axionia_optimizer_spec.html` | No fixed monthly tiers. Custom quote + performance pricing |
| Library "5 segments" | 9 segments, 13 state mandates |

**The one exception: `axionia_brand_tokens.md` is still canonical** and exists
only in project knowledge. `tailwind.config.ts` and
`lib/modules/research/data/tokens.ts` both track it; if they disagree with it,
they're the bug.

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
- **Buyer deck** — `/deck`. Public URL so it can be sent to someone with no
  account, but `noindex` and absent from nav, footer and sitemap: a link you
  choose to share is not the same as a page search engines surface. Arrow keys
  advance; every slide stays mounted so `@media print` can reveal all of them
  and page-break between — unmounting inactive slides prints a one-page PDF.
  Slides live in `components/deck/slides.tsx`, chrome in `DeckShell.tsx`.
- **Founders deck** — `/deck/founders`, ten seats at $250K. Gated: a staff
  session, or a signed per-recipient link (`?k=…`). Anything else `notFound()`,
  never a redirect to login — a redirect confirms the URL exists. Links are
  HMAC-signed, expiring, stateless; rotating `DECK_LINK_SECRET` revokes all of
  them at once, and there is no per-link revoke. Mint from `/admin/decks`.
  Without the env var set, the deck still works from a staff session.
- **Deck logging** — every view and print writes to `deck_events` (migration
  012, plus `link_label` in 013). Signed-in viewers print directly; anonymous ones give name, email and
  organisation first, unverified, and are also written to `leads` with
  `interest = 'buyer-deck'`. **No IP is recorded** — that's a privacy-policy
  decision, and the site has no policy yet.
- **Site analytics** — `/admin/analytics`, first-party (migration 014).
  Pageviews land in `site_events` via `/api/track`. **No IP is stored anywhere.**
  Location comes from Vercel's edge headers already resolved to country/city, so
  the address is never written down; geography is blank in local dev. Identity
  is a first-party session cookie *stitched* on form submit —
  `identifySession()` backfills the whole session, so what someone read before
  converting is attributable retroactively. Clearing cookies resets it.
- **CRM** — `companies.stage / owner_id / next_action / next_action_at`
  (migration 014). Editable on the company hub, summarised on the list with
  overdue follow-ups in red. `stage_changed_at` is stamped by a trigger, not by
  the app.
- **Vendor disclosures** — `Vendor.disclosure`. A vendor carrying an extended
  profile MUST have one; `validate.ts` raises an **error**, not a warning, if it
  doesn't. `VEN_WIN` (WIN) is kept in the library with a disclosure rather than
  removed — knowing a vendor well is why the profile is richer, and the honest
  answer is to say so. It must render wherever the vendor is named.
- **Who it's for** — `/who-its-for`. The site had no page answering "would I
  buy this, and when." Organised by **decision moment** (renewal, point-solution
  evaluation, RFP, broker change, stop-loss attachment, CFO question) rather
  than by product — a product list invites price comparison and anchors the work
  in the "report" category `/pricing` deliberately avoids. Buyer role is a
  filter over the moments, not the primary axis: CFO/owner is the wedge,
  benefits leader the early adopter, broker/health plan the channel. Carries the
  low-data-requirement differentiator (end to end on documents you already own,
  works on top of an existing warehouse rather than replacing it) and an
  explicit not-a-fit list. **Top-level nav item**, not a Platform child — it
  answers "should I buy this at all", which is asked before anyone opens a menu.
  `NavGroup` now supports `children: []`, which renders a plain link rather than
  a disclosure button with an empty panel. Also in the footer and sitemap.
  Uses `pos-dark` / `caution-dark` / `risk-dark`, added to `tailwind.config.ts`
  from the semantic scale's dark-text variants — the base semantic hues are
  calibrated as marks on the warm base, not as small type on it.
- **Client report page** — `/reports/[id]`. Reads through the **anon client
  carrying the user's session**, so `reports_select_company_ready` does the
  authorisation in the database: released only, requester or same company.
  Using the service role and checking status in TypeScript would move that
  guarantee into whichever branch someone edits next. Signed out redirects to
  login with `redirectTo`; anything else is `notFound()`, identical for ids
  that don't exist. Renders through the same `ReportRender` as the admin
  preview — that's what the optional `slots` prop is for. `noindex`.
- **Withheld sections** now render as locked cards with a CTA each, replacing a
  grey text list. Copy lives in `WITHHELD_COPY` in `ReportRender.tsx` and
  describes what a section *contains*, never what the client is missing — a
  free report that reads as a trailer undermines the part that was real.
  **`brief` is deliberately absent from that table**: the Pre-Meeting Brief is
  internal preparation, not a paid upgrade, and advertising it as locked would
  advertise something that will never be delivered. Anything withheld without
  copy is simply not shown.
- **Report view/print logging** — `report_events` (migration 015). Same shape
  and same no-IP decision as `deck_events`, separate table because every row
  here is an authenticated session against a specific report. The server action
  **re-checks RLS before writing**: it selects the report through the anon
  client first, so a signed-in user can't enumerate ids and mint log rows
  against reports they can't read. `company_id` is denormalised point-in-time.
  Prints get a partial index — a print is the buying signal, a view isn't.
- **Objective weighting** — `lib/objectives.ts`, rendered on `/platform` and in
  the deck. Axionia scores the evidence, never the objective; weights reorder
  recommendations and must never be allowed to put a dollar figure on a soft
  outcome, which `/methodology` publicly commits to not doing.

### Not built

- **Resend is still unconfigured.** `RESEND_API_KEY` is absent, so every
  transactional send — including the release email — is skipped and written to
  `email_log` with `status = 'skipped'`. The workflow works; no mail leaves the
  building. **This is the next piece**, and it's config rather than code. See
  `docs/EMAIL-SETUP.md`.
- Client-side signed download for legacy file-only reports. `/reports/[id]`
  detects `content: null` and says the report was delivered as a document
  rather than rendering an empty one. Few enough of those exist that replying
  beats building the path.
- Paid tier: artifact ingestion, entitlement checks, module registry.

### Open, deliberately

- **Output is long-winded.** Tabled. When you return to it, the single biggest
  contributor is the regulatory prompt in `pipeline/prompts.ts`, which asks the
  model to enumerate mandates, paid leave, federal overlay and watch signals for
  *every* detected state — that produced five pages for one company. Now that
  the curated mandate table carries the load, that prompt could ask for
  commentary on the two or three highest-exposure states only.
- **Mandate library covers 5 states** (CA IL MA MN NY, 13 mandates). Runs detect
  more; states outside the library are labelled model-generated and unverified.
  **Reviewed 2026-08-03 and deliberately left.** Expanding means per-state
  statutory research where `erisa` reach is the load-bearing field, and done
  quickly that's exactly how a plausible-looking fabricated row gets in.
  Suppressing uncovered states loses real signal — "you have staff in WA, there
  is a paid-leave program" is useful when labelled. The actual defect is the
  regulatory prompt enumerating everything for every detected state, which is
  the verbosity item above. Fixing coverage would not fix that.
- **Privacy policy.** There isn't one, and two tables now depend on that gap
  staying acknowledged: `deck_events` and `site_events` both deliberately omit
  an IP column for this reason. Get a policy up before anyone adds one, and
  before wiring reverse-IP company lookup (Clearbit Reveal, RB2B and similar).

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

**Fallback scores block release — in the action, not just the UI.** When
scoring fails the pipeline substitutes estimates flagged `_fallback`. Those are
excluded from benchmark views, and `releaseReport()` calls
`hardReleaseBlockers()` and refuses. For a product selling analytical rigour,
showing estimated defaults as a real assessment is the worst available failure,
and a disabled button doesn't prevent it — a stale tab or a future call path
reaches the action directly.

Blockers carry a severity. **hard** = the report looks finished and isn't
(fallback scores, missing axes) and is enforced server-side. **soft** = visibly
incomplete rather than quietly wrong (empty profile, not marked reviewed) and
stays advisory. That split is what keeps the gate from needing an override
flag, and an override used routinely is UI-only enforcement with extra steps.
Both lists derive from one `computeBlockers()` — two independent lists would
drift, and the one that drifts silently is the one that stops blocking.

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
| `DECK_LINK_SECRET` | Signs founders-deck share links. 24+ chars or it's treated as unset. Rotating it revokes every outstanding link. |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | |

Supabase project ref: `vzybdifqwvrlheuyzcui`

Keep `DATABASE_URL` **Production-only**. Preview deploys share the same
database, so a branch could otherwise write test runs into the benchmark.

### Migrations applied

`schema.sql`, then `002`–`015`, plus `supabase/research_schema.sql` for the
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
