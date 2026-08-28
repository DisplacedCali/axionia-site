# Project state — read this first

Session handoff. Nothing about a Claude session persists: folder access,
conversation, and task list all reset. This file plus the commit log is the
durable record.

**To resume: connect both folders below, then say "read docs/PROJECT_STATE.md".**

Last updated: 2026-08-14

---

## The two folders

| Folder | What it is |
|---|---|
| `~/Desktop/axionia-site` | **The live product.** Next.js 14 on Vercel at axionia.com. **DNS and registrar are GoDaddy, not Cloudflare** — an earlier version of this file said Cloudflare and it was wrong. Resend's DNS records go in GoDaddy. Marketing site, client portal, admin, and the research pipeline. `git@github.com:DisplacedCali/axionia-site.git` |
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
| `axionia_illustrative_report.html` | `public/example-report.html` — corrected 2026-08-27: sections renumbered, vocabulary aligned, a high-cost-claimant section added. The project copy is the stale one |

**The one exception: `axionia_brand_tokens.md` is still canonical** and exists
only in project knowledge. `tailwind.config.ts` and
`lib/modules/research/data/tokens.ts` both track it; if they disagree with it,
they're the bug.

---

## The argument — what we believe and why

The rest of this file records what is built. This section records what the
company claims about itself, because those decisions get re-litigated every few
months and the operational record has never held them. The methodology-versus-moat
contradiction below survived a full port from HTML into React purely because it
was settled in conversation and written down nowhere a reader would look.

**Numbers live in the model, not here — and the model is now readable from this
repo.** `docs/model/axionia_3statement_model.xlsx` is the single source, and
`docs/FINANCIAL_MODEL.md` is a headline extract of it: the gate, Years 1–3, Year 7
by scenario, and the round terms. **Read the extract first.** It is text, so it
diffs in review and a session can use it without opening a spreadsheet; open the
workbook when you need the revenue build, the staffing plan or the exit returns.

If the two disagree, the workbook wins and the extract is stale — regenerate it
rather than editing the workbook to match. The distribution copy still lives in the
admin at `/admin/decks`, one timestamped upload per revision, which is what answers
"which version did that investor see"; the repo copy is for reading, not sending.

Anything stated in a deck, a page or a document should trace to one of those two. On
2026-08-14 the investor deck disagreed with the model in four places, twice in the
same content after a port from HTML to React, which is a structural problem rather
than bad luck — nothing tied them together and no reviewer could see the numbers.

Each entry says what would change our mind. A decision with no falsifier reads
as dogma to the next reader, including you.

### The gate

One falsifiable milestone decides the funding path: **has a third party — a
health plan, a PE diligence team, a reinsurer — paid for the benchmark data by
the end of Year 3.** Not expressed interest, not a pilot. A signed, invoiced
contract for the data asset itself.

Years 1–3 are identical in all three scenarios and funded entirely by the $1.0M.
Divergence starts Year 4. Base takes an $8M Series A; Bear takes nothing and
still reaches $11.8M revenue and $4.8M net income by Year 7.

*What would change our mind:* if the data only sells bundled with consulting,
the asset is not separable and the compounding-moat argument weakens badly.

### The methodology is the wedge, not the moat

Settled 2026-08-14. The scoring framework is published on purpose — transparency
is the trust asset and the product promise. It is copyable, and that is fine.

What is not copyable is the outcome history that says what the weights should
be, and the fact that a broker cannot sell independent vendor scoring without
cannibalising the commission revenue that funds it. Earlier decks headlined "the
methodology is the company" and called the framework "the long-term moat", which
directly contradicted the defensibility argument two slides later.

*What would change our mind:* a broker or consultancy launching genuinely
independent scoring and absorbing the conflict. The structural claim would go
and only calibration would be left.

### Defensibility, in order of strength

1. **Structural independence.** The incumbent is paid by the vendors it would
   have to score. Economic, not technical — it does not erode as inference gets
   cheaper.
2. **The compounding benchmark asset.** Accrues only by doing the work
   repeatedly, for real clients, over years. Not scrapable.
3. **Calibration.** The outcome history that says which vendor claims held up.

Explicitly **not** an AI moat. Capability is rented, every 2026 deck asserts one,
and asserting it invites the discount rather than avoiding it. AI is a tailwind
and it appears in the model as margin: 12 → 20 clients per delivery analyst from
Year 3 to Year 7, and gross margin of 69% → 89% across the same span.

### Why Base is the conservative case

Base is not the optimistic scenario — it is the one being underwritten because
it depends on the least. It assumes zero channel or data revenue until the gate
clears. Bull shows the ceiling and is not what the round is priced off; its $30M
Series B is illustrative of a shape, most likely acquisition-shaped, not a plan.

The Series A is a **choice, not a requirement**. All three cases are EBIT-positive
from Year 2, so this round buys the bridge to profitability rather than runway to
the next raise. That is what makes Bear a floor instead of a failure case.

### The round

$1.0M at $6.0M pre / $7.0M post — 14.286% to new investors. Series A when the
data sells, $8M at $29M pre.

