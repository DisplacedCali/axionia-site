-- ============================================================
-- Axionia — migration 037: which employer, which firm
--
-- 036 made the deck log say how far somebody got. It still could
-- not say who they worked for, which is the question behind
-- "who is opening the investor deck" — a name is a person, and
-- the thing being decided is whether a FIRM is interested.
--
-- ── WHY THERE IS STILL NO IP COLUMN, EVEN NOW ──
--
-- The obvious way to answer this is to store the address and
-- look it up. Two reasons that is not what happens here.
--
-- First, it answers the wrong question badly. An IP is a poor
-- count of distinct people in both directions at once: a firm
-- behind one NAT egress collapses twelve readers into one, and
-- carrier-grade NAT or a dynamic residential lease splits one
-- reader across several addresses in an afternoon. The case it
-- collapses — several people at one firm passing a deck around —
-- is precisely the signal worth having. `session_id` from 036 is
-- a better count of people for a link that was shared, because
-- five forwarded opens are five sessions.
--
-- Second, an IP is personal data under GDPR (Breyer, C-582/14)
-- and personal information under CPRA wherever it is reasonably
-- linkable, and /privacy currently publishes that these tables
-- have no column for one. That commitment is why the column is
-- still absent here.
--
-- So attribution is resolved and only the RESULT is stored. Same
-- shape as geography in 014: Vercel resolves at the edge, the
-- city is kept, the address is never written down.
--
-- ── FOUR SOURCES, IN DESCENDING ORDER OF TRUST ──
--
-- 'link'    — the share link was minted against a company or
--             firm row and the id is inside the HMAC. Not an
--             inference: you chose the recipient. Exact.
-- 'session' — this session already resolved to a company in
--             site_events, because they submitted a form. The
--             014 stitch, reaching the one table that stood
--             outside it until 036 added session_id.
-- 'email'   — the address given at the download gate resolves by
--             domain. Self-reported and unverified until they
--             click the emailed link.
-- 'ip'      — an organisation resolved from the request address
--             by a third party, address discarded. Dark unless
--             IP_ORG_LOOKUP is set; see lib/deckOrg.ts, and do
--             not turn it on before /privacy has been amended
--             and reviewed.
--
-- `attribution` records WHICH of those produced the row, because
-- an exact match and a 30%-accurate guess must not read the same
-- on the admin page. A number you cannot qualify is a number you
-- will eventually over-trust.
--
-- ── THE BACKFILL DOES NOT RUN ──
--
-- Existing rows carry labels somebody typed: "Invidia", "Invidia
-- Capital", "callie/invidia". Matching those to firms is fuzzy,
-- and a fuzzy match written into an attribution column is
-- invisible the moment it lands — nobody re-examines a company
-- name that is already sitting there. So this migration creates
-- a PROPOSALS view and applies nothing. Read it, then run the
-- apply statement at the bottom for the matches you accept.
--
-- Run AFTER 036. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. COLUMNS
-- ────────────────────────────────────────────────────────────
alter table public.deck_events
  add column if not exists company_id  uuid references public.companies(id) on delete set null,
  add column if not exists firm_id     uuid references public.firms(id)     on delete set null,
  add column if not exists attribution text,

  -- What a third-party lookup said, kept verbatim and separately
  -- from company_id. The two are not the same claim: "Invidia
  -- Capital LLC" is what a vendor returned, and company_id is a
  -- row in our schema. Collapsing them would let a vendor's
  -- string silently become our record of who a company is.
  add column if not exists org_name    text,
  add column if not exists org_domain  text,
  add column if not exists org_asn     text;

do $$ begin
  alter table public.deck_events
    add constraint deck_events_attribution_check
    check (attribution is null
           or attribution in ('link', 'session', 'email', 'ip'));
exception when duplicate_object then null; end $$;


-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
--
-- Partial on purpose. Most rows will never resolve to anything —
-- the buyer deck is a public URL — and an index over a mostly
-- null column is a scan wearing a hat.
-- ────────────────────────────────────────────────────────────
create index if not exists deck_events_company_idx
  on public.deck_events(company_id, created_at desc)
  where company_id is not null;

create index if not exists deck_events_firm_idx
  on public.deck_events(firm_id, created_at desc)
  where firm_id is not null;


