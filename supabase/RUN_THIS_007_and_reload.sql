-- ============================================================
-- Run this whole file. No branching, no diagnosis needed.
--
-- Applies migration 007 idempotently (harmless if already done)
-- and forces PostgREST to re-read the schema. Fixes both possible
-- causes of "Could not find the 'origin' column of
-- 'report_requests' in the schema cache".
--
-- Ends with a verification block.
-- ============================================================

-- 1. reports need not belong to a user
alter table public.reports alter column user_id drop not null;

-- 2. requests need not have a contact
alter table public.report_requests alter column contact_email drop not null;

-- 3. the origin enum
do $$ begin
  create type public.request_origin as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

-- 4. the origin column
alter table public.report_requests
  add column if not exists origin public.request_origin not null default 'client';

create index if not exists report_requests_origin_idx
  on public.report_requests(origin);

-- 5. Make sure service_role can use the new column. Table-level
--    grants cover all columns, but 009 ran before this column
--    existed, so re-assert.
grant all privileges on public.report_requests to service_role;
grant all privileges on public.reports          to service_role;
grant all privileges on public.companies        to service_role;

-- 6. Force PostgREST to reload. The ALTERs above normally trigger
--    Supabase's own reload, but this makes it explicit.
notify pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────
-- VERIFY — every row must read true
-- ────────────────────────────────────────────────────────────
select 'report_requests.origin exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='report_requests'
                  and column_name='origin') as ok
union all
select 'report_requests.contact_email is nullable',
       (select is_nullable = 'YES' from information_schema.columns
         where table_schema='public' and table_name='report_requests'
           and column_name='contact_email')
union all
select 'reports.user_id is nullable',
       (select is_nullable = 'YES' from information_schema.columns
         where table_schema='public' and table_name='reports'
           and column_name='user_id')
union all
select 'request_origin enum exists',
       exists (select 1 from pg_type where typname='request_origin')
union all
select 'service_role can insert report_requests',
       has_table_privilege('service_role','public.report_requests','INSERT');