The Series A was deliberately cut from $15M to $8M. At $15M the capital sat
permanently undrawn, because the business self-funds from Year 2. A smaller round
that is actually deployed produced higher Year 7 revenue *and* less dilution,
which is the opposite of the intuition and worth being able to say out loud.

The 10% employee pool and 5% partner grant are carved pre-money, so they dilute
the founder rather than the incoming investor. Founder ownership at Year 7 is
72.9% / 57.1% / 42.8% across Bear / Base / Bull. Pool *size* drives dilution;
pool *timing* does not.

### The three decks are three audiences

`/deck` is the buyer deck and public. `/deck/founders` is ten seats at $250K as
prepaid service, not a raise. `/deck/investor` is the raise, gated.

The investor deck has **no demo, on purpose** (2026-08-14). An investor arrives
having been walked through `/deck` already, so the walkthrough was the product
tour twice, at slide 6 of fifteen. The proof-of-product claim lives on the
valuation slide instead, where it prices the round. If this deck ever needs a
walkthrough again, import `DeckFlow` — do not write a second cut. That mistake
has already been made once.

### Three scoring sets, one name — settled 2026-08-27

Three sets of eight existed and the one in production appeared nowhere in the
marketing. **A** (Evidence, Population fit, Cost efficiency, Utilization, Vendor
stability, Engagement, Contract terms, Transparency) lives as illustrative
constants in `RadarPreview` and `ReportDemo` and grades *programs*. **B**
(spendEfficiency, decisionMaturity, workforceAlignment, vendorIndependence,
analyticsReadiness, cfoEngagement, regulatoryReadiness, appreciationValue) is in
`prompts.ts` and `research_schema.sql` and is what a real run computes. **C**
(Value verification, Economic alignment, Attribution discipline, Access equity,
Contract leverage, Plan design fit, Workforce alignment, Data readiness) is the
illustrative report's.

Two tests decided it. Set A scores 1 of 8 from what the free form collects — the
home page promises a portfolio scored on eight dimensions the free report is
structurally incapable of delivering seven of. And Set B contains
`cfoEngagement`, inferred from LinkedIn signals: `axionia_research_agent.jsx`
heritage, built to score companies we were *prospecting*. It is a sales
qualification rubric wearing a client-deliverable costume.

**Three layers, three names.** B stays where it is as an internal prospect-fit
score and stops being called the client score. C becomes the client-facing
portfolio score — free scorer, home radar, report. A's axes survive as the
per-program scorecard in the paid detail and are never again called "the eight
dimensions". The error was never the axes; it was calling a program scorecard a
portfolio score.

*What would change our mind:* if the free form cannot answer Set C without
becoming long enough to depress completion. Fallback is a score on fewer than
eight axes that names the ones it could not assess.

Not built. Sequence and scope in `docs/REVIEW_2026-08-27.md` under E1.

### Population exposure model — spec complete, nothing built

`docs/EXPOSURE_MODEL.md`. The segment library carries labour-market dimensions
and no epidemiological ones, so every population-fit claim currently rests on
one opaque per-industry transfer rate in `ReportDemo` with no source.

The spec does **not** touch `segments.ts` — exposure keys on SOC major group and
NAICS sector via a second matcher parallel to `matchSegmentToLibrary`, because
the library and the exposure model are right about different questions and
neither should be bent to the other.

*What would change our mind, and it is available before the first client:*
Stage 0 back-tests the model's cost-index ordering across industries against
MEPS-IC published premiums. Failing is disqualifying. If segment-adjusted
predictions later fail to beat a flat all-industry baseline out of sample at
25 engagements, the model is deleted rather than tuned.

### Open — flagged rather than resolved

- **Revenue per head has no source.** The defensibility slide says 46 analysts
  deliver $60.6M and that a consultancy at that revenue carries several times
  the headcount. The second half is an assertion. It needs a real comp or it
  should come out.
- **Whether Bull belongs in an investor deck at all.** It is explicitly not what
  the round is priced off, which raises the question of what it is doing there.
- **`axionia_investor_deck.html` is still in Claude project knowledge** and was
  updated 2026-08-14, which makes an artifact this file lists as superseded look
  current. Either delete it there or label it a standalone leave-behind.

*Inferred rather than stated by Tom, and worth a second look: the ordering of the
three defensibility claims, and the framing of the methodology as a trust asset.
Everything else here traces to the model or to a decision made explicitly.*

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
- **Deck traction** — `/admin/decks` counts people, not rows (migration 036).
  Three faults fixed together. **Depth**: view and print were the only kinds,
  so one slide read and thirteen read produced identical rows. A `progress`
  event carries `max_slide` and `total_slides`, flushed from `DeckShell` on a
  six-second dwell and on `visibilitychange`/`pagehide`; both numbers are
  stored because deck length changes. **Double-counted downloads**:
  `requestDeckDownload` wrote a print when somebody *asked* for the emailed
  link and the print itself wrote a second, so every completed download was
  reported twice and every unanswered request as a download. `request` is now
  its own kind, backfilled by an exact discriminator — the request path sets
  no `user_agent`, and every print through `log()` does. **Three strangers**:
  one person leaves rows carrying a link label, nothing, and an email, so
  `lib/deckAnalytics.ts` resolves identity per SESSION first and per row
  second, and the email typed at the gate retroactively names every slide read
  before it. Staff opens are excluded from every figure — presenting is not
  traction — and stated beside the heading rather than dropped silently.
  `session_id` is **the existing `ax_sid` cookie**, not a new identifier: the
  deck log was the one table standing outside the 014 stitch, so a deck open
  now joins to the marketing pages read on the way to it. Still no IP.
  Both paths degrade: the page falls back to the base column set on error, and
  the logger retries in the old shape on `42703`/`23514`, so a deploy landing
  ahead of the SQL editor loses depth rather than the log. `036` drops the
  event constraint **by discovery, not by name** — 012 declared it inline, and
  a no-op drop would leave the old constraint beside the new one with depth
  quietly never recording.
