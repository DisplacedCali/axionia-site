-- ============================================================
-- Axionia — migration 033: email delivery events
--
-- `email_log` (002) records that a send was ATTEMPTED. It has never
-- recorded whether one ARRIVED. `lib/email.ts` inserts one row with
-- status 'sent' | 'skipped' | 'failed', and nothing ever updates it
-- again — so a 200 from Resend, which means "accepted for delivery",
-- gets written down as though it meant "the client has it."
--
-- That matters most at exactly the wrong moment. `reportReleased`
-- is the email that ends the workflow: an analyst releases, the row
-- says 'sent', and the queue moves on. If that address bounced, or
-- the domain rejected it, nothing anywhere changes and the report
-- is simply never read. EMAIL-SETUP.md already tells a future
-- reader to "check email_log first when mail goes quiet" — this is
-- what makes that instruction true rather than half true.
--
-- Four decisions.
--
-- 1. EXTEND email_log, don't replace it. `provider_id` is already
--    Resend's email id and is already written on success; it is the
--    join key a webhook arrives with. A parallel table would leave
--    two answers to "did this send."
--
-- 2. Events are APPEND-ONLY and raw, in their own table. email_log
--    holds current state; email_events holds how it got there. Same
--    split as reports.content vs reports.edits — a roll-up must
--    never destroy what it rolled up.
--
-- 3. STATUS ONLY MOVES FORWARD, by rank. Webhooks arrive out of
--    order routinely, and a late 'sent' overwriting 'delivered'
--    would make the column untrustworthy in the one direction that
--    matters. 'complained' outranks everything: it is the state
--    most worth seeing and the one you least want overwritten.
--
-- 4. Opens and clicks are TIMESTAMPS AND COUNTS, not statuses. An
--    opened email is still delivered. Folding engagement into
--    `status` would mean an open could mask a later bounce.
--
-- No IP column, consistent with 012, 014, 015, 018 and 019.
-- /privacy commits to this publicly. Resend sends a click's user
-- agent and IP in the payload; `payload` is stored whole, so if
-- that ever needs to be true of this table too, strip it here.
--
-- Run AFTER 032. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. EMAIL_LOG — delivery state
-- ────────────────────────────────────────────────────────────
alter table public.email_log
  add column if not exists delivered_at     timestamptz,
  add column if not exists first_opened_at  timestamptz,
  add column if not exists last_opened_at   timestamptz,
  add column if not exists open_count       int not null default 0,
  add column if not exists first_clicked_at timestamptz,
  add column if not exists click_count      int not null default 0,
  add column if not exists bounced_at       timestamptz,
  add column if not exists complained_at    timestamptz,
  add column if not exists updated_at       timestamptz not null default now();

-- The webhook arrives with Resend's id and nothing else to join on.
-- Deliberately NOT unique: this migration runs against a live table,
-- and a unique index that fails on legacy data takes the whole
-- migration down. Replay safety comes from email_events.svix_id
-- instead, which is enforceable because the column is new.
create index if not exists email_log_provider_idx
  on public.email_log(provider_id)
  where provider_id is not null;

-- The screen this feeds is "what went wrong", so index for that.
create index if not exists email_log_trouble_idx
  on public.email_log(created_at desc)
  where status in ('bounced', 'complained', 'failed', 'suppressed');


-- ────────────────────────────────────────────────────────────
-- 2. EMAIL_EVENTS — the audit trail
-- ────────────────────────────────────────────────────────────
create table if not exists public.email_events (
  id           uuid primary key default gen_random_uuid(),
  email_log_id uuid references public.email_log(id) on delete cascade,
  provider_id  text not null,
  event_type   text not null,          -- email.delivered, email.opened, …
  occurred_at  timestamptz not null default now(),
  payload      jsonb not null,         -- the webhook body, untouched
  -- Svix's message id. Resend retries anything that isn't a 2xx, so
  -- the same event arrives more than once as a matter of course.
  -- This is what makes a replay a no-op rather than a double count.
  svix_id      text unique,
  received_at  timestamptz not null default now()
);

create index if not exists email_events_log_idx
  on public.email_events(email_log_id, occurred_at desc);
create index if not exists email_events_provider_idx
  on public.email_events(provider_id);


-- ────────────────────────────────────────────────────────────
-- 3. ROLL-UP
-- ────────────────────────────────────────────────────────────
create or replace function public.email_status_rank(s text)
returns int language sql immutable as $$
  select case s
    when 'skipped'    then 0   -- never sent; no webhook can arrive for it
    when 'queued'     then 0
    when 'sent'       then 1
    when 'delayed'    then 2
    when 'delivered'  then 3
    when 'suppressed' then 4
    when 'failed'     then 5
    when 'bounced'    then 6
    when 'complained' then 7
    else 0
  end;
