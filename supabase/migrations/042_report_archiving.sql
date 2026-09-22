-- ============================================================
-- Axionia — migration 042: archiving a report
--
-- There was no way to get a report off a screen. report_requests has an
-- 'archived' status; public.report_status is ('pending','in_review','ready')
-- and has none — so a duplicate, a shell, or a superseded draft stayed in
-- every list forever. Eight redundant reports for one company is what that
-- looks like once anything goes wrong upstream.
--
-- A TIMESTAMP, NOT AN ENUM VALUE, and that is the whole design:
--
--   · 019 already settled this shape for leads — "one timestamp, not a status
--     enum: the only question worth asking is whether someone dealt with it."
--     Same question here.
--   · status carries where the document is in its life (pending → in_review →
--     ready). Archiving is orthogonal: an archived report is still whatever it
--     was. Folding the two into one column loses the original state and makes
--     un-archiving a guess about what to restore.
--   · A released report's status is 'ready', and that is exactly what
--     reports_select_company_ready keys on. Archiving via status would silently
--     revoke a client's access to a document they had been given. A separate
--     column cannot do that by accident.
--   · alter type ... add value cannot be used in the same transaction that
--     uses it, which makes an enum change awkward to apply and awkward to
--     re-run. This is a plain column.
--
-- Reversible by design: archived_at = null restores it. Nothing is deleted,
-- for the same reason /admin/users hides rather than deletes — the row is the
-- evidence of whatever produced it.
--
-- Run AFTER 041. Safe to re-run.
-- ============================================================

alter table public.reports
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

comment on column public.reports.archived_at is
  'Set when a report is archived out of the admin lists. Orthogonal to status, '
  'which keeps recording where the document is in its life. Null means active. '
  'Archiving never changes client visibility — that is status = ready via '
  'reports_select_company_ready.';

-- Every admin list reads the active ones, so index those rather than all.
create index if not exists reports_active_idx
  on public.reports(company_id, created_at desc)
  where archived_at is null;

grant all privileges on public.reports to service_role;

-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'reports.archived_at exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='reports'
                  and column_name='archived_at') as ok
union all
select 'reports.archived_by exists',
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='reports'
                  and column_name='archived_by')
union all
select 'active-reports index present',
       exists (select 1 from pg_indexes
                where schemaname='public' and indexname='reports_active_idx')
union all
select 'status enum untouched',
       (select count(*) = 3 from pg_enum e
          join pg_type t on t.oid = e.enumtypid
         where t.typname = 'report_status');
