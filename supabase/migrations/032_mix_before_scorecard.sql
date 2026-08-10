-- ============================================================
-- Axionia — migration 032: the map before the radar
--
-- Moves `designedMix` from sort_order 35 to 7, ahead of the
-- scorecard, keeping report_sections in step with SECTIONS in
-- lib/modules/research/report.ts.
--
-- ── Why the order is an argument ────────────────────────────
--
-- The 2x2 is the LANDSCAPE: what the options are, and where each
-- sits on cost against what employees actually feel. The radar is
-- THIS EMPLOYER'S POSITION. Landscape first, then position on it
-- — a score means more once a reader knows what it is being
-- measured against, and the map establishes that in one glance.
--
-- It also settles an earlier complaint properly. The mix was the
-- last substantive thing in the document; reordering it behind
-- regulatory didn't fix that, because regulatory was long. Ahead
-- of the score it becomes the first thing read after the
-- questions — which is the right weight for the half of the
-- product that proposes rather than grades.
--
-- Run AFTER 031. Safe to re-run.
-- ============================================================

update public.report_sections
   set sort_order = 7
 where id = 'designedMix';


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'the map sorts before the radar' as check,
       (select m.sort_order < s.sort_order
          from public.report_sections m, public.report_sections s
         where m.id = 'designedMix' and s.id = 'scorecard') as ok
union all
select 'questions still open the report',
       (select q.sort_order < m.sort_order
          from public.report_sections q, public.report_sections m
         where q.id = 'questions' and m.id = 'designedMix')
union all
select 'free-tier reading order',
       (select string_agg(id, ' → ' order by sort_order) =
               'questions → designedMix → scorecard → findings → profile → regulatory'
          from public.report_sections where in_summary and not internal_only)
union all
select 'nine sections, matching report.ts',
       (select count(*) = 9 from public.report_sections);
