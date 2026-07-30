-- ============================================================
-- Axionia — migration 008: research pipeline job queue
--
-- The research pipeline moves out of the standalone axionia-app
-- Express server and into the site. It makes ~9 model calls
-- across 7 dependency waves and takes 60–90 seconds, so it runs
-- as a resumable job rather than one long request.
--
-- Why a job and not a single invocation: today, closing the
-- browser tab mid-run loses everything already paid for. Here
-- each wave's output is persisted as it completes, so a failure
-- resumes from the last good wave instead of restarting.
--
-- Lives in the `research` schema, which is NOT listed under
-- Project Settings → API → Exposed schemas — so PostgREST does
-- not serve it and supabase-js cannot reach it. The pipeline
-- talks to it over a direct Postgres connection (DATABASE_URL)
-- from server-side code only. That is the intended isolation:
-- the only way in is code holding the connection string.
--
-- Requires: the research schema from axionia-app's
-- supabase_research_schema.sql. That file will move into these
-- migrations when the Express server is retired (step 4).
--
-- Run AFTER 007. Safe to re-run.
-- ============================================================

do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'research') then
    raise exception 'research schema not found — run axionia-app/supabase_research_schema.sql first';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- Job status
--   queued     created, no wave run yet
--   running    a wave is in flight
--   paused     awaiting human confirmation (company identity)
--   complete   all waves done, research_runs row written
--   failed     a wave exhausted its attempts
--   cancelled  abandoned by an admin
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type research.job_status as enum
    ('queued','running','paused','complete','failed','cancelled');
exception when duplicate_object then null; end $$;


create table if not exists research.pipeline_jobs (
  id               uuid primary key default gen_random_uuid(),

  -- Set once the validate step resolves the company. Null before that:
  -- the job starts from a name the admin typed, which may not resolve.
  company_id       uuid references research.companies(id) on delete set null,

  -- Link back to the site's admin queue. Nullable so the pipeline can be
  -- driven from a script without a request row.
  request_id       uuid,

  status           research.job_status not null default 'queued',

  -- What the admin asked for.
  input            jsonb not null,

  -- Per-step record: { [stepId]: { status, startedAt, finishedAt, ms,
  --                                output, error, attempts } }
  -- Persisted after every wave, so this is the resume point.
  steps            jsonb not null default '{}'::jsonb,

  -- Which wave index runs next. The runner is a pure function of
  -- (plan, steps), but storing this makes progress queryable in SQL.
  next_wave        integer not null default 0,

  -- Whole-job attempts, for the failure ceiling.
  attempts         integer not null default 0,
  last_error       text,

  -- Set on completion.
  run_id           uuid references research.research_runs(id) on delete set null,

  -- Rough model spend, for unit-economics work later.
  input_tokens     integer not null default 0,
  output_tokens    integer not null default 0,
  model            text,

  created_by       uuid,  -- auth.users id of the admin who started it
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz
);

create index if not exists pipeline_jobs_status_idx     on research.pipeline_jobs(status);
create index if not exists pipeline_jobs_company_idx    on research.pipeline_jobs(company_id);
create index if not exists pipeline_jobs_request_idx    on research.pipeline_jobs(request_id);
create index if not exists pipeline_jobs_created_at_idx on research.pipeline_jobs(created_at desc);

-- Only one live job per company. Prevents a double-click on "Run research"
-- from paying for the pipeline twice — the common and expensive mistake.
create unique index if not exists pipeline_jobs_one_active_per_company
  on research.pipeline_jobs(company_id)
  where status in ('queued','running','paused') and company_id is not null;


create or replace function research.touch_pipeline_job()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();

  if new.status = 'running' and old.status is distinct from 'running'
     and new.started_at is null then
    new.started_at = now();
  end if;

  if new.status in ('complete','failed','cancelled')
     and old.status is distinct from new.status then
    new.finished_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists pipeline_jobs_touch on research.pipeline_jobs;
create trigger pipeline_jobs_touch
  before update on research.pipeline_jobs
  for each row execute function research.touch_pipeline_job();


-- ────────────────────────────────────────────────────────────
-- Operational views
-- ────────────────────────────────────────────────────────────

-- What's in flight, with a completed-step count pulled out of the jsonb.
create or replace view research.pipeline_queue as
  select j.id,
         j.status,
         coalesce(c.name, j.input ->> 'companyName') as company,
         j.input ->> 'industry'                      as industry,
         j.next_wave,
         (select count(*)
            from jsonb_each(j.steps) s
           where s.value ->> 'status' = 'done')      as steps_done,
         j.attempts,
         j.last_error,
         j.input_tokens,
         j.output_tokens,
         j.created_at,
         j.started_at,
         j.finished_at,
         case
           when j.finished_at is not null then
             round(extract(epoch from (j.finished_at - j.started_at))::numeric, 1)
           when j.started_at is not null then
             round(extract(epoch from (now() - j.started_at))::numeric, 1)
         end as elapsed_seconds
  from research.pipeline_jobs j
  left join research.companies c on c.id = j.company_id
  order by j.created_at desc;

-- Jobs stuck in 'running' with no update for 10 minutes. A serverless
-- invocation that died mid-wave leaves this state, and nothing else would
-- notice; the runner treats these as reclaimable.
create or replace view research.pipeline_stalled as
  select id, company_id, status, next_wave, attempts, updated_at,
         round(extract(epoch from (now() - updated_at))::numeric) as stale_seconds
  from research.pipeline_jobs
  where status = 'running'
    and updated_at < now() - interval '10 minutes'
  order by updated_at asc;


-- ────────────────────────────────────────────────────────────
-- Security: service-role / direct-connection only, same as the
-- rest of the research schema.
-- ────────────────────────────────────────────────────────────
alter table research.pipeline_jobs enable row level security;

revoke all on research.pipeline_jobs   from anon, authenticated;
revoke all on research.pipeline_queue  from anon, authenticated;
revoke all on research.pipeline_stalled from anon, authenticated;


select 'research.pipeline_jobs ready' as status;
