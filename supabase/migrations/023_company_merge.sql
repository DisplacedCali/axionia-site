-- ============================================================
-- Axionia — migration 023: merging duplicate companies
--
-- One employer arrived as three rows: invidiacap.com,
-- invidiacapital.com and internal.invidia-capital.com. Companies
-- are created from an email domain, and a real business has more
-- than one.
--
-- THE POINT IS NOT TO DELETE THE DUPLICATE.
--
-- `domain` is the key every lookup joins on — a report request, a
-- contact submission and a lead promotion all resolve a company
-- by the requester's domain. Delete the losing row and the next
-- email from internal.invidia-capital.com simply recreates it,
-- and you merge the same company again next month.
--
-- So a merge makes the losing row an ALIAS: it keeps its domain,
-- gains `merged_into`, and every lookup follows the pointer. The
-- duplicate stops being a company and starts being one of the
-- several domains that company uses.
--
-- Single-hop by design. `mergeCompanies` resolves the target to
-- its own head before writing, so a chain can never form and no
-- reader has to walk one — a loop here would hang every lookup on
-- the site.
--
-- Run AFTER 022. Safe to re-run.
-- ============================================================

alter table public.companies
  add column if not exists merged_into uuid references public.companies(id) on delete set null,
  add column if not exists merged_at timestamptz,
  add column if not exists merged_by uuid references auth.users(id) on delete set null;

-- A row cannot be its own alias.
alter table public.companies
  drop constraint if exists companies_merge_not_self;
alter table public.companies
  add constraint companies_merge_not_self check (merged_into is null or merged_into <> id);

-- The working list is "companies that are still companies".
create index if not exists companies_active_idx
  on public.companies(created_at desc)
  where merged_into is null;

create index if not exists companies_merged_into_idx
  on public.companies(merged_into)
  where merged_into is not null;


-- ────────────────────────────────────────────────────────────
-- Client-facing reads must not follow a merged row.
--
-- `companies_select_own` matches on the reader's profiles.company_id,
-- and the merge moves every profile to the survivor — so a client
-- never holds a merged id. Left as-is deliberately; narrowing it
-- would break nothing today and hide that fact.
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'companies.merged_into exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='companies'
                  and column_name='merged_into') as ok
union all
select 'self-merge is rejected',
       exists (select 1 from pg_constraint
                where conname = 'companies_merge_not_self')
union all
select 'active index present',
       exists (select 1 from pg_indexes
                where schemaname='public' and indexname='companies_active_idx')
union all
select 'no chains exist yet',
       not exists (
         select 1 from public.companies a
           join public.companies b on a.merged_into = b.id
          where b.merged_into is not null
       );