- **Deck attribution** — deck opens resolve to an employer or firm (migration
  037), from four sources recorded in `attribution` so an exact match and a
  guess never read the same. **`link`**: `mintDeckLink` now signs a company or
  firm id into the token, so a gated-deck open attributes with certainty — you
  chose the recipient, it is not an inference. **`session`**: the 014 stitch,
  via the `session_id` 036 added. **`email`**: the download-gate address
  through `resolveCompanyByDomain`, which follows a merge. **`ip`**: a third
  party resolves an address to an organisation and **only the organisation is
  kept** — dark unless `IP_ORG_LOOKUP` is set, and **do not enable it before
  `/privacy` has been through counsel**.
  **There is still no IP column, on purpose.** An IP is a bad count of people
  in both directions — a firm behind one NAT egress collapses to one reader,
  CGNAT splits one reader into several — and the case it collapses is the
  signal worth having. `session_id` counts forwarded opens correctly. 2026
  reverse-IP match rates are 30–65% and falling, and the failure mode is a
  stale mapping returning a confident wrong name, not a blank.
  **The link format is backward compatible**: payload went from `label.exp` to
  `label.exp.c:<uuid>`, parsed from the right so outstanding links still
  verify, including labels containing full stops. It rests on the label
  sanitiser stripping colons — now asserted at mint time, not left as a
  convention. 23 tests cover legacy tokens, cross-deck rejection and a forged
  ref.
  **Fixed while wiring it: the label was client-supplied.** 013 says a label
  "cannot be set by the caller"; the logging actions took whatever string the
  browser posted, so any read could be attributed to any name. The token
  travels now and is re-verified server-side on every event.
  **The 037 backfill applies nothing** — `deck_attribution_proposals` is a
  view with a confidence and a basis per match, and the apply statements sit
  in a comment. A fuzzy match written into an attribution column is invisible
  the moment it lands.
- **The inbox filters automated submissions** (`lib/leadAuthenticity.ts`, no
  migration). Ranking was the wrong instrument: how promising a real inquiry
  is and whether anybody is there are different questions, and one score
  buries the quiet real one. Derived at read time, never stored. **A false
  positive costs a client who thinks they were ignored, so evidence of a
  person — opened a deck, requested a report — is checked FIRST and returns
  immediately**, where no accumulation of weak suspicion can outvote it.
  Filtered rows are one click away under a Filtered tab, each showing which
  rule caught it; nothing is deleted. Counts reported as "N today · M this
  week". **`isCorporateDomain` is deliberately NOT a counterweight** — it only
  means "not free-mail", so throwaway domains qualified and crediting it
  cancelled the signals for exactly the rows they were written for. A single
  pitch word decides nothing; two are needed. `lib/inbox.ts` applies the same
  rule, or the badge and the list disagree about what is waiting.
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
- **Deck downloads are verified and watermarked.** The old print gate asked for
  a name and believed it, so the PDF left with no proof of who took it and the
  resulting lead was self-reported — which is why "opened the deck" had to be
  treated as a soft signal in the inbox ranking.
  Now: **view stays public** (the ideas are on the marketing site in more
  detail; what travels is the file), the download emails a signed link, and
  clicking it proves control of the address — the same proof an OTP gives with
  none of the ceremony. **The identity is inside the signature**, so a
  recipient can't edit the URL to put someone else's name on a copy they're
  about to forward; that's what makes the watermark worth anything.
  Every printed page carries `Prepared for … · email · date · Confidential`
  via a `position: fixed` print rule, which repeats per page — a single in-flow
  element would appear once and prove nothing about pages 2–14. Phrased as
  personalisation rather than a legal notice: equally traceable, and a document
  that visibly distrusts its reader is a worse document.
  **The lead is recorded on request, not on verification** — someone who asks
  and never clicks still wanted the deck. `DECK_DOWNLOAD_SECRET` falls back to
  the deck/report secrets; set it separately so revoking one class of link
  doesn't revoke the others.
  **Ships dark until Resend works.** `sendEmail` reports `skipped` with no API
  key and the modal says so plainly rather than claiming to have sent
  something — a gate that swallows the request looks identical to a broken
  site.
