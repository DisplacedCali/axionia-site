-- ============================================================
-- Axionia — migration 009: grant service_role what it needs
--
-- Symptom: /admin/new failed with "permission denied for table
-- companies", even though SUPABASE_SERVICE_ROLE_KEY is a valid
-- service_role JWT.
--
-- Cause: two separate mechanisms get conflated. service_role has
-- BYPASSRLS, so RLS policies don't apply to it — but bypassing RLS
-- is NOT the same as holding a table privilege. Without a GRANT it
-- still gets "permission denied", and the error says nothing about
-- which of the two is missing.
--
-- Why it was missing: on Supabase projects created after roughly
-- 2026-05-30, new tables no longer receive blanket grants to
-- anon / authenticated / service_role. Every table needs them
-- stated. schema.sql notes this for `authenticated` and grants
-- accordingly; nothing ever granted service_role, so every table
-- created by migrations 002 onward is unreadable by the admin
-- client. It only surfaced now because /admin/new is the first
-- server-side write path to be exercised.
--
-- Safety: service_role is server-only by definition — it already
-- bypasses RLS and is never exposed to a browser. Granting it full
-- access to `public` restores the intended posture rather than
-- loosening anything. It changes nothing for anon or authenticated.
--
-- Run AFTER 008. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. public schema — the admin client's working set
-- ────────────────────────────────────────────────────────────
grant usage on schema public to service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute  on all functions in schema public to service_role;

-- Future tables too, so the next migration doesn't reintroduce this.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;


-- ────────────────────────────────────────────────────────────
-- 2. research schema — the pipeline's working set
--
-- The pipeline connects over DATABASE_URL as `postgres`, not via
-- PostgREST, so this is belt-and-braces: postgres owns these
-- objects and already has implicit rights. Stated explicitly so
-- the posture survives an ownership change.
--
-- service_role is included so a future server action could reach
-- the research layer through supabase-js IF the schema were ever
-- exposed. It is NOT exposed, and should not be — PostgREST won't
-- serve it regardless of grants, which is the isolation that
-- matters. Grants alone don't weaken it.
-- ────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'research') then
    grant usage on schema research to postgres, service_role;
    grant all privileges on all tables    in schema research to postgres, service_role;
    grant all privileges on all sequences in schema research to postgres, service_role;
    grant execute  on all functions in schema research to postgres, service_role;

    alter default privileges in schema research
      grant all privileges on tables to postgres, service_role;

    raise notice 'research schema grants applied.';
  else
    raise notice 'research schema not found — skipped. Run supabase_research_schema.sql.';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- 3. Re-assert the client lockout.
--
-- Section 2's `all tables in schema research` would have caught
-- anon/authenticated if an earlier run had granted them anything.
-- These revokes are the ones that must hold: the benchmark data
-- is not reachable from a client key.
-- ────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'research') then
    execute 'revoke all on schema research from anon, authenticated';
    execute 'revoke all on all tables in schema research from anon, authenticated';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- VERIFY — every row should read true
-- ────────────────────────────────────────────────────────────
select 'service_role → public.companies SELECT' as check,
       has_table_privilege('service_role','public.companies','SELECT') as ok
union all
select 'service_role → public.companies INSERT',
       has_table_privilege('service_role','public.companies','INSERT')
union all
select 'service_role → public.report_requests INSERT',
       has_table_privilege('service_role','public.report_requests','INSERT')
union all
select 'service_role → public.reports INSERT',
       has_table_privilege('service_role','public.reports','INSERT')
union all
-- These two must be FALSE. Inverted so the column still reads true.
select 'anon CANNOT read research.companies',
       not has_table_privilege('anon','research.companies','SELECT')
union all
select 'authenticated CANNOT read research.companies',
       not has_table_privilege('authenticated','research.companies','SELECT');
