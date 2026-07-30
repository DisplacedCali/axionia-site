-- ============================================================
-- Diagnostic: who owns what, and who can read it.
-- Read-only. Safe to run repeatedly. Delete when done.
--
-- Chasing: "permission denied for table companies"
--
-- There are two tables called companies — public.companies (the
-- site's, keyed on domain) and research.companies (the research
-- layer's, keyed on name) — and two roles in play: whoever the
-- SQL Editor runs as, and `postgres`, which is what the pooler
-- connection in DATABASE_URL authenticates as. If those differ,
-- objects created here are owned by a role the app isn't.
-- ============================================================

-- 1. Who am I in the SQL Editor, and who does the app connect as?
select current_user             as sql_editor_role,
       session_user             as session_role,
       current_setting('is_superuser') as is_superuser;

-- 2. Object owners. If owner is not `postgres`, the pooler
--    connection has no implicit privileges on these.
select n.nspname                as schema,
       c.relname                as object,
       case c.relkind when 'r' then 'table' when 'v' then 'view' else c.relkind::text end as kind,
       pg_get_userbyid(c.relowner) as owner,
       c.relrowsecurity        as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname in ('research','public')
   and c.relkind in ('r','v')
   and (n.nspname = 'research' or c.relname in ('companies','reports','report_requests','profiles'))
 order by n.nspname, c.relkind, c.relname;

-- 3. Explicit table grants. Empty rows for postgres = the problem.
select table_schema, table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privs
  from information_schema.table_privileges
 where table_schema in ('research','public')
   and (table_schema = 'research' or table_name in ('companies','reports','report_requests'))
   and grantee in ('postgres','service_role','authenticated','anon','PUBLIC')
 group by table_schema, table_name, grantee
 order by table_schema, table_name, grantee;

-- 4. Schema-level USAGE. Without this, nothing inside is reachable.
select nspname as schema,
       pg_get_userbyid(nspowner) as owner,
       has_schema_privilege('postgres',     nspname, 'USAGE')  as postgres_usage,
       has_schema_privilege('service_role', nspname, 'USAGE')  as service_role_usage
  from pg_namespace
 where nspname in ('research','public');

-- 5. Can postgres actually read each one? This is the decisive test.
select 'research.companies'      as obj, has_table_privilege('postgres','research.companies','SELECT')      as postgres_can_select
union all select 'research.pipeline_jobs',  has_table_privilege('postgres','research.pipeline_jobs','SELECT')
union all select 'research.research_runs',  has_table_privilege('postgres','research.research_runs','SELECT')
union all select 'public.companies',        has_table_privilege('postgres','public.companies','SELECT');

-- 6. Views run with their OWNER's privileges. A view owned by a
--    role that can't read public.companies fails exactly this way.
select schemaname, viewname, viewowner
  from pg_views
 where schemaname = 'research'
 order by viewname;
