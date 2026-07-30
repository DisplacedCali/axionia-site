-- ============================================================
-- Axionia — Research Intelligence Layer (Supabase)
-- Run ONCE in the Supabase SQL Editor. Idempotent.
--
-- Lives in a DEDICATED "research" schema, not public.
--
-- Why: (1) public.companies is already taken by something else
-- in this project, and (2) more importantly, PostgREST only
-- serves schemas listed under Project Settings → API →
-- Exposed schemas. Keeping this layer out of public makes it
-- unreachable from any anon or authenticated key structurally,
-- rather than relying on grants being right forever.
--
--   ⚠ DO NOT add "research" to Exposed schemas.
--
-- The client-delivery layer (public.profiles,
-- public.intake_responses, public.reports) is untouched.
--
-- Supersedes db_setup.sql — archived in _local/.
-- ============================================================

create schema if not exists research;

-- Service role bypasses RLS and owns this schema's access.
-- Clients get nothing, at the schema level.
revoke all on schema research from anon, authenticated;
grant  usage, create on schema research to postgres, service_role;

-- Any table created here later inherits the same posture.
alter default privileges in schema research
  revoke all on tables from anon, authenticated;


-- ────────────────────────────────────────────────────────────
-- 1. COMPANIES — one row per researched employer
-- ────────────────────────────────────────────────────────────
create table if not exists research.companies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  website          text,
  -- Link to the site's canonical identity. public.companies.domain is the
  -- single source of truth for who a company IS; this column is how a
  -- name-keyed research row points at it. Nullable and un-FK'd on purpose:
  -- research runs before any public.companies row needs to exist, which is
  -- the whole point of site migration 007.
  domain           text,
  industry         text,
  hq               text,
  size             text,
  first_researched timestamptz not null default now(),
  last_researched  timestamptz not null default now(),
  refresh_due      timestamptz not null default now() + interval '30 days',
  notes            text
);

alter table research.companies add column if not exists domain text;
create index if not exists companies_domain_idx on research.companies (domain);

-- Case-insensitive uniqueness. The old schema had UNIQUE(name)
-- but looked up with LOWER(name), so "Park Dental" and
-- "park dental" would fork one company's history. This index
-- is what the server's upsert targets.
create unique index if not exists companies_name_lower_key
  on research.companies (lower(name));

create index if not exists companies_industry_lower_idx
  on research.companies (lower(industry));

create index if not exists companies_refresh_due_idx
  on research.companies (refresh_due);


-- Domain derivation lives HERE, called by both the save path and the promote
-- path. Two copies of this regex in two languages is exactly how the two
-- registries would drift apart.
--
-- STRICT: returns null when there's nothing to derive from. Callers decide
-- what a missing domain means — research tolerates null, promote cannot.
create or replace function research.normalize_domain(p_website text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(regexp_replace(coalesce(p_website, ''),
          '^(https?://)?(www\.)?([^/:?#]+).*$', '\3')),
    ''
  );
$$;

-- Placeholder identity for a company with no known website. Mirrors the site's
-- 'internal.<slug>' convention. Only ever called at promote time, because that
-- is the only moment a public.companies row is actually required — research
-- itself is happy with a null domain.
create or replace function research.placeholder_domain(p_name text)
returns text
language sql
immutable
as $$
  select 'internal.' || trim(both '-' from
           regexp_replace(lower(coalesce(nullif(trim(p_name), ''), 'unknown')),
                          '[^a-z0-9]+', '-', 'g'));
$$;


-- ────────────────────────────────────────────────────────────
-- 2. RESEARCH_RUNS — full pipeline output, one row per run
-- History is preserved: re-running appends rather than
-- overwrites, so score movement stays queryable.
-- ────────────────────────────────────────────────────────────
create table if not exists research.research_runs (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references research.companies(id) on delete cascade,
  run_date         timestamptz not null default now(),
  pipeline_version text not null default '3.0',

  -- Narrative agent outputs
  linkedin_data    text,
  profile          text,
  benefits         text,
  financial        text,
  regulatory       text,
  brief            text,

  -- Structured agent outputs
  workforce_data   jsonb,
  scores           jsonb,
  states_data      jsonb,

  -- Verbatim payload for cache replay
  full_payload     jsonb
);

create index if not exists research_runs_company_idx on research.research_runs (company_id);
create index if not exists research_runs_date_idx    on research.research_runs (run_date desc);


-- ────────────────────────────────────────────────────────────
-- 3. RADAR_SCORES — the 8 axes, flattened for benchmarking
-- This is the compounding asset. Keep it structured, never
-- only inside jsonb.
-- ────────────────────────────────────────────────────────────
create table if not exists research.radar_scores (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references research.companies(id)     on delete cascade,
  run_id               uuid not null references research.research_runs(id) on delete cascade,
  run_date             timestamptz not null default now(),

  spend_efficiency     numeric(5,2),
  decision_maturity    numeric(5,2),
  workforce_alignment  numeric(5,2),
  vendor_independence  numeric(5,2),
  analytics_readiness  numeric(5,2),
  cfo_engagement       numeric(5,2),
  regulatory_readiness numeric(5,2),
  appreciation_value   numeric(5,2),

  overall_score        numeric(5,2),
  readiness_label      text,
  weakest_axis         text,

  -- Keeps estimated score sets out of benchmark averages.
  is_fallback          boolean not null default false
);

