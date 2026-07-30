-- ============================================================
-- Axionia — migration 010: report body, edit layer, client view
--
-- The free report has no artifact to upload, so the report body
-- has to live in the database and be rendered. Until now
-- upsertDraftReport only wrote title and summary; reports.content
-- existed but nothing populated it.
--
-- Three ideas here.
--
-- 1. content is IMMUTABLE. It holds exactly what the pipeline
--    produced. Never edited in place.
--
-- 2. edits is a separate overlay, applied at render time. So
--    every correction is reversible, and you can always see what
--    the model actually said versus what you fixed. That matters
--    beyond convenience: "we tell you what we think, but we
--    expose the entire model" is the product's stated principle,
--    and silently overwriting model output would quietly break
--    it. It also means a hallucination you caught stays visible
--    as a caught hallucination rather than disappearing.
--
-- 3. client_view decides what the client sees from the SAME
--    payload. One research run, two renderings — you always see
--    the full thing, they see the summary unless you decide
--    otherwise. Avoids maintaining a second product.
--
-- Run AFTER 009. Safe to re-run.
-- ============================================================

-- Which rendering the client gets. Admin always sees 'full'.
do $$ begin
  create type public.report_view as enum ('summary', 'full');
exception when duplicate_object then null; end $$;

alter table public.reports
  -- Provenance: which research run produced this. Nullable because a
  -- report can still be assembled by hand with an uploaded artifact.
  add column if not exists research_run_id uuid,

  -- Admin overrides, layered over content at render.
  -- Shape: { "scores": { "cfoEngagement": 62, ... },
  --          "narrative": { "summary": "...", "brief": "...",
  --                         "findings": ["...", "..."] },
  --          "editedAt": "...", "editedBy": "<uuid>" }
  add column if not exists edits jsonb not null default '{}'::jsonb,

  -- What the client sees. Free tier defaults to summary.
  add column if not exists client_view public.report_view not null default 'summary',

  -- Per-section visibility, so a report can be tuned per client.
  -- Absent key = use the client_view default for that section.
  -- Shape: { "workforce": false, "benefitDesign": false, "regulatory": true }
  add column if not exists sections jsonb not null default '{}'::jsonb,

  -- Set when a human has actually reviewed the output. Guards against
  -- releasing raw model output, which the product's credibility depends on.
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

create index if not exists reports_research_run_idx on public.reports(research_run_id);
create index if not exists reports_client_view_idx  on public.reports(client_view);


-- ────────────────────────────────────────────────────────────
-- Which sections exist, and which are free by default.
--
-- Kept in the database rather than only in TypeScript so the
-- free/paid boundary is inspectable in SQL — it's a commercial
-- boundary, not a rendering detail.
-- ────────────────────────────────────────────────────────────
create table if not exists public.report_sections (
  id           text primary key,
  label        text not null,
  sort_order   integer not null,
  in_summary   boolean not null default false,
  description  text
);

insert into public.report_sections (id, label, sort_order, in_summary, description) values
  ('scorecard',     'Readiness Scorecard',   10, true,
   'Eight-axis radar, overall score and band. The headline.'),
  ('findings',      'Key Findings',          20, true,
   'Three to five findings with the top opportunity and urgency signal.'),
  ('profile',       'Company Profile',       30, true,
   'Workforce composition, business model, ownership, HR characteristics.'),
  ('regulatory',    'Regulatory Exposure',   40, true,
   'State mandates, with self-insured reach called out. Concrete and verifiable, so it belongs in the free tier.'),
  ('workforce',     'Workforce Intelligence',50, false,
   'Segment-level retention risk and replacement complexity. Paid: this is the modelling insight.'),
  ('benefitDesign', 'Benefit Design',        60, false,
   'Prioritised prescription per segment with gap analysis and vendors. Paid: the actual prescription.'),
  ('brief',         'Pre-Meeting Brief',     70, false,
   'Internal, opinionated. Not client-facing by default.')
on conflict (id) do update
  set label       = excluded.label,
      sort_order  = excluded.sort_order,
      in_summary  = excluded.in_summary,
      description = excluded.description;

-- Reference data. Readable by any signed-in user so the UI can
-- explain what's behind the paywall without a round trip.
alter table public.report_sections enable row level security;

drop policy if exists "report_sections_read_all" on public.report_sections;
create policy "report_sections_read_all"
  on public.report_sections for select
  using (true);

grant select on public.report_sections to authenticated, anon;
grant all privileges on public.report_sections to service_role;


-- ────────────────────────────────────────────────────────────
-- Resolve which sections a given report shows.
-- sections overrides win; otherwise fall back to the client_view
-- default. Kept in SQL so admin UI and client renderer cannot
-- disagree about what is visible.
-- ────────────────────────────────────────────────────────────
create or replace function public.report_visible_sections(p_report_id uuid)
returns table (id text, label text, sort_order integer, visible boolean)
language sql
stable
security definer set search_path = public
as $$
  select s.id,
         s.label,
         s.sort_order,
         coalesce(
           (r.sections -> s.id)::boolean,          -- explicit per-report override
           case when r.client_view = 'full' then true else s.in_summary end
         ) as visible
    from public.report_sections s
    cross join public.reports r
   where r.id = p_report_id
   order by s.sort_order;
$$;

grant execute on function public.report_visible_sections(uuid) to authenticated, service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'reports.edits exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='reports' and column_name='edits') as ok
union all
select 'reports.client_view exists',
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='reports' and column_name='client_view')
union all
select 'reports.content exists (body storage)',
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='reports' and column_name='content')
union all
select 'report_sections seeded (7 rows)',
       (select count(*) = 7 from public.report_sections)
union all
select 'four sections are free by default',
       (select count(*) = 4 from public.report_sections where in_summary)
union all
select 'service_role can update reports',
       has_table_privilege('service_role','public.reports','UPDATE');