- **Leads are ranked by signal, and can become clients.** Two gaps found once
  real people started arriving. **`leads` and `auth.users` are separate tables**
  — Paul submitted the contact form, Dave printed the buyer deck, and neither
  went through `/signup`, so neither had an account and neither appeared under
  Users. That separation is correct (a contact form silently creating a login
  would be wrong), but there was no path between them: **Make client** on a
  lead row creates the account, resolves the company by domain without creating
  one, and marks the profile `legitimate` so sweeps leave them alone. No email
  is sent — an unsolicited "here's your account" reads as presumptuous; you
  reply as a person and the account is simply there.
  The inbox now sorts by `lib/leadSignal.ts` rather than recency, which had put
  *"This is amazing!"* from a named person at a real company below a
  random-string submission that arrived later. Score comes from cross-reference
  (they opened the deck, or requested a report — the strongest signal available
  without speaking to them), high-intent interest, whether a human actually
  wrote the message (word count, not length — a random string is long), and a
  corporate domain. Derived, never stored, same reasoning as `accountReview`.
  High signal gets the gradient rule and a summary banner. **One visual weight,
  not a heat scale** — three shades of urgency is a legend to learn, and the
  only question is whether to open it now.
- **Account review** — `/admin/users` gains People / Needs review / Hidden
  (migration 021). Signup abuse filled the list with random names and
  harvested-looking free-mail addresses. **Nothing is deleted** — hiding is
  reversible and deleting destroys the evidence of the abuse, with no
  operational upside.
  Suspicion is **derived at read time, never stored** (`lib/accountReview.ts`):
  freezing a guess into a column means it goes stale and starts being treated
  as fact. The strongest signal is `auth.users.email_confirmed_at is null` past
  24h — Supabase creates the auth user when the code is *requested*, not
  entered, so an unconfirmed account is one nobody wanted, often including the
  person whose address was used. Name/company entropy and free-mail domain are
  secondary and only count together; anyone who requested a report or is linked
  to a company is never flagged. `legitimate` is sticky, so a real client who
  trips the heuristic is confirmed once. Bulk sweep refuses to touch staff or
  anything already marked legitimate, and takes ids from the rendered list so a
  row that arrived a second ago can't be swept unseen.
  Reasons render on the row: a flag you can't interrogate gets obeyed blindly
  or ignored entirely, and both are worse than a sentence.
  021 also narrows the `leads` UPDATE grant from table-wide to the three triage
  columns — sound today because the policy requires `is_staff()`, but the same
  shape as the 020 hole and one policy edit from mattering.
- **Admin inbox** — `/admin/inbox`, migration 019. **Contact-form and
  founders-deck submissions reached nobody.** Three compounding failures, found
  when a friend's test submission never surfaced: no admin email was ever
  written for either path (only `submitReportRequest` had one); that email
  wouldn't have sent anyway because `RESEND_API_KEY` is unset and every send is
  logged as `skipped`; and **no admin screen displayed `leads` at all** — zero
  references in `app/admin`, because `schema.sql` gave the table an insert-only
  policy and nobody wrote the service-role read path. A real inquiry sat in
  Postgres with no route to a human and nothing failing loudly.
  The fix is **in-app first, email second**: a count on every admin page load
  and a badge on the Inbox tab. **Deliberately not realtime** — one person
  checking a few times a day learns about an inquiry the moment they open any
  admin screen, and a socket is a failure surface to maintain for the privilege
  of knowing eleven seconds sooner. Requests are counted once, never twice, or
  the badge trains you to distrust it.
  019 adds `handled_at` / `handled_by` / `handled_note` — **one timestamp, not
  a status enum**: the only question worth asking of a lead is whether someone
  answered it, and `companies.stage` already exists for anything that becomes
  real. It also adds the staff select/update policies that were the actual
  reason no admin view existed. anon stays insert-only.
- **Privacy policy** — `/privacy`, and the **three tables shipped without IP
  columns are no longer waiting on it**. Written against what the system
  actually does rather than a template: every "we don't collect" is enforced in
  the schema, so if `deck_events` / `site_events` / `report_events` ever gain an
  IP column, this page changes in the same commit. **Not counsel-reviewed** —
  it's an accurate description of behaviour, which is what a lawyer needs in
  order to make it binding, not a substitute for that.
  The load-bearing commitment: no specific company's data is disclosed, named
  or referenced in external material that isn't for that company; aggregate
  research and benchmarking is explicitly permitted.
- **Optional portfolio detail on the intake.** Funding, states, covered lives
  by tier, program categories (checkboxes, so records are comparable), vendors
  and carrier — collapsed, never blocking, framed as what it buys *them*: a
  score of their actual portfolio rather than their sector's average. Feeds
  `clientAskBlock` marked authoritative.
  **Census is deliberately absent, and should stay absent.** Naming it on a
  form invites a file containing names and dates of birth — precisely the data
  the intake exists never to receive, with no BAA and no obligation to have
  one. Counts by tier give the analytical value without the liability, and the
  form says so where someone might otherwise attach one.
  Gating the free report on any of this was considered and rejected: a
  benchmark needs density before a record is worth much, and four required
  fields buys depth you can't yet use at the cost of volume you need now.
