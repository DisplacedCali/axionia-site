-- ============================================================
-- Axionia — migration 006
--
-- BUG FIX (urgent): public.leads.interest carried a CHECK
-- constraint allowing only ('general','founding-member','on-prem'),
-- but the contact form has since grown five more options. Every
-- submission choosing one of those failed the insert and the lead
-- was lost — this covered the per-module CTAs on /platform, both
-- /research CTAs, and the performance-pricing CTA.
--
-- Replaced with a permissive constraint so adding a new interest
-- in the UI can never again silently drop leads on the floor.
--
-- Also adds newsletter subscriptions as a low-commitment path for
-- visitors who aren't ready to request a report.
--
-- Run AFTER 005. Safe to re-run.
-- ============================================================

-- ── 1. stop dropping leads ──
alter table public.leads drop constraint if exists leads_interest_check;

alter table public.leads
  add constraint leads_interest_check
  check (interest ~ '^[a-z0-9-]{1,40}$');

-- ── 2. newsletter ──
create table if not exists public.subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  source       text,
  created_at   timestamptz not null default now(),
  unsubscribed boolean not null default false
);

alter table public.subscribers enable row level security;

-- Anyone may subscribe; nobody may read the list back through the API.
drop policy if exists "subscribers_insert_anyone" on public.subscribers;
create policy "subscribers_insert_anyone"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

grant insert on public.subscribers to anon, authenticated;
