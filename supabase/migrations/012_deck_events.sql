-- ============================================================
-- Axionia — migration 012: deck view and print log
--
-- /deck is public and shareable, so the only signal we get about
-- who looked at it is what we record ourselves.
--
-- Three decisions.
--
-- 1. One table, two event kinds. A separate prints table would
--    have meant joining two shapes to answer "who opened it and
--    did they take it away", which is the only question worth
--    asking of this data.
--
-- 2. NO IP ADDRESS COLUMN. An IP is personal data under GDPR and
--    the state privacy acts, and the site has no privacy policy
--    yet. Adding the column now means someone fills it later
--    without the policy question ever being asked. Add it in a
--    migration of its own, after counsel, so the decision is
--    visible in the log.
--
-- 3. Contact fields are nullable and unverified. A signed-in
--    viewer is identified by user_id; an anonymous one types a
--    name and email to print and nothing checks them. That is
--    deliberate for now — friction costs more than junk rows do
--    at this volume. When junk becomes the problem, rate-limit on
--    the action rather than adding a verification step.
--
-- Run AFTER 011. Safe to re-run.
-- ============================================================

create table if not exists public.deck_events (
  id            uuid primary key default gen_random_uuid(),
  deck          text not null default 'buyer',
  event         text not null check (event in ('view', 'print')),

  -- who, if we know
  user_id       uuid references auth.users(id) on delete set null,

  -- who, if they told us. Unverified by design.
  contact_name  text,
  contact_email text,
  contact_org   text,

  referrer      text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists deck_events_created_idx on public.deck_events(created_at desc);
create index if not exists deck_events_event_idx   on public.deck_events(deck, event);
create index if not exists deck_events_user_idx    on public.deck_events(user_id);

-- Email is the join key back to a lead, so it's worth being able to
-- group on it without a scan once this table has some size.
create index if not exists deck_events_email_idx
  on public.deck_events(lower(contact_email))
  where contact_email is not null;


-- ────────────────────────────────────────────────────────────
-- RLS
-- Writes go through the service role from a server action. There
-- is no client-facing policy at all: anon must not be able to
-- read who else has looked at the deck, and must not be able to
-- write rows directly either, or the log becomes forgeable.
-- ────────────────────────────────────────────────────────────
alter table public.deck_events enable row level security;

drop policy if exists "deck_events_select_staff" on public.deck_events;
create policy "deck_events_select_staff"
  on public.deck_events for select
  using (public.is_staff());

grant all privileges on public.deck_events to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'deck_events exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'deck_events') as ok
union all
select 'no ip column (intentional)',
       not exists (select 1 from information_schema.columns
                    where table_schema = 'public'
                      and table_name = 'deck_events'
                      and column_name in ('ip', 'ip_address'))
union all
select 'rls enabled',
       (select relrowsecurity from pg_class where relname = 'deck_events')
union all
select 'service_role can insert',
       has_table_privilege('service_role', 'public.deck_events', 'INSERT');