- **Send a report to anyone** (migration 018, `report_recipients`). A report
  could only reach whoever submitted the request, and admin-initiated research
  had nobody to notify at all — it sat in the company folder waiting for
  someone from that company to happen to sign up. Two modes, chosen per send:
  **invite** creates the auth user and links the company, so RLS does the
  authorisation and views are attributable; **link** mints an HMAC-signed
  expiring URL, zero friction, readable by anyone holding it.
  `lib/reportLinks.ts` is separate from `deckLinks.ts` on purpose — rotating
  the deck secret because a deck leaked must not lock every client out of their
  report. **The report id is inside the signature**, which `deckLinks` had no
  need for: there is one deck, but a report link that didn't bind the id would
  open every other employer's analysis by editing the URL.
  On the link path `/reports/[id]` asserts `status = 'ready'` in the query,
  because with no session there is no RLS doing it — omitting that would make
  every draft readable to anyone with any valid link. `sendReportTo` is gated
  by `requireRelease()`, not `requireStaff()`: it puts a named employer's
  analysis in front of an outsider, which is releasing with extra steps.
  `company_id` is nullable — a broker has no company record and shouldn't need
  a junk one invented to receive a report. **Deleting a recipient row revokes
  nothing**; revoking a link means rotating `REPORT_LINK_SECRET`.
- **One comment box per revision target, not per section.** The findings
  section renders **three** separately editable blocks — the opening summary,
  the findings list, and the "Where to start" recommendation — and they shared
  a single slot at the foot of the section. So a comment written directly under
  "Where to start" rewrote the findings list several paragraphs above: the
  revision worked, reported itself honestly, and looked like it had silently
  failed. `slots` is now keyed by target (`SectionId | "summary" |
  "topOpportunity"`) and each block carries its own box. `topOpportunity` is a
  `RevisableSection` for the first time — it was rendered prominently and had
  no revision path at all.
- **Revisions show a diff, not a description.** `revisions[target].previous`
  keeps the replaced text, rendered struck above the new text. A prose note can
  be perfectly accurate while pointing at the wrong paragraph, which is exactly
  how the bug above stayed invisible. The note also rendered twice — once from
  the overlay, once from the fresh response — and now renders once.
  `revertRevision()` restores `previous` and clears the record: `content` keeps
  the model's original, but an iterated revision's intermediate state lived
  nowhere, so a second regeneration silently destroyed the first.
- **`DocumentFlow`** on the report page. Researched → Reviewed → Released, with
  blockers and the release control inline. **The report page previously had no
  forward action at all** — release lives on the request page in another
  component, so the flow was severed exactly where a person spends the most
  time, and Print was the only button pointing anywhere. Mark-reviewed and the
  blocker list moved here from `ReportReview`: they're stages of a document's
  life, not editing controls, and two copies on one screen meant two sources of
  truth for "is this ready". An analyst without release sees a sentence, not a
  disabled button — a control you can never use reads as broken rather than as
  someone else's job.
- **Queue lifecycle made legible.** Graduating a report was unintuitive for a
  structural reason: **two status machines**, and the button that looked like
  the finish line wasn't. `report_requests.status` ran
  `new → in_review → ready → sent → archived` while `reports.status` ran its own
  `pending → in_review → ready`. The picker offered `ready` — meaning "ready
  *to be* released" — sitting next to a **Release** button that did the actual
  graduating, and the real terminal state `sent` was **not in the picker at
  all** because only `releaseReport()` can set it.
  Now: `ready` is gone from the picker (readiness is computed by
  `releaseBlockers()`, and a button asserting a derivable state is a button
  that can lie); Release is the single graduation control with its **blockers
  listed inline** — they were computed on that page and never shown, so a held
  release gave no reason; and release names its destination, linking the
  company hub, because the hand-off out of the queue was real and completely
  invisible.
  Three states you set — New · In review · Archived — and two the system sets:
  Researching (derived) and Released. `sent` renders as "Released" throughout.
  **Archive is a row action** on the queue (`ArchiveControl`), two-step because
  it sits on a row you might be clicking to open. **No delete**, deliberately:
  archive already clears every working view, and a "really gone" lifecycle
  would be a third state machine for the sake of rows nobody looks at.
  Released and Archived filters exist but sit outside the default open view —
  and **an explicit terminal status now overrides that view**, or selecting
  Archived would return nothing and read as broken rather than empty. The
  `Ready` filter only renders while legacy rows still hold it.
- **Identity confirmation gate** (migrations 016 **and 017** — two files
  because `alter type ... add value` can't be used in the transaction that adds
  it, and the Supabase editor wraps a submission in one transaction; 016 adds
  the enum value, 017 rebuilds the one-active-job index that needs it). The job now stops after wave
  1 with status `awaiting_confirmation` until a person ratifies or corrects the
  company identity. A live run analysed **WIN — a fertility and family-building
  vendor — as a behavioral health employer**: wrong at call two, faithfully
  inherited by the other eight, internally consistent about a fiction.
  Commenting couldn't fix it, because the revise agent edits wording and this
  was a premise.
  The gate lives in **`runner.ts`, not the panel** — the advance endpoint, a
  retry and any future caller all pass through the runner; a check in the UI
  would guard only the path someone happened to be looking at. `claimJob`
  already refuses anything outside queued/paused, so a poll at the gate costs
  nothing. Corrections write to `steps.validate.output` (what downstream reads)
  with the model's original kept in `steps.validate.modelOutput` — same
  principle as `reports.content` vs `reports.edits`: a correction must never
  erase what it corrected.
  The dry-run store's `create()` **pre-confirms unless `{ gated: true }`** —
  otherwise every other check would park waiting for a human who doesn't exist
  in a script. The gate has its own checks.
