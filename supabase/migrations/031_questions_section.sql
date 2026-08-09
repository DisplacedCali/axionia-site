-- ============================================================
-- Axionia — migration 031: the questions section
--
-- Registers `questions` in report_sections so the SQL resolver
-- and SECTIONS in report.ts list the same thing. 029 exists
-- because that pair drifted once already; an UPDATE against a
-- row that was never inserted is not an error in Postgres, so
-- the divergence was silent.
--
-- ── Why it sorts first ─────────────────────────────────────
--
-- The free report opened on a score and ended on two locked
-- boxes reading "ask about the full analysis". That tells a
-- reader what they don't get, which is absence rather than need,
-- and gives them nothing to do about it.
--
-- Questions they cannot answer create the need without asserting
-- anything about them — and a question cannot be factually wrong
-- the way an assertion can. Two runs of this report stated a
-- parent company that did not exist (HCSC, then Providence). The
-- part a reader now hits first carries no fabrication risk at
-- all, because it makes no claims.
--
-- Free tier: this is the section most likely to earn a reply,
-- and withholding the problem framing while giving away the
-- compliance detail is exactly the balance that wasn't working.
--
-- Run AFTER 030. Safe to re-run.
-- ============================================================

insert into public.report_sections
  (id, label, sort_order, in_summary, internal_only, description)
values
  ('questions',
   'Questions Worth Asking',
   5,
   true,
   false,
   'Problem framing as questions the report cannot answer from outside. Derived from the axis scores, never model-generated — a question is the one part of this document that cannot be wrong about a fact.')
on conflict (id) do update
  set label         = excluded.label,
      sort_order    = excluded.sort_order,
      in_summary    = excluded.in_summary,
      internal_only = excluded.internal_only,
      description   = excluded.description;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'questions row exists' as check,
       exists (select 1 from public.report_sections where id = 'questions') as ok
union all
select 'it sorts before the scorecard',
       (select q.sort_order < s.sort_order
          from public.report_sections q, public.report_sections s
         where q.id = 'questions' and s.id = 'scorecard')
union all
select 'it is free-tier',
       (select in_summary and not internal_only
          from public.report_sections where id = 'questions')
union all
select 'nine sections, matching SECTIONS in report.ts',
       (select count(*) = 9 from public.report_sections)
union all
select 'free-tier order is questions, scorecard, findings, profile, mix, regulatory',
       (select string_agg(id, ' → ' order by sort_order) =
               'questions → scorecard → findings → profile → designedMix → regulatory'
          from public.report_sections where in_summary and not internal_only);
