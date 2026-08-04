-- ============================================================
-- Axionia — migration 017: identity confirmation gate (part 2 of 2)
--
-- RUN 016 FIRST, AS ITS OWN SUBMISSION. This file uses
-- 'awaiting_confirmation' as a literal, which is only legal once
-- the enum value added in 016 has committed. Running both in one
-- submission fails with 55P04.
--
-- ── What this does ──────────────────────────────────────────
--
-- The partial unique index enforcing "one active job per
-- company" has to learn about the new state. Without this, a job
-- parked at the identity gate looks inactive, and a second job
-- could be started for the same company alongside it — two runs
-- writing to the same benchmark tables, with the second one
-- likely started precisely because the first appeared stuck.
--
-- Safe to re-run.
-- ============================================================

drop index if exists research.pipeline_jobs_one_active_idx;

create unique index if not exists pipeline_jobs_one_active_idx
  on research.pipeline_jobs(company_id)
  where status in ('queued', 'running', 'paused', 'awaiting_confirmation')
    and company_id is not null;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'one-active index covers the gate' as check,
       exists (
         select 1 from pg_indexes
          where schemaname = 'research'
            and indexname = 'pipeline_jobs_one_active_idx'
            and indexdef like '%awaiting_confirmation%'
       ) as ok
union all
select 'gate is safe to deploy',
       exists (
         select 1
           from pg_enum e
           join pg_type t on t.oid = e.enumtypid
          where t.typname = 'job_status'
            and e.enumlabel = 'awaiting_confirmation'
       );