- **Intake industry list rebuilt, and a workforce question added.** Two live
  bugs in `getSegmentsForIndustry`, both from raw-substring matching against a
  five-option list. **"Retail & Hospitality" matched `"hospital"`** and returned
  the full clinical mix led by Senior Clinical / Licensed Professionals — a
  restaurant group analysed as though it employed surgeons, which is the
  "analysed one workforce and prescribed for another" failure the PDF review
  already caught once. And **"Professional Services" matched nothing** and fell
  through to the default, byte-identical to "Other", while "Consulting" — which
  the form couldn't produce — matched correctly.
  Matching is now on word boundaries (`manufact*` for an explicit prefix), the
  consumer branch is ordered ahead of the clinical ones so any future collision
  fails toward frontline rather than toward surgeons, and the intake offers 22
  grouped options covering all the branches. The old list could reach four of
  nine — the data spine was already far richer than the question being asked.
  A `role_groups` free-text field now feeds `clientAskBlock` marked
  authoritative over the industry label: industry only ever yields a *default*
  segment mix, and two professional services firms of the same size can be 90%
  consultants or 60% back office. Optional, because it's the field most likely
  to make someone abandon a form they're filling in to get something free.
  Nonprofit has no branch on purpose — its mix really is the default, and a
  branch returning the default array is dead code that reads as coverage. The
  dry run asserts that, and that every intake option resolves deliberately.
- **Score overrides carry a reason** (`edits.scoreNotes`, keyed by axis).
  `saveReportEdits` refuses any changed score without one — server-side, since
  a form check is bypassed by any other call path. `by` and `at` are stamped
  from the session; a client-supplied `by` is a claim, not a fact. Notes for
  scores that revert to the model's are dropped rather than left orphaned.
  **Scores only, not prose** — you can read what changed in a paragraph, but
  not why a number moved, and it's the number that drives the headline. The
  box appears only once a score actually differs: always-visible on eight axes
  reads as eight chores. This is v1 of `docs/PAID_REVIEW_DESIGN.md`, turned on
  for free reports deliberately, so the ledger accumulates and the habit forms
  before a paying client is waiting.
- **Email delivery is tracked** (migration 033). `email_log` recorded that a
  send was *attempted* and nothing ever updated the row again, so a 200 from
  Resend — which means "accepted for delivery" — was written down as though it
  meant the client had it. That mattered most at the release email: the queue
  moves on, and a bounce looked identical to a client who hadn't opened their
  report yet.
  `/api/webhooks/resend` writes raw events to `email_events`; a trigger rolls
  them up into `email_log`. **Status only moves forward, by rank** — webhooks
  arrive out of order routinely and a late `sent` overwriting `delivered` would
  make the column untrustworthy in the one direction that matters.
  `complained` outranks everything. Opens and clicks are timestamps and counts,
  not statuses: an opened email is still delivered, and folding engagement into
  `status` would let an open mask a later bounce.
  Signature verification is **hand-rolled against the Svix scheme rather than
  the `svix` package** — one HMAC, Web Crypto is already in the runtime, and
  the stack is deliberately thin. Cross-checked against the real library:
  valid signatures pass, tampered bodies, wrong secrets and stale timestamps
  fail, and a rotation header carrying two signatures passes on either.
  Replay safety is `email_events.svix_id unique`, not a unique index on
  `provider_id` — 033 runs against a live table and an index that fails on
  legacy data takes the migration down with it.
  **No IP column**, consistent with 012, 014, 015, 018 and 019. Resend sends a
  click's IP and user agent; `payload` is stored whole, so making that true of
  this table too means stripping it on the way in.
- **`/admin/email`** — the same gap `/admin/inbox` closed for `leads`, still
  live for `email_log`: a table the product wrote to since migration 002 that
  no screen ever displayed, readable only from the SQL editor. Trouble first,
  then everything; skipped sends hidden by default behind an All toggle, since
  every send is skipped until the API key exists. Each row says what its status
  *means* rather than just naming it — `sent` and `delivered` are not the same
  claim and the difference is the whole point of 033.
- **Objective weighting** — `lib/objectives.ts`, rendered on `/platform` and in
  the deck. Axionia scores the evidence, never the objective; weights reorder
  recommendations and must never be allowed to put a dollar figure on a soft
  outcome, which `/methodology` publicly commits to not doing.

### Not built

- **Resend is still unconfigured.** `RESEND_API_KEY` is absent, so every
  transactional send — including the release email — is skipped and written to
  `email_log` with `status = 'skipped'`. The workflow works; no mail leaves the
  building. **This is the next piece**, and it is now config only — the code
  side is done (below). See `docs/EMAIL-SETUP.md`, and note the ordering there:
  **Turnstile first.** Pointing a fresh sending domain at the signup traffic
  that was creating unconfirmed accounts is how a new domain lands on a
  blocklist.
- **Discovery follow-up email.** Designed, not built. It needs a send path — a
  server action plus a control on the company hub — and it is deliberately not
  automatable: the template requires a personal note and a named next step, and
  a follow-up that could have been sent to anyone gets read that way.
