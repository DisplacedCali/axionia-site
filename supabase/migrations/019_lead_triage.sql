-- ============================================================
-- Axionia — migration 019: lead triage
--
-- A contact-form submission and a founders-deck print both write
-- a `leads` row, and nothing else happened. No admin email was
-- ever wired for either, and — worse — no screen in the product
-- ever displayed the table. A real inquiry from a real person sat
-- in Postgres with no path to a human.
--
-- Email was never going to be sufficient on its own here:
-- RESEND_API_KEY is unset, so every transactional send is logged
-- as 'skipped'. A notification system whose only channel is one
-- that isn't configured is a notification system that doesn't
-- exist. The fix is in-app first, email second.
--
-- Three decisions.
--
-- 1. `handled_at`, not a status enum. The only question worth
--    asking of a lead is "has someone dealt with this", and every
--    richer pipeline invented up front gets abandoned. Stage
--    tracking already exists on `companies` for anything that
--    becomes real.
--
-- 2. A STAFF SELECT POLICY. schema.sql gave leads an insert-only
--    policy with a comment that nobody may read them back through
--    the API — correct for anon, and the reason there was no admin
--    view is that reading them required the service role and
--    nobody had written that path. Staff can now read them
--    directly.
--
-- 3. No IP column here either, consistent with 012, 014, 015 and
--    018. /privacy now commits to this publicly.
--
-- Run AFTER 018. Safe to re-run.
-- ============================================================

alter table public.leads
  add column if not exists handled_at timestamptz,
  add column if not exists handled_by uuid references auth.users(id) on delete set null,
  -- What was done about it. Not a CRM — one line so the next person
  -- (or the same person in three weeks) knows it was answered.
  add column if not exists handled_note text;

-- The working query is "what's outstanding", so index for it rather than for
-- the full table.
create index if not exists leads_unhandled_idx
  on public.leads(created_at desc)
  where handled_at is null;

create index if not exists leads_email_idx on public.leads(lower(email));


-- ────────────────────────────────────────────────────────────
-- RLS
-- anon keeps insert-only. Staff gain select and update, so the
-- admin can read the queue without the service role — the absence
-- of this policy is why no admin view existed.
-- ────────────────────────────────────────────────────────────
drop policy if exists "leads_select_staff" on public.leads;
create policy "leads_select_staff"
  on public.leads for select
  using (public.is_staff());

drop policy if exists "leads_update_staff" on public.leads;
create policy "leads_update_staff"
  on public.leads for update
  using (public.is_staff())
  with check (public.is_staff());

grant select, update on public.leads to authenticated;
grant all privileges on public.leads to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'leads.handled_at exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='leads'
                  and column_name='handled_at') as ok
union all
select 'staff can select leads',
       exists (select 1 from pg_policies
                where schemaname='public' and tablename='leads'
                  and policyname='leads_select_staff')
union all
select 'unhandled index present',
       exists (select 1 from pg_indexes
                where schemaname='public' and indexname='leads_unhandled_idx')
union all
select 'anon still cannot read leads',
       not exists (select 1 from pg_policies
                    where schemaname='public' and tablename='leads'
                      and cmd='SELECT' and 'anon' = any(roles));
