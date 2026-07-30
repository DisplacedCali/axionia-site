-- ============================================================
-- "Could not find the 'origin' column of 'report_requests' in
-- the schema cache"
--
-- That wording is PostgREST's. It means PostgREST's cached view
-- of the schema doesn't include the column — which happens for
-- two different reasons:
--
--   1. The column genuinely doesn't exist (migration 007 never
--      ran), or
--   2. It exists, but PostgREST cached the schema before it was
--      added. Supabase usually reloads automatically on DDL, but
--      not always.
--
-- Query 1 tells you which. The rest fixes both.
-- Safe to run repeatedly.
-- ============================================================

-- 1. Does the column actually exist?
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='report_requests'
      and column_name='origin') = 1              as origin_exists,
  (select is_nullable from information_schema.columns
    where table_schema='public' and table_name='report_requests'
      and column_name='contact_email')           as contact_email_nullable,
  (select is_nullable from information_schema.columns
    where table_schema='public' and table_name='reports'
      and column_name='user_id')                 as reports_user_id_nullable,
  (select count(*) from pg_type where typname='request_origin') = 1
                                                 as request_origin_enum_exists;

-- Expected after migration 007:
--   origin_exists = true
--   contact_email_nullable = YES
--   reports_user_id_nullable = YES
--   request_origin_enum_exists = true
--
-- Any false/NO → run supabase/migrations/007_admin_initiated_research.sql,
-- then come back and run part 3 below.


-- 2. If origin_exists was TRUE, this is purely a stale cache.
--    NOTIFY is how PostgREST is told to re-read the schema.
notify pgrst, 'reload schema';


-- 3. Belt and braces: 007 is idempotent, so applying it directly
--    is harmless if it already ran. Uncomment to force it.
--
-- alter table public.reports          alter column user_id       drop not null;
-- alter table public.report_requests  alter column contact_email drop not null;
--
-- do $$ begin
--   create type public.request_origin as enum ('client', 'admin');
-- exception when duplicate_object then null; end $$;
--
-- alter table public.report_requests
--   add column if not exists origin public.request_origin not null default 'client';
--
-- create index if not exists report_requests_origin_idx
--   on public.report_requests(origin);
--
-- notify pgrst, 'reload schema';


-- 4. Re-confirm grants cover the column set (009 granted table-level
--    privileges, which cover all columns, but verify).
select has_table_privilege('service_role','public.report_requests','INSERT') as service_role_can_insert;