- **Paid-engagement human review, v2 and v3.** See
  `docs/PAID_REVIEW_DESIGN.md`. v1 is built (below). v2 — the six adjustments
  as ratifiable parameters — **waits for engagement one**: the framework is
  right but the granularity (per claim? per vendor? per program?) is decided by
  what a real renewal packet contains. Keep a running note during that
  engagement of every judgment call and which factor it mapped to; that note is
  the spec. v3 — scoped reviewers — waits on v1 and v2 being in use.
- Client-side signed download for legacy file-only reports. `/reports/[id]`
  detects `content: null` and says the report was delivered as a document
  rather than rendering an empty one. Few enough of those exist that replying
  beats building the path.
- Paid tier: artifact ingestion, entitlement checks, module registry.

### Open, deliberately

- **Revision reaches less of the report than it looks like it does.** Found
  while diagnosing the WIN run. Three separate gaps:
  1. **`summary` has no comment box.** `RevisableSection` includes it and the
     revise agent handles it, but `REVISABLE` in `ReportReview.tsx` exposes only
     findings / profile / regulatory / brief. The summary is the paragraph a
     client reads first — and `assembleReport` derives it from
     `workforceData.overallInsight` — so commenting on findings rewrites
     findings while the text you were actually reading is untouched. The agent
     reports success honestly; the fix lands somewhere you aren't looking.
  2. **Workforce Intelligence and Benefit Design aren't revisable at all.** No
     comment box, no overlay path. A mischaracterisation in `workforceData`
     propagates into the summary, the workforce section and benefit design with
     no way to correct it short of a re-run.
  3. **A stale code comment** in `ReportReview.tsx` claims "the summary is
     edited through the findings section" — an intention nobody implemented.
  The identity gate prevents the common cause of all three. These are still
  worth closing, because not every wrong premise is visible at wave 1.

- **Staleness by DAG — the structural fix, not built.** When a fact is
  corrected after a run, everything with that step in its transitive
  `dependsOn` closure is stale. The plan already declares those edges and the
  runner is already resumable with a plan self-check, so this is mostly
  bookkeeping over machinery that exists. **Deterministic graph traversal, not
  a model call** — something deciding what to re-run is one more thing that can
  be confidently wrong. Decided behaviour: show which steps are stale with
  their model-call cost and let the analyst choose, rather than auto-re-running.
  The distinction underneath: *wording wrong* → revise agent; *fact wrong* →
  correct upstream and invalidate. Only the first exists today, which is why a
  factual error got handed an editorial tool.

- **Output is long-winded — regulatory section FIXED, rest unmeasured.** Two
  bugs, not one. The prompt asked for **federal overlay per state**, and ACA,
  ERISA, FMLA and MHPAEA are federal by definition, so the model wrote the same
  paragraph once per detected state. And every state got the full four-category
  treatment regardless of exposure. Now: one federal section asked once, a
  paragraph for the top states from `rankStatesByExposure()`, a line each for
  the rest, and the prompt is told a curated mandate table renders alongside it
  and not to restate statute names and dates a table carries better. `maxTokens`
  2500 → 1400; a ceiling that can't be reached isn't a limit, it's permission.
  **Ranked, not sliced** — taking the first three as detected would make section
  depth depend on the order the model happened to list states in. Uncovered
  states get no ranking bonus: promoting the least verifiable output would
  invert the point of having a curated library.
  Other sections have not been measured — check an exported PDF before assuming
  this closed the whole problem.
- **Mandate library covers 5 states** (CA IL MA MN NY, 13 mandates). Runs detect
  more; states outside the library are labelled model-generated and unverified.
  **Reviewed 2026-08-03 and deliberately left.** Expanding means per-state
  statutory research where `erisa` reach is the load-bearing field, and done
  quickly that's exactly how a plausible-looking fabricated row gets in.
  Suppressing uncovered states loses real signal — "you have staff in WA, there
  is a paid-leave program" is useful when labelled. The actual defect is the
  regulatory prompt enumerating everything for every detected state, which is
  the verbosity item above. Fixing coverage would not fix that.
- **Privacy policy exists but has not been through counsel.** `/privacy` is an
  honest description of current behaviour; it is not a lawyer's document. Get
  it reviewed before it's load-bearing in a contract conversation. The IP
  columns on `deck_events`, `site_events` and `report_events` are still absent
  by choice — the page now commits to that publicly, so adding one is a
  policy change, not just a migration. Same for reverse-IP company lookup
  (Clearbit Reveal, RB2B and similar).
- **`privacy@axionia.com` must exist.** `/privacy` publishes it as the address
  for access and deletion requests, and an unrouted mailbox on a privacy page
  is worse than no address.

---

## Invariants — don't break these

**A discarded query error renders as an empty state, and empty looks like data
loss.** `/admin/companies` destructured only `{ data }`. The moment it started
selecting `merged_into` against a database where 023 hadn't run, PostgREST
rejected the column, `data` came back null, and the page said "0 tracked" — so
a missing migration was indistinguishable from every company having vanished.
Both that page and `/admin/inbox` now read the error and say which migration is
missing. **Anywhere a query feeds an empty state, read the error.**