-- ────────────────────────────────────────────────────────────
-- 3. PROPOSALS — READ THIS, IT CHANGES NOTHING
--
-- Three rules, weakest last, each labelled with what it actually
-- knows. `domain` is exact and the other two are string matches
-- against a field a human typed into a form at speed.
--
-- Deliberately NOT deduplicated to one row per event: two rules
-- firing on one event with different answers is the interesting
-- case, and collapsing it would hide the disagreement that tells
-- you the label was ambiguous.
-- ────────────────────────────────────────────────────────────
create or replace view public.deck_attribution_proposals as

-- Exact: the address they gave resolves to a company we have.
select e.id            as event_id,
       e.deck,
       e.created_at,
       e.contact_email,
       e.link_label,
       'company'::text as target_kind,
       c.id            as target_id,
       c.name          as target_name,
       'high'::text    as confidence,
       'email domain matches companies.domain'::text as basis
  from public.deck_events e
  join public.companies c
    on c.domain = lower(split_part(e.contact_email, '@', 2))
 where e.contact_email is not null
   and e.company_id is null
   and c.merged_into is null

union all

-- Firm name typed into the label, whole and case-insensitive.
select e.id, e.deck, e.created_at, e.contact_email, e.link_label,
       'firm', f.id, f.name, 'medium',
       'link_label equals firms.name'
  from public.deck_events e
  join public.firms f
    on lower(f.name) = lower(btrim(e.link_label))
 where e.link_label is not null
   and e.firm_id is null

union all

-- Firm name appearing somewhere in the label — "Callie · Invidia
-- Capital". Weakest rule here, and the one most likely to be
-- wrong on a short firm name that is also an ordinary word.
select e.id, e.deck, e.created_at, e.contact_email, e.link_label,
       'firm', f.id, f.name, 'low',
       'link_label contains firms.name'
  from public.deck_events e
  join public.firms f
    on lower(e.link_label) like '%' || lower(f.name) || '%'
   and lower(btrim(e.link_label)) <> lower(f.name)
 where e.link_label is not null
   and e.firm_id is null
   and length(f.name) >= 5;

grant select on public.deck_attribution_proposals to service_role;


-- ────────────────────────────────────────────────────────────
-- 4. APPLYING IT — RUN SEPARATELY, AFTER READING
--
--   select * from public.deck_attribution_proposals
--    order by confidence, target_name;
--
-- Then, for the ones you accept — high confidence only, as
-- written; widen the filter deliberately rather than by habit:
--
--   update public.deck_events e
--      set company_id  = p.target_id,
--          attribution = 'email'
--     from public.deck_attribution_proposals p
--    where p.event_id = e.id
--      and p.target_kind = 'company'
--      and p.confidence = 'high'
--      and e.company_id is null;
--
--   update public.deck_events e
--      set firm_id     = p.target_id,
--          attribution = coalesce(e.attribution, 'link')
--     from public.deck_attribution_proposals p
--    where p.event_id = e.id
--      and p.target_kind = 'firm'
--      and p.confidence = 'medium'
--      and e.firm_id is null;
--
-- Both are idempotent: the `is null` guards mean re-running
-- touches nothing already attributed.
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- 5. VERIFY
-- ────────────────────────────────────────────────────────────
select 'attribution columns exist' as check,
       (select count(*) = 6 from information_schema.columns
         where table_schema = 'public' and table_name = 'deck_events'
           and column_name in ('company_id','firm_id','attribution',
                               'org_name','org_domain','org_asn'))::text as ok
union all
select 'proposals view exists',
       (exists (select 1 from information_schema.views
                 where table_schema = 'public'
                   and table_name = 'deck_attribution_proposals'))::text
union all
select 'proposals waiting to be reviewed',
       (select count(*)::text from public.deck_attribution_proposals)
union all
select 'nothing was applied',
       (select (count(*) = 0)::text from public.deck_events
         where company_id is not null or firm_id is not null)
union all
select 'STILL no ip column (intentional)',
       (not exists (select 1 from information_schema.columns
                     where table_schema = 'public'
                       and table_name in ('deck_events','site_events','report_events')
                       and column_name in ('ip','ip_address')))::text;
