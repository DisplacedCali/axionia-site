-- ============================================================
-- Axionia — migration 028: a third audience (part 2 of 2)
--
-- RUN 027 FIRST, and let it commit. This file references
-- 'internal', which does not exist until that has landed.
--
-- Three changes.
--
-- 1. INTERNAL BECOMES THE DEFAULT. Every report was previously
--    born as 'summary' — a client-shaped document — and stayed
--    that way unless someone changed it. Defaulting to the
--    audience that cannot be released is the safer resting
--    state: the failure mode of the old default is a document
--    reaching someone before it was meant to, and the failure
--    mode of the new one is a moment's friction at release.
--
-- 2. `internal_only` ON SECTIONS. The pre-meeting brief is a
--    sales dossier — Conversation Hooks, Watch-Outs — written
--    about the reader. It must be excluded from every client
--    audience by RULE, not by sort order or by remembering.
--    A flag survives someone adding a section later; an
--    ordering convention does not.
--
-- 3. THE RESOLVER HONOURS BOTH. `report_visible_sections` is
--    the shared truth between the admin UI and the client
--    renderer (migration 010's whole point), so the exclusion
--    has to live here as well as in TypeScript or the two can
--    disagree — and the one that would be wrong is the one
--    facing the client.
--
-- Note the ordering inside the resolver: internal_only is
-- checked BEFORE the per-report `sections` override. An explicit
-- override must not be able to reveal the brief to a client,
-- because the whole point of the flag is that no setting can.
--
-- Run AFTER 027. Safe to re-run.
-- ============================================================

alter table public.report_sections
  add column if not exists internal_only boolean not null default false;

update public.report_sections
   set internal_only = true
 where id = 'brief';

-- The designed mix is free-tier by design — see SECTIONS in
-- lib/modules/research/report.ts for why it can be given away.
update public.report_sections
   set in_summary = true, sort_order = 35
 where id = 'designedMix';

alter table public.reports
  alter column client_view set default 'internal';


-- ────────────────────────────────────────────────────────────
-- Resolve which sections a given report shows.
--
-- internal_only wins over everything. Then the per-report
-- override. Then the audience default.
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
         case
           -- never reaches a client, at any setting
           when s.internal_only and r.client_view <> 'internal' then false
           else coalesce(
             (r.sections -> s.id)::boolean,
             case
               when r.client_view = 'internal' then true   -- everything
               when r.client_view = 'full'     then true   -- client, paid
               else s.in_summary                           -- client, free
             end
           )
         end as visible
    from public.report_sections s
    cross join public.reports r
   where r.id = p_report_id
   order by s.sort_order;
$$;

grant execute on function public.report_visible_sections(uuid) to authenticated, service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'internal_only column exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='report_sections'
                  and column_name='internal_only') as ok
union all
select 'the brief is internal-only',
       (select internal_only from public.report_sections where id = 'brief')
union all
select 'new reports default to internal',
       (select column_default like '%internal%' from information_schema.columns
         where table_schema='public' and table_name='reports'
           and column_name='client_view')
union all
select 'designed mix is free-tier and sits before regulatory',
       (select s1.in_summary and s1.sort_order < s2.sort_order
          from public.report_sections s1, public.report_sections s2
         where s1.id = 'designedMix' and s2.id = 'regulatory');
