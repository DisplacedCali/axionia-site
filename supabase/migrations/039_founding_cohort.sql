-- ============================================================
-- Axionia — migration 039: founding cohort terms
--
-- The first 5–10 paying relationships run free, then convert to a fee
-- priced against verified savings — same basis as /pricing ("a share of
-- the value we help you protect, agreed when you join and held for the
-- term"), not a share of spend. This migration adds nowhere to compute
-- that basis; it just gives the two facts a place to live once they're
-- agreed with a specific company: were they offered the founding terms,
-- and what rate did they lock in.
--
-- The conversion DATE is deliberately NOT a column here. It's one date
-- for the whole cohort, not one per company, so it lives as a constant in
-- lib/foundingCohort.ts — the same reasoning as company_stage being an
-- enum rather than a lookup table: a value with no per-row variation
-- doesn't need a row.
--
-- fee_rate is nullable on purpose. "founding_cohort = true, fee_rate =
-- null" is a real, distinct state — offered the terms, rate not agreed
-- yet — and collapsing it into a default would make "not decided" and
-- "decided at 0" the same row.
--
-- Run AFTER 038. Safe to re-run.
-- ============================================================

alter table public.companies
  add column if not exists founding_cohort boolean not null default false,
  add column if not exists fee_rate        numeric(5,4);

comment on column public.companies.founding_cohort is
  'Offered founding-cohort terms: free through the cohort conversion date '
  '(lib/foundingCohort.ts), then fee_rate. Cap and date are cohort-wide '
  'constants, not per-row — see that file, not this column, to change them.';

comment on column public.companies.fee_rate is
  'Locked-in fee as a fraction of verified savings (0.0075 = 0.75%), agreed '
  'at signing and held for the term per /pricing. NOT a percentage of spend. '
  'Null means not yet agreed, distinct from 0.';

-- A rate should only ever be set on a company actually offered the terms.
-- A constraint here catches the app writing one without the other, which
-- a form validation alone would only catch until someone edits via SQL.
alter table public.companies drop constraint if exists founding_cohort_rate_check;
alter table public.companies
  add constraint founding_cohort_rate_check
  check (fee_rate is null or founding_cohort);

-- Already granted to service_role as a table (migration 014); new columns
-- on an already-granted table need no re-grant.

-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'companies.founding_cohort exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='companies'
                  and column_name='founding_cohort') as ok
union all
select 'companies.fee_rate exists',
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='companies'
                  and column_name='fee_rate')
union all
select 'founding_cohort_rate_check installed',
       exists (select 1 from pg_constraint where conname='founding_cohort_rate_check');