**Merging a duplicate means aliasing it, not deleting it.** Migration 023. One
employer arrived as three companies — `invidiacap.com`, `invidiacapital.com`,
`internal.invidia-capital.com` — because companies are created from an email
domain and a real business has several. **`domain` is the key every lookup
joins on**, so deleting the loser means the next email from that domain
recreates it and you merge the same company again next month. `merged_into`
turns it into an alias that keeps resolving, and
`resolveCompanyByDomain()` follows the pointer — **every caller that resolves a
company from an email must use it**, or work lands on a row that is no longer a
company. Single hop, enforced by resolving the target to its own head before
writing: a loop would hang every company lookup on the site.
`COMPANY_REFS` in `merge-actions.ts` lists the tables to move by hand —
**add to it when you add a `company_id` column**, because a missed table leaves
data on a non-company and nobody notices until a report fails to appear.
Also fixes `normaliseDomain()`: nothing stripped `www.`, so `www.x.com` and
`x.com` became two companies for one employer. Other subdomains are **not**
stripped — `internal.invidia-capital.com` may be a different tenant, and
guessing merges two employers' reports.

**A Server Component cannot read a plain export from a `"use client"` module.**
`/admin/companies` imported `STAGE_TONE` from `CrmPanel.tsx`. Next turns every
export of a client module into a client *reference*, so reading a property off
it during a server render throws and the page 500s. It hid for weeks because
the failure needs data — the empty-state branch never touched the map, so the
page worked until the first company existed. Moved to `lib/crm.ts`. **A value
shared across the boundary belongs in a plain module**; if both sides import
it, neither side gets to own it.

**RLS restricts rows. GRANTs restrict columns. You need both.** Found 2026-08-06
and fixed in migration 020. `schema.sql` granted table-wide UPDATE on
`profiles` to `authenticated` alongside a `using (auth.uid() = id)` policy —
which correctly scoped the *row* and not the *columns*, because RLS has no
column clause. Any signed-in user could set their own `role` to `'owner'` with
the public anon key and take the whole admin surface, or set their own
`company_id` to another employer's and read that employer's released reports
with no role change at all. Nothing in the app ever used the grant; every
profile write goes through the service role. **Before granting write on any
table, name the columns.**

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
| `NEXT_PUBLIC_REPLY_FROM` | `tom@axionia.com`. Makes the inbox Reply button open Gmail compose as that identity. Unset, it falls back to `mailto:`, which has no From parameter and so uses whatever the OS default account is. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public by design — ships in the page. **Set this in the same deploy as Supabase's captcha setting.** The widget renders nothing without it, so enabling Supabase first takes signup down. |
| `REPORT_LINK_SECRET` | Signs report share links. Falls back to `DECK_LINK_SECRET` if unset, but **set it separately** — otherwise rotating one to kill a leaked deck also locks every client out of their report. |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | |

Supabase project ref: `vzybdifqwvrlheuyzcui`

Keep `DATABASE_URL` **Production-only**. Preview deploys share the same
database, so a branch could otherwise write test runs into the benchmark.

### Migrations applied

`schema.sql`, then `002`–`033`, plus `supabase/research_schema.sql` for the
research schema. `010` added the report body, edit overlay and `client_view`;
`011` added staff roles and queue assignment. The health endpoint reports which
are missing.

**`011` promotes every existing `admin` to `owner`.** Correct only because there
was exactly one admin row when it was written. Check the table before applying
it anywhere else.

---

## Lessons worth keeping

**A swallowed error is worse than a loud one, and this one was invisible for
months.** `runScoring` caught the `LlmError` and dropped it — the comment said
"fall through to the fallback set below" — then returned normally. So the step
was `done`, `steps.scoring.error` was unset, `last_error` was null, nothing
logged, and a report could say "estimated defaults were substituted" with no
recoverable cause anywhere. Worse, the **more likely** failure raised nothing at
all: the model can return parseable JSON that is simply missing axes, which
just fails the completeness check silently. `_fallbackReason` now records both,
travelling with `reports.content` so the reason outlives the run, and names the
missing axes rather than saying "incomplete". Any `catch` that discards `e`
deserves the same suspicion.

**A new enum value can't be used in the migration that adds it.** 016 added
`awaiting_confirmation` and then built an index referencing it, in one file.
The Supabase editor runs a submission as one transaction, so it failed with
`55P04: unsafe use of new value`. The constraint was even noted in that file's
header and the index was put there anyway — knowing the rule isn't the same as
structuring for it. Any future enum addition gets two migration files: add the
value, then use it.

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

**Never declare a component inside another component's body.** `CommentBox`
lived inside `ReportReview`, so it got a new function identity on every render.
React saw a different component *type* each time, unmounted the subtree and
mounted a fresh one — which meant the textarea was destroyed and recreated on
every keystroke. You could type exactly one character before losing focus,
because the element you were typing into no longer existed. It looked like an
input bug and was a component-identity bug. Hoist to module scope and pass
state as props; closing over parent state is what makes nesting tempting.

**Exported PDFs found real bugs.** The summary was findings[0] verbatim; Benefit
Design repeated one template string; the report analysed one workforce and
prescribed for another. None was visible from the admin form. Export and read
the actual output.
