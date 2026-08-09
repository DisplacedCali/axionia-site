-- ============================================================
-- Axionia — migration 024: firms above companies
--
-- 023 merged three Invidia domains into one company. That was the
-- right fix for the problem in front of it and the wrong shape for
-- the problem underneath it: Invidia Capital is not an employer we
-- happened to record three times. It is a firm, and the employers
-- worth analysing are the ones it invests in.
--
-- Every lookup on this site resolves a company from an email
-- domain and then treats that row as an employer with a benefit
-- stack. For a portfolio firm that is the wrong entity. Callie at
-- valtruis.com resolves to Valtruis-the-employer — about thirty
-- people in Chicago — and the pipeline would faithfully analyse
-- their thirty-person stack. Not merely unhelpful: it tells the
-- reader the product does not understand their job.
--
-- Four decisions.
--
-- 1. A FIRM IS NOT A COMPANY ROW. The obvious cheap version is
--    companies.parent_id. It fails because the rest of the schema
--    reads `companies` as "an employer with a benefit stack", and
--    a firm has one of those too. Every portfolio query would then
--    carry an unwritten rule to exclude the parent, and unwritten
--    rules get forgotten exactly once.
--
-- 2. `kind` IS LOAD-BEARING, NOT A LABEL. An investor portfolio
--    and an operator rollup are the same shape and different
--    products. Valtruis influences seventeen separate legal
--    buyers and signs for none of them. A PE-backed roofing
--    rollup IS the buyer across every entity it has acquired, and
--    for it consolidating the stack is the entire value. Encoding
--    the difference means an aggregation can decline to recommend
--    consolidation to a firm with no authority to consolidate —
--    which is the sort of recommendation that ends a relationship.
--
-- 3. AN ALIAS MAY NOT CARRY A FIRM. 023 made merged rows into
--    pointers, and `firm_id` must always be read from the
--    survivor. Rather than leave that as a convention every future
--    reader has to know, the constraint refuses the state
--    outright. A merge that would orphan a firm_id now fails
--    loudly instead of silently detaching a portfolio company.
--
-- 4. `firms.domain` IS THE FIRM'S OWN DOMAIN. It exists so an
--    inbound from valtruis.com resolves to the firm rather than
--    to a portfolio company, which is what lets the intake form
--    ask the one question that matters before running anything.
--    Nullable: a firm we know about through a portfolio company
--    may never have emailed us.
--
-- Run AFTER 023. Safe to re-run.
-- ============================================================

create table if not exists public.firms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,

  -- 'investor' — influences many buyers, signs for none
  -- 'operator' — is the buyer across many entities
  kind        text not null default 'investor'
              check (kind in ('investor', 'operator')),

  -- the firm's own email domain, if we've seen it. Not the
  -- portfolio's domains — those live on companies.
  domain      text unique,

  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists firms_kind_idx on public.firms(kind);


alter table public.companies
  add column if not exists firm_id uuid references public.firms(id) on delete set null;

create index if not exists companies_firm_id_idx
  on public.companies(firm_id)
  where firm_id is not null;


-- Decision 3, enforced rather than remembered.
do $$ begin
  alter table public.companies
    add constraint companies_alias_has_no_firm
    check (merged_into is null or firm_id is null);
exception when duplicate_object then null; end $$;


-- ────────────────────────────────────────────────────────────
-- RLS
--
-- `firms` is admin-only and carries no client-readable data, so
-- it gets RLS enabled with no permissive policy — the service
-- role bypasses RLS and nothing else can read it. That is the
-- same posture as the research schema: the only way in is
-- server-side code holding the connection.
--
-- Deliberately NOT extending companies_select_own to expose a
-- firm to its portfolio companies. A portfolio company knowing
-- which firm we have filed it under is a disclosure decision,
-- not a schema decision, and it should be made on purpose later
-- rather than inherited from this migration.
-- ────────────────────────────────────────────────────────────
alter table public.firms enable row level security;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'firms table exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'firms') as ok
union all
select 'companies.firm_id exists',
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'companies'
                  and column_name = 'firm_id')
union all
select 'kind is constrained to investor/operator',
       exists (select 1 from pg_constraint
                where conname like '%firms_kind_check%')
union all
select 'an alias cannot carry a firm',
       exists (select 1 from pg_constraint
                where conname = 'companies_alias_has_no_firm')
union all
select 'rls is on for firms',
       exists (select 1 from pg_tables
                where schemaname = 'public' and tablename = 'firms'
                  and rowsecurity)
union all
select 'no alias currently carries a firm',
       not exists (select 1 from public.companies
                    where merged_into is not null and firm_id is not null);