create index if not exists radar_scores_company_idx on research.radar_scores (company_id);
create index if not exists radar_scores_label_idx   on research.radar_scores (readiness_label);
create unique index if not exists radar_scores_run_key on research.radar_scores (run_id);


-- ────────────────────────────────────────────────────────────
-- 4. BENEFIT_GAPS — cross-company gap pattern analysis
-- ────────────────────────────────────────────────────────────
create table if not exists research.benefit_gaps (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references research.companies(id)     on delete cascade,
  run_id           uuid not null references research.research_runs(id) on delete cascade,
  segment          text,
  benefit          text,
  urgency          text check (urgency in ('High','Medium','Low')),
  gap_rationale    text,
  retention_impact text,
  created_at       timestamptz not null default now()
);

create index if not exists benefit_gaps_company_idx on research.benefit_gaps (company_id);
create index if not exists benefit_gaps_benefit_idx on research.benefit_gaps (benefit);
create index if not exists benefit_gaps_urgency_idx on research.benefit_gaps (urgency);


-- ============================================================
-- VIEWS — the benchmark surface
-- ============================================================

-- Latest non-fallback score per company
create or replace view research.latest_scores as
  select distinct on (r.company_id)
    c.id as company_id, c.name, c.industry, c.hq, c.size,
    r.run_date, r.overall_score, r.readiness_label, r.weakest_axis,
    r.spend_efficiency, r.decision_maturity, r.workforce_alignment,
    r.vendor_independence, r.analytics_readiness, r.cfo_engagement,
    r.regulatory_readiness, r.appreciation_value
  from research.radar_scores r
  join research.companies c on c.id = r.company_id
  where r.is_fallback = false
  order by r.company_id, r.run_date desc;

-- Most common gaps across the book
create or replace view research.common_gaps as
  select benefit, urgency,
         count(*)                   as frequency,
         count(distinct company_id) as company_count
  from research.benefit_gaps
  group by benefit, urgency
  order by frequency desc;

-- Industry benchmarks. company_count is exposed so thin cells
-- are visible rather than quoted as if they were real.
create or replace view research.industry_benchmarks as
  select c.industry,
    count(*)                            as company_count,
    round(avg(r.overall_score), 1)      as avg_overall,
    round(avg(r.spend_efficiency), 1)   as avg_spend,
    round(avg(r.cfo_engagement), 1)     as avg_cfo,
    round(avg(r.appreciation_value), 1) as avg_appreciation,
    round(min(r.overall_score), 1)      as min_score,
    round(max(r.overall_score), 1)      as max_score
  from research.radar_scores r
  join research.companies c on c.id = r.company_id
  where r.is_fallback = false
  group by c.industry
  order by company_count desc;

-- Registry linkage — makes drift between the two company registries visible
-- rather than silent. link_state tells you which rows need attention:
--   linked       research row resolves to a real public.companies row
--   unlinked     domain known, but no public.companies row yet (normal until
--                the run is promoted)
--   no_domain    no website captured, so no identity can be derived — these
--                will get an 'internal.<slug>' placeholder on promote
-- Guarded: depends on the site's public.companies existing.
do $link$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'companies'
               and column_name = 'domain') then
    execute $v$
      create or replace view research.company_link as
        select rc.id            as research_company_id,
               rc.name          as research_name,
               rc.website,
               rc.domain,
               pc.id            as site_company_id,
               pc.name          as site_name,
               case
                 when pc.id is not null   then 'linked'
                 when rc.domain is null   then 'no_domain'
                 else                          'unlinked'
               end as link_state,
               (pc.name is not null and lower(pc.name) <> lower(rc.name)) as name_mismatch
        from research.companies rc
        left join public.companies pc on pc.domain = rc.domain
        order by link_state, rc.name;
    $v$;
    execute 'revoke all on research.company_link from anon, authenticated';
    raise notice 'research.company_link created.';
  else
    raise notice 'public.companies(domain) not found — skipped research.company_link. Run axionia-site migration 002 first.';
  end if;
end $link$;

-- Refresh queue
create or replace view research.research_freshness as
  select c.id, c.name, c.industry, c.last_researched, c.refresh_due,
         (c.refresh_due > now())                          as is_fresh,
         date_part('day', now() - c.last_researched)::int  as days_since_run,
         (select count(*) from research.research_runs r where r.company_id = c.id) as run_count
  from research.companies c
  order by c.refresh_due asc;


-- ============================================================
-- ROW-LEVEL SECURITY
-- Belt and braces on top of schema isolation: RLS on with zero
-- policies means even a mistaken grant exposes nothing. The
-- service role bypasses RLS, which is how the server writes.
-- ============================================================
alter table research.companies     enable row level security;
alter table research.research_runs enable row level security;
alter table research.radar_scores  enable row level security;
alter table research.benefit_gaps  enable row level security;

