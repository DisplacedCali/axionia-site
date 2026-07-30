-- ============================================================
-- Axionia — migration 011: staff roles and queue assignment
--
-- Until now there were two roles, 'client' and 'admin', and
-- requireAdmin() was the only gate in the codebase. That works
-- for one operator and stops working the moment there are two,
-- because the single most consequential action in the product —
-- releasing a report, which is also what emails the client — was
-- available to anyone who could see the admin at all.
--
-- Three ideas here.
--
-- 1. The privilege boundary is RELEASE, not "admin". Everything
--    upstream of release is recoverable: a bad research run can be
--    re-run, a bad edit lives in the reversible `edits` overlay,
--    a wrong status can be set back. Release is the one action
--    that leaves the building. So 'analyst' can do everything up
--    to it and nothing past it.
--
-- 2. 'owner' exists to hold role assignment. If admins could
--    promote admins, the role system would be decorative — any
--    admin could grant themselves release. One role that can
--    change roles, and it isn't the same one that does the work.
--
-- 3. Assignment is nullable and stays that way. An unassigned
--    request is the open queue; that's the default state and the
--    thing worth looking at, not an error to be cleaned up.
--
-- Run AFTER 010. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. ROLES
-- profiles.role is text + CHECK rather than an enum, matching
-- schema.sql. Widening a CHECK means dropping and re-adding it;
-- the constraint name is Postgres' default for a table-level
-- check on this column.
-- ────────────────────────────────────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'analyst', 'admin', 'owner'));


-- Existing admins become owners.
--
-- Deliberate, and only correct because of when it runs: today
-- every admin row is the single operator who built this. If this
-- migration is ever applied to a database with staff already in
-- it, promoting them all to owner is wrong — check the table
-- first. The alternative (leaving nobody as owner) locks role
-- management out entirely, which is worse on a database with
-- exactly one admin in it.
update public.profiles
   set role = 'owner'
 where role = 'admin';


-- ────────────────────────────────────────────────────────────
-- 2. ROLE PREDICATES
-- security definer so policies can read profiles without
-- recursing through profiles' own RLS — same reason is_admin()
-- was written that way in 002.
-- ────────────────────────────────────────────────────────────
create or replace function public.is_staff()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('analyst', 'admin', 'owner')
  );
$$;

create or replace function public.can_release()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- is_admin() predates this migration and is referenced by the
-- profiles_select_admin policy from 002. Redefined as an alias
-- for is_staff() rather than dropped: reading the user list is a
-- staff-level need, and leaving a stale definition behind that
-- silently excludes analysts is the kind of thing that gets
-- diagnosed three times before anyone reads the function body.
create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select public.is_staff();
$$;


-- ────────────────────────────────────────────────────────────
-- 3. QUEUE ASSIGNMENT
-- References auth.users rather than profiles so that deleting a
-- profile row can't orphan a request; on delete set null returns
-- the request to the open queue rather than hiding it.
-- ────────────────────────────────────────────────────────────
alter table public.report_requests
  add column if not exists assigned_to uuid
    references auth.users(id) on delete set null,
  add column if not exists assigned_at timestamptz;

create index if not exists report_requests_assigned_idx
  on public.report_requests(assigned_to);

-- The open queue is the hot path: unassigned work, newest first.
create index if not exists report_requests_open_idx
  on public.report_requests(created_at desc)
  where assigned_to is null and status in ('new', 'in_review');


-- ────────────────────────────────────────────────────────────
-- 4. GRANTS
-- The admin UI reads through the service role, which bypasses
-- RLS. These grants exist for the signed-in-staff path only.
-- ────────────────────────────────────────────────────────────
grant all privileges on public.report_requests to service_role;
grant all privileges on public.profiles        to service_role;


-- ────────────────────────────────────────────────────────────
-- 5. VERIFY
-- ────────────────────────────────────────────────────────────
select 'role check widened' as check,
       exists (
         select 1 from pg_constraint
         where conname = 'profiles_role_check'
           and pg_get_constraintdef(oid) like '%owner%'
       ) as ok
union all
select 'assigned_to exists',
       exists (select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'report_requests'
                  and column_name = 'assigned_to')
union all
select 'is_staff() exists',
       exists (select 1 from pg_proc where proname = 'is_staff')
union all
select 'can_release() exists',
       exists (select 1 from pg_proc where proname = 'can_release')
union all
select 'at least one owner',
       exists (select 1 from public.profiles where role = 'owner');
