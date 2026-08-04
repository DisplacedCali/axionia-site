-- ============================================================
-- Axionia — migration 018: report recipients
--
-- A report could only reach the person who submitted the request.
-- Admin-initiated research had nobody to notify at all — it sat in
-- the company folder until someone from that company happened to
-- sign up. That is fine as a fallback and useless for the actual
-- case: a CFO you met at a conference, a broker who asked to see
-- the work, an advisor who will never create an account.
--
-- Two send modes, chosen per recipient:
--
--   'invite'  an auth user is created and linked, the email carries
--             a login link. Attribution is real and RLS keeps doing
--             the authorisation. Costs the recipient one OTP.
--
--   'link'    an HMAC-signed, expiring URL — same machinery as the
--             founders deck, but with the report id inside the
--             signature so a link for one employer cannot be
--             replayed against another. Zero friction, and anyone
--             holding the URL can read it.
--
-- Three decisions.
--
-- 1. company_id IS NULLABLE, deliberately. A broker or independent
--    advisor has no company record here and should not need one
--    invented to receive a report. Requiring it would push people
--    to create junk company rows, which is worse for the CRM than
--    a null.
--
-- 2. NO IP COLUMN, consistent with 012, 014 and 015. Still no
--    privacy policy. Add it in its own migration, after counsel.
--
-- 3. The row is the record of a SEND, not of access. Access comes
--    from RLS (invite) or the signature (link). Deleting a row
--    does not revoke anything — revoking a link means rotating
--    REPORT_LINK_SECRET, which is stated here so nobody assumes
--    otherwise in an incident.
--
-- Run AFTER 017. Safe to re-run.
-- ============================================================

create table if not exists public.report_recipients (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.reports(id) on delete cascade,

  email         text not null,
  full_name     text,
  -- Free-text. A broker's firm, or an employer with no company row yet.
  organisation  text,

  company_id    uuid references public.companies(id) on delete set null,
  -- Set when mode = 'invite' and the account exists.
  user_id       uuid references auth.users(id) on delete set null,

  mode          text not null check (mode in ('invite', 'link')),
  -- The label baked into a signed link, so a forwarded link is still
  -- attributable to whoever it was minted for.
  link_label    text,
  link_expires_at timestamptz,

  sent_by       uuid references auth.users(id) on delete set null,
  sent_at       timestamptz not null default now(),
  -- Stamped the first time this recipient opens the report.
  first_opened_at timestamptz
);

create index if not exists report_recipients_report_idx
  on public.report_recipients(report_id, sent_at desc);
create index if not exists report_recipients_email_idx
  on public.report_recipients(lower(email));

-- One live send per person per report. Re-sending updates the row rather than
-- stacking duplicates, so "who has this" stays answerable at a glance.
create unique index if not exists report_recipients_unique_idx
  on public.report_recipients(report_id, lower(email));


-- ────────────────────────────────────────────────────────────
-- RLS
-- Staff read. No client-facing policy at all: a client has no
-- reason to enumerate who else received their report, and giving
-- them that view creates an internal-politics problem we would
-- then own. Writes go through the service role from a server
-- action.
-- ────────────────────────────────────────────────────────────
alter table public.report_recipients enable row level security;

drop policy if exists "report_recipients_select_staff" on public.report_recipients;
create policy "report_recipients_select_staff"
  on public.report_recipients for select
  using (public.is_staff());

grant all privileges on public.report_recipients to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'report_recipients exists' as check,
       exists (select 1 from information_schema.tables
                where table_schema = 'public' and table_name = 'report_recipients') as ok
union all
select 'company_id is nullable (brokers, advisors)',
       (select is_nullable = 'YES' from information_schema.columns
         where table_schema = 'public' and table_name = 'report_recipients'
           and column_name = 'company_id')
union all
select 'no ip column (intentional)',
       not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'report_recipients'
                      and column_name in ('ip', 'ip_address'))
union all
select 'rls enabled',
       (select relrowsecurity from pg_class where relname = 'report_recipients')
union all
select 'service_role can insert',
       has_table_privilege('service_role', 'public.report_recipients', 'INSERT');
