-- ============================================================
-- Axionia — migration 025: people you've met, and what's next
--
-- The company hub listed contacts by reading `profiles` where
-- company_id matched. `profiles` is auth-bound: a row exists
-- because somebody signed up. So the only contacts the product
-- could hold were the ones who had already created an account —
-- which excludes almost everyone who matters early. The two
-- people in a first meeting are exactly the two people who will
-- never sign up for anything, and there was nowhere to put them.
--
-- Four decisions.
--
-- 1. A NEW TABLE, NOT LOOSER PROFILES. The cheaper edit is to
--    allow a profile with no auth user. It is also the most
--    dangerous edit available in this schema: profiles.id is the
--    join every RLS policy on the site reads, and a row that
--    looks like a user but cannot authenticate is a hole waiting
--    for someone to widen. Contacts are a different thing and
--    get their own table.
--
-- 2. `profile_id` LINKS, IT DOESN'T REPLACE. When a contact
--    later signs up, the contact row stays and points at the new
--    profile. The alternative — delete the contact, keep the
--    profile — throws away how you met them, their title and
--    every note you took, at the exact moment the relationship
--    became real. Nullable, and set by hand.
--
-- 3. STEPS RECORD `done_at`, NOT `done`. A boolean answers
--    whether it happened. A timestamp answers when, which is the
--    question you actually have when you're reconstructing an
--    account before a second meeting. Open is `done_at is null`.
--
-- 4. COMPANY-SCOPED, NOT FIRM-SCOPED. Contacts hang off a
--    company even when the person belongs to a firm — Valtruis
--    exists as a company row in its own right (it has a domain
--    and people email from it), so there is somewhere correct to
--    put Callie and Dave today. Firm-level contacts are a real
--    question and a later one; making the wrong call now would
--    put the same person in two places.
--
-- NOTE FOR WHOEVER MERGES COMPANIES NEXT: both tables carry
-- company_id, so both are registered in COMPANY_REFS in
-- app/admin/companies/merge-actions.ts. A merge that misses one
-- leaves rows attached to a row that is no longer a company.
--
-- Run AFTER 024. Safe to re-run.
-- ============================================================

create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,

  name        text not null,
  title       text,
  email       text,

  -- how you came to know them. Free text on purpose: "Anay's wife",
  -- "met at the CXO summit" and "inbound" are all the real answer
  -- sometimes, and a dropdown would only capture the dullest of them.
  source      text,
  notes       text,

  -- set if and when this person creates an account. See decision 2.
  profile_id  uuid references public.profiles(id) on delete set null,

  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);

create index if not exists contacts_company_id_idx on public.contacts(company_id);
create index if not exists contacts_profile_id_idx
  on public.contacts(profile_id) where profile_id is not null;


create table if not exists public.company_steps (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,

  step        text not null,
  due_on      date,

  -- null means open. See decision 3.
  done_at     timestamptz,

  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);

-- The list view reads open steps ordered by due date, so index the
-- open ones rather than all of them — closed steps are history and
-- are never the thing being scanned.
create index if not exists company_steps_open_idx
  on public.company_steps(company_id, due_on)
  where done_at is null;


-- ────────────────────────────────────────────────────────────
-- RLS
--
-- Both tables are staff-only and carry no client-readable data,
-- so RLS is enabled with no permissive policy: the service role
-- bypasses it and nothing else reaches them. Same posture as
-- `firms` in 024.
--
-- Contacts in particular must NOT become client-readable by
-- accident. `source` and `notes` are where an internal read on a
-- person goes, and that is not a field anyone should discover
-- written about themselves.
-- ────────────────────────────────────────────────────────────
alter table public.contacts enable row level security;
alter table public.company_steps enable row level security;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'contacts table exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'contacts') as ok
union all
select 'company_steps table exists',
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'company_steps')
union all
select 'a contact can exist without a profile',
       (select is_nullable = 'YES' from information_schema.columns
         where table_schema = 'public' and table_name = 'contacts'
           and column_name = 'profile_id')
union all
select 'steps use done_at, not a boolean',
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'company_steps'
                  and column_name = 'done_at' and data_type like 'timestamp%')
union all
select 'rls on for both',
       (select count(*) = 2 from pg_tables
         where schemaname = 'public'
           and tablename in ('contacts', 'company_steps')
           and rowsecurity)
union all
select 'open-step index present',
       exists (select 1 from pg_indexes
                where schemaname = 'public' and indexname = 'company_steps_open_idx');
