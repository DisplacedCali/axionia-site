-- ============================================================
-- Axionia — migration 022: ignoring a lead
--
-- The inbox had one action: "mark handled". Junk isn't handled —
-- nobody answered it and nobody will — so marking it that way
-- makes the handled list a lie and destroys the only record of
-- what was actually dealt with.
--
-- Two timestamps, not one enum, because they are two different
-- facts and both can be true of different rows:
--
--   handled_at  a person answered this
--   ignored_at  a person decided it needed no answer
--
-- Still no delete, consistent with 021. The row is evidence of
-- what arrived, and a spam corpus is worth keeping — it is what
-- the inbox's signal scoring is tuned against.
--
-- Run AFTER 021. Safe to re-run.
-- ============================================================

alter table public.leads
  add column if not exists ignored_at timestamptz,
  add column if not exists ignored_by uuid references auth.users(id) on delete set null;

-- The working query is "what still needs a person", which is now neither
-- handled nor ignored.
drop index if exists leads_unhandled_idx;
create index if not exists leads_outstanding_idx
  on public.leads(created_at desc)
  where handled_at is null and ignored_at is null;


-- ────────────────────────────────────────────────────────────
-- 021 narrowed the leads UPDATE grant to the triage columns.
-- Extend it rather than widening back to the table — the point of
-- that narrowing was that a policy edit shouldn't be able to turn
-- a staff-only table into an editable one.
-- ────────────────────────────────────────────────────────────
grant update (ignored_at, ignored_by) on public.leads to authenticated;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'leads.ignored_at exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='leads'
                  and column_name='ignored_at') as ok
union all
select 'triage columns updatable',
       has_column_privilege('authenticated', 'public.leads', 'ignored_at', 'UPDATE')
   and has_column_privilege('authenticated', 'public.leads', 'handled_at', 'UPDATE')
union all
select 'content columns still locked',
       not has_column_privilege('authenticated', 'public.leads', 'email', 'UPDATE')
   and not has_column_privilege('authenticated', 'public.leads', 'message', 'UPDATE')
union all
select 'outstanding index present',
       exists (select 1 from pg_indexes
                where schemaname='public' and indexname='leads_outstanding_idx');
