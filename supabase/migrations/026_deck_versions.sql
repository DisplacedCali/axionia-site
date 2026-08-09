-- ============================================================
-- Axionia — migration 026: a deck tailored to one company
--
-- The buyer deck is one artifact sent to everyone. What a meeting
-- actually wants is that deck with three or four lines that are
-- about them — and a record, afterwards, of which version went to
-- which people.
--
-- Five decisions.
--
-- 1. OVERRIDES, NEVER A COPY. A version stores a small patch, not
--    a duplicated deck. The canonical slides stay in code. Copying
--    the deck per company would mean every future edit either
--    misses the copies or has to be applied twenty times, and the
--    copies silently rot into last quarter's argument.
--
-- 2. `generated` IS IMMUTABLE, `edits` LAYERS OVER IT. Same split
--    as reports.content / reports.edits from 010, for the same
--    reason: you cannot review a model's output if editing it
--    destroys what it said. Keeping both means "what did the agent
--    claim" stays answerable after Tom has fixed it.
--
-- 3. DRAFT UNTIL APPROVED, AND THE URL ENFORCES IT. status starts
--    'draft'; /deck?v= serves approved versions only. The failure
--    this prevents is specific and bad — a generated sentence with
--    a wrong fact in it, projected in front of someone who knows
--    the industry cold. A plausible fabricated row is worse than
--    a missing one, and a deck is the worst place to find one.
--
-- 4. `source_report_id` IS THE LEASH. Generation reads a completed
--    report and nothing else — no web access, no fresh research at
--    deck time. Recording which report a version came from is what
--    makes a wrong line traceable to the run that produced it,
--    rather than to a prompt nobody kept.
--
-- 5. RECIPIENTS DENORMALISE THE NAME. A recipient row keeps the
--    name as text alongside the contact_id. Delete the contact and
--    the record of who you showed it to survives — losing that is
--    losing the only evidence the meeting happened.
--
-- deck_versions carries company_id and is registered in
-- COMPANY_REFS in app/admin/companies/merge-actions.ts.
--
-- Run AFTER 025. Safe to re-run.
-- ============================================================

create table if not exists public.deck_versions (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,

  deck              text not null default 'buyer'
                    check (deck in ('buyer', 'founders')),

  -- which entrance this version leads with. Mirrors the ?audience=
  -- layer on the marketing site; null means the neutral spine.
  audience          text check (audience in ('hr', 'cfo', 'broker')),

  label             text not null,

  -- exactly what the agent produced. Never updated after insert.
  generated         jsonb not null default '{}'::jsonb,
  -- Tom's corrections, layered over `generated` at render.
  edits             jsonb not null default '{}'::jsonb,

  status            text not null default 'draft'
                    check (status in ('draft', 'approved', 'retired')),

  -- the completed report this was derived from. See decision 4.
  source_report_id  uuid references public.reports(id) on delete set null,

  approved_at       timestamptz,
  approved_by       uuid references public.profiles(id) on delete set null,

  created_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id) on delete set null
);

create index if not exists deck_versions_company_idx
  on public.deck_versions(company_id, created_at desc);

create index if not exists deck_versions_approved_idx
  on public.deck_versions(id) where status = 'approved';


create table if not exists public.deck_version_recipients (
  id            uuid primary key default gen_random_uuid(),
  version_id    uuid not null references public.deck_versions(id) on delete cascade,

  contact_id    uuid references public.contacts(id) on delete set null,
  -- kept as text so the record outlives the contact. See decision 5.
  name          text not null,

  presented_at  timestamptz not null default now(),
  note          text
);

create index if not exists deck_version_recipients_version_idx
  on public.deck_version_recipients(version_id);


-- ────────────────────────────────────────────────────────────
-- RLS
--
-- Staff-only, no permissive policy — the service role bypasses it
-- and nothing else reaches these. Same posture as firms (024) and
-- contacts (025).
--
-- Note this means a version is served by a SERVER route that
-- checks `status = 'approved'` itself. The table being unreadable
-- to anon is what stops a draft leaking via the API even if
-- someone guesses an id.
-- ────────────────────────────────────────────────────────────
alter table public.deck_versions enable row level security;
alter table public.deck_version_recipients enable row level security;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'deck_versions exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema='public' and table_name='deck_versions') as ok
union all
select 'recipients exist',
       exists (select 1 from information_schema.tables
                where table_schema='public' and table_name='deck_version_recipients')
union all
select 'versions start as draft',
       (select column_default like '%draft%' from information_schema.columns
         where table_schema='public' and table_name='deck_versions'
           and column_name='status')
union all
select 'generated and edits are both present',
       (select count(*) = 2 from information_schema.columns
         where table_schema='public' and table_name='deck_versions'
           and column_name in ('generated','edits'))
union all
select 'a recipient name survives contact deletion',
       (select is_nullable = 'NO' from information_schema.columns
         where table_schema='public' and table_name='deck_version_recipients'
           and column_name='name')
union all
select 'rls on for both',
       (select count(*) = 2 from pg_tables
         where schemaname='public'
           and tablename in ('deck_versions','deck_version_recipients')
           and rowsecurity);
