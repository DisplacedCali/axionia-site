-- ============================================================
-- Axionia — migration 027: a third audience (part 1 of 2)
--
-- RUN THIS FILE ALONE, THEN RUN 028. Same reason as 016/017:
-- `alter type ... add value` cannot be used in the same
-- transaction that adds it, and the Supabase SQL editor wraps a
-- submission in one transaction. Anything referencing 'internal'
-- in this file fails with:
--
--   55P04: unsafe use of new value "internal"
--
-- 028 is everything that uses it.
--
-- ── Why a third value ───────────────────────────────────────
--
-- `report_view` has meant two things at once. 'summary' is the
-- free client report. 'full' has been both "the complete paid
-- client report" AND "the internal research file" — and those
-- must never be the same document.
--
-- The pipeline's synthesis step opens with "Write a sharp
-- INTERNAL pre-meeting brief" and produces sections called
-- Conversation Hooks and Watch-Outs. That is a sales dossier
-- about how to approach the reader. Under the old resolution
-- rule — `client_view = 'full' → show everything` — setting a
-- paying client to 'full' would hand it to them.
--
-- Nothing has leaked, because 'full' has never been used for a
-- client. That is luck rather than design, and luck is not a
-- control.
--
-- After 028:
--   internal  everything, including the brief. The new DEFAULT.
--   summary   client, free tier
--   full      client, paid tier
--
-- Names kept rather than renamed: renaming enum values means
-- rewriting every existing row and every reference, to fix a
-- vocabulary problem that a comment solves.
--
-- Run AFTER 026. Safe to re-run.
-- ============================================================

do $$
begin
  if not exists (
    select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
     where t.typname = 'report_view'
       and e.enumlabel = 'internal'
  ) then
    alter type public.report_view add value 'internal';
  end if;
end $$;


-- ────────────────────────────────────────────────────────────
-- VERIFY — run this after the statement above has committed.
-- ────────────────────────────────────────────────────────────
select 'internal is a valid report_view' as check,
       exists (
         select 1
           from pg_enum e
           join pg_type t on t.oid = e.enumtypid
          where t.typname = 'report_view'
            and e.enumlabel = 'internal'
       ) as ok;