revoke all on all tables in schema research from anon, authenticated;


-- ============================================================
-- PROMOTE — research run → axionia-site delivery layer
--
-- Written against the LIVE site schema (axionia-site migrations
-- 002–007), not the original schema.sql. Four facts drive it:
--
--   1. public.companies is keyed on DOMAIN, not name. It is the
--      identity anchor for company-scoped RLS. A report with no
--      company_id is invisible to every client, forever — so
--      setting it is not optional, it IS the delivery mechanism.
--   2. reports.user_id is nullable as of 007, deliberately, so
--      research can exist before any user does. This function
--      must not require a user.
--   3. The admin queue reads report_requests. Without a row
--      there (origin='admin') a promoted report is invisible to
--      the admin UI too.
--   4. A refresh supersedes rather than overwrites — version and
--      supersedes_id maintain the audit chain.
--
-- Status is 'in_review', never 'ready'. Release stays a manual
-- act in the admin UI, which is also what fires the client email.
-- ============================================================
do $$
begin
  -- Guard on 002 (the tables) AND 007 (nullable user_id + origin column).
  -- Without 007 the function would compile but fail at runtime on the first
  -- user-less insert, which is worse than not installing it.
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'report_requests') then
    raise notice 'public.report_requests not found — skipped promote_research_to_report(). Run axionia-site migrations 002-007, then re-run this file.';
    return;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'report_requests'
                   and column_name = 'origin') then
    raise notice 'report_requests.origin missing — skipped promote_research_to_report(). Run axionia-site migration 007, then re-run this file.';
    return;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'reports'
               and column_name = 'user_id' and is_nullable = 'NO') then
    raise notice 'reports.user_id is still NOT NULL — skipped promote_research_to_report(). Run axionia-site migration 007, then re-run this file.';
    return;
  end if;

  execute $fn$
    create or replace function research.promote_research_to_report(
      p_run_id uuid,
      p_domain text default null,   -- overrides the domain derived from website
      p_title  text default null
    )
    returns uuid
    language plpgsql
    security definer set search_path = research, public
    as $body$
    declare
      v_report_id  uuid;
      v_request_id uuid;
      v_company_id uuid;
      v_name       text;
      v_website    text;
      v_payload    jsonb;
      v_summary    text;
      v_domain        text;
      v_stored_domain text;
      v_prior_id   uuid;
      v_version    int := 1;
      v_kind       public.request_kind := 'new';
    begin
      select c.name, c.website, c.domain, r.full_payload,
             r.scores ->> 'topOpportunity'
        into v_name, v_website, v_stored_domain, v_payload, v_summary
        from research.research_runs r
        join research.companies c on c.id = r.company_id
       where r.id = p_run_id;

      if v_name is null then
        raise exception 'research run % not found', p_run_id;
      end if;

      -- Explicit arg wins, then whatever the save path already resolved, then
      -- the website, then a placeholder. Same functions the save path uses.
      v_domain := coalesce(
        research.normalize_domain(p_domain),
        v_stored_domain,
        research.normalize_domain(v_website),
        research.placeholder_domain(v_name)
      );

      -- Aliased "pc": schema-qualified column refs are not valid in DO UPDATE.
      -- Existing name wins — the site may have a hand-corrected value.
      insert into public.companies as pc (domain, name)
      values (v_domain, v_name)
      on conflict (domain) do update
        set name = coalesce(pc.name, excluded.name)
      returning id into v_company_id;

      -- Version chain: a second run on the same company is a refresh.
      select id, version into v_prior_id, v_version
        from public.reports
       where company_id = v_company_id
       order by version desc
       limit 1;

      if v_prior_id is null then
        v_version := 1;
        v_kind    := 'new';
      else
        v_version := v_version + 1;
        v_kind    := 'refresh';
      end if;

      -- Queue row, so this appears in the admin UI alongside inbound work.
      -- No contact_email / user_id: 007 made both nullable for exactly this.
      insert into public.report_requests
        (user_id, company_id, contact_email, company_name, kind, status, origin, payload, admin_notes)
      values
        (null, v_company_id, null, v_name, v_kind, 'in_review', 'admin',
         jsonb_build_object('research_run_id', p_run_id, 'source', 'axionia-app pipeline'),
         'Generated by the Axionia Research Agent. Requires review before release.')
      returning id into v_request_id;

      insert into public.reports
        (user_id, company_id, request_id, title, status, content, summary, version, supersedes_id)
      values
        (null, v_company_id, v_request_id,
         coalesce(p_title, v_name || ' — Benefit Intelligence Report'),
         'in_review', v_payload, v_summary, v_version, v_prior_id)
      returning id into v_report_id;

      return v_report_id;
    end;
    $body$;
  $fn$;

  raise notice 'research.promote_research_to_report(run_id, domain, title) created.';
end $$;


-- ============================================================
-- VERIFY
-- ============================================================
select table_name, table_type
  from information_schema.tables
 where table_schema = 'research'
 order by table_type, table_name;

select 'Axionia research layer ready in schema "research"' as status;
