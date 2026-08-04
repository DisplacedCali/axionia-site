-- ============================================================
-- Axionia — migration 015: client report view and print log
--
-- Until now a released report had nowhere for the client to open
-- it, so there was nothing to log. /reports/[id] changes that,
-- and the interesting signal is not that the requester read it —
-- it's that they printed it and handed it to someone.
--
-- Four decisions.
--
-- 1. Separate from deck_events. Same shape, different subject:
--    deck_events is about a public artifact where identity is
--    self-reported and unverified. Every row here belongs to an
--    authenticated session against a specific report. Merging
--    them would put a nullable report_id on the deck table and a
--    nullable deck slug on this one, and every query would then
--    have to filter for which kind of row it was reading.
--
-- 2. NO IP ADDRESS COLUMN — same reasoning as 012 and 014. It is
--    personal data, the site still has no privacy policy, and a
--    column that exists gets filled. Add it in its own migration
--    after counsel so the decision stays visible in the log.
--
-- 3. company_id is denormalised onto the row. RLS widens a
--    released report to everyone at the same company, so "which
--    account is circulating this" is the question this table
--    exists to answer, and it shouldn't need a three-table join
--    through profiles to answer it. It's also a point-in-time
--    record: someone moving companies later shouldn't silently
--    rewrite who read what.
--
-- 4. No unique constraint on (report_id, user_id, event). Repeat
--    views are the signal — a report opened nine times over two
--    weeks is a different buying position from one opened once.
--
-- Run AFTER 014. Safe to re-run.
-- ============================================================

create table if not exists public.report_events (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  event       text not null check (event in ('view', 'print')),

  -- Resolved server-side from the session, never accepted from the
  -- client. The route is behind auth, so this is not nullable in
  -- practice; it stays nullable only so a deleted auth user doesn't
  -- cascade away the history of what they read.
  user_id     uuid references auth.users(id) on delete set null,

  -- Point-in-time, see note 3.
  company_id  uuid references public.companies(id) on delete set null,

  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists report_events_report_idx  on public.report_events(report_id, created_at desc);
create index if not exists report_events_company_idx on public.report_events(company_id, created_at desc);
create index if not exists report_events_created_idx on public.report_events(created_at desc);

-- Prints are rare relative to views and are the row worth finding
-- fast, so they get their own partial index rather than a scan.
create index if not exists report_events_print_idx
  on public.report_events(report_id, created_at desc)
  where event = 'print';


-- ────────────────────────────────────────────────────────────
-- RLS
-- Writes go through the service role from a server action. No
-- client-facing insert policy: a client that can write this table
-- directly can forge the log, and a log you can't trust is worse
-- than no log because it will be believed.
--
-- No client-facing SELECT either. A client has no reason to read
-- who else at their company opened a report, and giving them that
-- view creates an internal-politics problem we don't want to own.
-- ────────────────────────────────────────────────────────────
alter table public.report_events enable row level security;

drop policy if exists "report_events_select_staff" on public.report_events;
create policy "report_events_select_staff"
  on public.report_events for select
  using (public.is_staff());

grant all privileges on public.report_events to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'report_events exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'report_events') as ok
union all
select 'no ip column (intentional)',
       not exists (select 1 from information_schema.columns
                    where table_schema = 'public'
                      and table_name = 'report_events'
                      and column_name in ('ip', 'ip_address'))
union all
select 'rls enabled',
       (select relrowsecurity from pg_class where relname = 'report_events')
union all
select 'service_role can insert',
       has_table_privilege('service_role', 'public.report_events', 'INSERT')
union all
select 'print partial index present',
       exists (select 1 from pg_indexes
                where schemaname = 'public' and indexname = 'report_events_print_idx');