$$;

create or replace function public.apply_email_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_status text;
begin
  -- Resolve the log row if the caller didn't. Most recent wins: see
  -- the note on email_log_provider_idx for why this isn't unique.
  if new.email_log_id is null then
    select id into new.email_log_id
      from public.email_log
     where provider_id = new.provider_id
     order by created_at desc
     limit 1;

    -- An event with no matching send is kept rather than dropped.
    -- It means either a send this app didn't make, or a row that
    -- was deleted — both are worth being able to see.
    if new.email_log_id is null then
      return new;
    end if;
  end if;

  new_status := case new.event_type
    when 'email.sent'             then 'sent'
    when 'email.delivered'        then 'delivered'
    when 'email.delivery_delayed' then 'delayed'
    when 'email.bounced'          then 'bounced'
    when 'email.complained'       then 'complained'
    when 'email.suppressed'       then 'suppressed'
    when 'email.failed'           then 'failed'
    else null
  end;

  update public.email_log l set
    status = case
      when new_status is null then l.status
      when public.email_status_rank(new_status)
           > public.email_status_rank(l.status) then new_status
      else l.status
    end,
    delivered_at = case when new.event_type = 'email.delivered'
                        then coalesce(l.delivered_at, new.occurred_at)
                        else l.delivered_at end,
    bounced_at   = case when new.event_type = 'email.bounced'
                        then coalesce(l.bounced_at, new.occurred_at)
                        else l.bounced_at end,
    complained_at = case when new.event_type = 'email.complained'
                        then coalesce(l.complained_at, new.occurred_at)
                        else l.complained_at end,
    first_opened_at = case when new.event_type = 'email.opened'
                        then coalesce(l.first_opened_at, new.occurred_at)
                        else l.first_opened_at end,
    last_opened_at = case when new.event_type = 'email.opened'
                        then greatest(coalesce(l.last_opened_at, new.occurred_at),
                                      new.occurred_at)
                        else l.last_opened_at end,
    open_count = l.open_count
                 + case when new.event_type = 'email.opened' then 1 else 0 end,
    first_clicked_at = case when new.event_type = 'email.clicked'
                        then coalesce(l.first_clicked_at, new.occurred_at)
                        else l.first_clicked_at end,
    click_count = l.click_count
                 + case when new.event_type = 'email.clicked' then 1 else 0 end,
    updated_at = now()
  where l.id = new.email_log_id;

  return new;
end;
$$;

drop trigger if exists email_events_apply on public.email_events;
create trigger email_events_apply
  before insert on public.email_events
  for each row execute function public.apply_email_event();


-- ────────────────────────────────────────────────────────────
-- 4. RLS
-- Staff read, nobody writes through the API. Every insert here
-- comes from the webhook route using the service role, and a
-- delivery record a client could write is not a delivery record.
-- ────────────────────────────────────────────────────────────
alter table public.email_log    enable row level security;
alter table public.email_events enable row level security;

drop policy if exists "email_log_select_staff" on public.email_log;
create policy "email_log_select_staff"
  on public.email_log for select
  using (public.is_staff());

drop policy if exists "email_events_select_staff" on public.email_events;
create policy "email_events_select_staff"
  on public.email_events for select
  using (public.is_staff());

-- SELECT only. Per the 020 lesson: RLS restricts rows, GRANTs
-- restrict columns, and neither of these tables has a column an
-- authenticated user has any business writing.
grant select on public.email_log    to authenticated;
grant select on public.email_events to authenticated;
grant all privileges on public.email_log    to service_role;
grant all privileges on public.email_events to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'email_log.delivered_at exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='email_log'
                  and column_name='delivered_at') as ok
union all
select 'email_events table exists',
       exists (select 1 from information_schema.tables
                where table_schema='public' and table_name='email_events')
union all
select 'roll-up trigger present',
       exists (select 1 from pg_trigger where tgname='email_events_apply')
union all
select 'svix_id is unique',
       exists (select 1 from pg_indexes
                where schemaname='public' and tablename='email_events'
                  and indexdef ilike '%unique%svix_id%')
union all
select 'staff can select email_log',
       exists (select 1 from pg_policies
                where schemaname='public' and tablename='email_log'
                  and policyname='email_log_select_staff')
union all
select 'anon cannot read email_log',
       not exists (select 1 from pg_policies
                    where schemaname='public' and tablename='email_log'
                      and cmd='SELECT' and 'anon' = any(roles));
