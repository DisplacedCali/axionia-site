-- ============================================================
-- Axionia — migration 014: first-party analytics + CRM fields
--
-- Two things that share a migration because they share a
-- purpose: knowing which companies are paying attention, and
-- what you're doing about it.
--
-- ── ON LOCATION, AND WHY THERE IS STILL NO IP COLUMN ──
--
-- The ask was "unique visitors, their locations, tie IP
-- addresses to customers where possible". This gets you the
-- first two and a better version of the third.
--
-- Vercel resolves geography at its edge and hands it over as
-- request headers (x-vercel-ip-country / -region / -city). So we
-- can store country and city WITHOUT ever storing the address
-- they were derived from. Coarse location is meaningfully less
-- sensitive than a raw IP: it can't be re-identified against
-- other logs, and it can't be handed to a third party to look up.
--
-- Person-level IP matching also mostly doesn't work. What does
-- work is what's built here: a first-party session id in a
-- cookie, stitched to a real identity the moment someone submits
-- a form. That turns "someone in Minneapolis read /pricing four
-- times" into "the person who requested a report on Tuesday read
-- /pricing four times before they did" — which is the question
-- worth answering, and it needs no IP at all.
--
-- If you later want reverse-IP company lookup (Clearbit Reveal,
-- RB2B and similar), that's a vendor decision with a privacy
-- policy attached. Add it in its own migration.
--
-- ── SESSION IDS ──
--
-- Random, opaque, server-set, first-party, and meaningless on
-- their own. Not a fingerprint: clearing cookies genuinely
-- resets it, which is the honest behaviour.
--
-- Run AFTER 013. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. SITE EVENTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.site_events (
  id           bigint generated always as identity primary key,

  session_id   text not null,
  event        text not null default 'view'
               check (event in ('view', 'intake_start', 'intake_submit',
                                'scorer_request', 'contact_submit', 'signup')),
  path         text not null,

  -- acquisition
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,

  -- coarse geography, derived at the edge. NEVER the address itself.
  country      text,
  region       text,
  city         text,

  -- identity, filled in when we learn it — including retroactively for
  -- earlier rows in the same session. See lib/analytics.ts.
  user_id      uuid references auth.users(id)      on delete set null,
  company_id   uuid references public.companies(id) on delete set null,

  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists site_events_created_idx  on public.site_events(created_at desc);
create index if not exists site_events_session_idx  on public.site_events(session_id);
create index if not exists site_events_path_idx     on public.site_events(path);
create index if not exists site_events_company_idx  on public.site_events(company_id) where company_id is not null;
create index if not exists site_events_event_idx    on public.site_events(event) where event <> 'view';


-- ────────────────────────────────────────────────────────────
-- 2. CRM FIELDS ON COMPANIES
--
-- Columns on companies rather than a deals table. A deals table
-- is the right model when one account can have several open
-- opportunities at once; here an account is either in play or it
-- isn't, and a second table would mean joining to answer every
-- question the list view asks.
--
-- Revisit if an account ever needs two simultaneous pipelines.
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type public.company_stage as enum (
    'lead', 'engaged', 'analysis', 'proposal', 'client', 'dormant', 'declined'
  );
exception when duplicate_object then null; end $$;

alter table public.companies
  add column if not exists stage           public.company_stage not null default 'lead',
  add column if not exists owner_id        uuid references auth.users(id) on delete set null,
  add column if not exists next_action     text,
  add column if not exists next_action_at  date,
  add column if not exists stage_changed_at timestamptz;

create index if not exists companies_stage_idx  on public.companies(stage);
create index if not exists companies_owner_idx  on public.companies(owner_id);

-- Overdue follow-ups are the hot query on the CRM view.
create index if not exists companies_next_action_idx
  on public.companies(next_action_at)
  where next_action_at is not null;

-- Stamp stage_changed_at automatically. Doing it in the app means
-- forgetting it in one of the three places that write a stage.
create or replace function public.touch_stage_changed()
returns trigger language plpgsql as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists companies_stage_touch on public.companies;
create trigger companies_stage_touch
  before update on public.companies
  for each row execute function public.touch_stage_changed();


-- ────────────────────────────────────────────────────────────
-- 3. RLS
-- Writes are service-role only, from a route handler. No client
-- policy: anon must not read the traffic log, and must not be
-- able to insert directly either, or the numbers are forgeable
-- by anyone who reads the network tab.
-- ────────────────────────────────────────────────────────────
alter table public.site_events enable row level security;

drop policy if exists "site_events_select_staff" on public.site_events;
create policy "site_events_select_staff"
  on public.site_events for select
  using (public.is_staff());

grant all privileges on public.site_events to service_role;
grant all privileges on public.companies   to service_role;


-- ────────────────────────────────────────────────────────────
-- 4. VERIFY
-- ────────────────────────────────────────────────────────────
select 'site_events exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema='public' and table_name='site_events') as ok
union all
select 'still no ip column anywhere',
       not exists (select 1 from information_schema.columns
                    where table_schema='public'
                      and table_name in ('site_events','deck_events')
                      and column_name in ('ip','ip_address'))
union all
select 'companies.stage exists',
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='companies'
                  and column_name='stage')
union all
select 'stage trigger installed',
       exists (select 1 from pg_trigger where tgname='companies_stage_touch')
union all
select 'site_events rls on',
       (select relrowsecurity from pg_class where relname='site_events');
