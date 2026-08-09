-- ============================================================
-- Axionia — migration 029: register the designed mix section
--
-- A miss in 028, caught by reading the live schema.
--
-- `designedMix` was added to SECTIONS in
-- lib/modules/research/report.ts and never inserted into
-- public.report_sections. 028 tried to set its sort order with
-- an UPDATE, which silently did nothing because there was no row
-- to update.
--
-- That matters because `report_visible_sections()` JOINS this
-- table. TypeScript knew about the section and Postgres did not,
-- so the two disagreed about what a report contains — which is
-- the exact failure migration 010 created this table to prevent:
--
--   "Kept in SQL so admin UI and client renderer cannot disagree
--    about what is visible."
--
-- An UPDATE that matches no rows is not an error in Postgres, so
-- nothing failed and nothing warned. The lesson worth keeping:
-- when a migration adds a section, it INSERTs. Use upsert so the
-- statement is idempotent rather than order-dependent.
--
-- Run AFTER 028. Safe to re-run.
-- ============================================================

insert into public.report_sections
  (id, label, sort_order, in_summary, internal_only, description)
values
  ('designedMix',
   'A Mix Built for This Workforce',
   35,
   true,
   false,
   'A mix designed from workforce shape alone, with what is surprising about it. Free tier: it gives away the shape of an answer without giving away what the client actually runs, what it costs, or the cross-segment allocation.')
on conflict (id) do update
  set label         = excluded.label,
      sort_order    = excluded.sort_order,
      in_summary    = excluded.in_summary,
      internal_only = excluded.internal_only,
      description   = excluded.description;


-- ────────────────────────────────────────────────────────────
-- VERIFY — TS and SQL must now list the same sections.
-- ────────────────────────────────────────────────────────────
select 'designedMix row exists' as check,
       exists (select 1 from public.report_sections where id = 'designedMix') as ok
union all
select 'it is free-tier',
       (select in_summary and not internal_only
          from public.report_sections where id = 'designedMix')
union all
select 'it sorts before regulatory',
       (select s1.sort_order < s2.sort_order
          from public.report_sections s1, public.report_sections s2
         where s1.id = 'designedMix' and s2.id = 'regulatory')
union all
select 'eight sections, matching SECTIONS in report.ts',
       (select count(*) = 8 from public.report_sections)
union all
select 'only the brief is internal-only',
       (select array_agg(id order by id) = array['brief']
          from public.report_sections where internal_only);
