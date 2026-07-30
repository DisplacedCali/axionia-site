-- ============================================================
-- Axionia — migration 007: admin-initiated research
--
-- Lets an admin start research on any company with no user
-- account in existence. Output is stored against the company
-- so it's already there whenever someone from that company
-- does turn up — useful for prospect prep and for seeding the
-- benchmark library.
--
-- Three schema facts were in the way:
--   1. reports.user_id was NOT NULL — a report had to belong to
--      a person, so a company-only report was impossible.
--   2. report_requests.contact_email was NOT NULL — there's no
--      contact on an internally-initiated request.
--   3. Nothing distinguished admin-initiated work from an
--      inbound request, so the queue couldn't tell them apart.
--
-- Run AFTER 006. Safe to re-run.
-- ============================================================

-- 1. reports need not belong to a user
alter table public.reports alter column user_id drop not null;

-- 2. requests need not have a contact
alter table public.report_requests alter column contact_email drop not null;

-- 3. where did this request come from
do $$ begin
  create type public.request_origin as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

alter table public.report_requests
  add column if not exists origin public.request_origin not null default 'client';

create index if not exists report_requests_origin_idx
  on public.report_requests(origin);

-- Company-scoped visibility already covers user-less reports: a released
-- report with a company_id is visible to anyone whose profile carries that
-- company_id. Until such a person exists, nobody sees it — which is exactly
-- the intent. No policy change required.
