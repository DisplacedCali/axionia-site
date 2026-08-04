-- ============================================================
-- Axionia — migration 016: identity confirmation gate (part 1 of 2)
--
-- RUN THIS FILE ALONE, THEN RUN 017. That split is not stylistic.
-- `alter type ... add value` cannot be used in the same
-- transaction that adds it, and the Supabase SQL editor wraps a
-- whole submission in one transaction — so an index referencing
-- the new value in this file fails with:
--
--   55P04: unsafe use of new value "awaiting_confirmation"
--   HINT: New enum values must be committed before they can be used.
--
-- 017 is that index, in its own file, for exactly this reason.
--
-- ── Why the gate exists ─────────────────────────────────────
--
-- The pipeline runs ten model calls across seven waves. Wave 1
-- is `validate` alone: who is this company, what industry, what
-- size. Every one of the remaining nine calls reads that answer.
--
-- A live run analysed WIN — a fertility and family-building
-- vendor — as a behavioral health employer. The mistake was made
-- at call two and faithfully inherited by the other eight. The
-- report was not wrong at the end; it was wrong at the start and
-- internally consistent about a fiction thereafter. Commenting
-- could not fix it, because the revise agent edits wording and
-- this was a premise.
--
-- So the job now stops after wave 1 and waits for a human to
-- ratify or correct the identity before the rest runs.
--
-- Two decisions.
--
-- 1. A NEW STATUS rather than reusing 'paused'. 'paused' means
--    "between waves, resume when polled". This means "will not
--    proceed until a person acts". Overloading one enum value
--    with both would make every query that distinguishes them
--    read the steps jsonb to find out which it meant.
--
-- 2. NO NEW COLUMNS. The confirmation and any corrections live
--    in the existing `steps` jsonb on the validate entry:
--      steps.validate.output        the values downstream reads
--      steps.validate.modelOutput   what the model originally said
--      steps.validate.confirmedAt   when a human ratified it
--      steps.validate.confirmedBy   who
--    Keeping the model's original beside the correction is the
--    same principle as reports.content vs reports.edits: the
--    correction must never erase what it corrected.
--
-- Run AFTER 015. Safe to re-run.
-- ============================================================

alter type research.job_status add value if not exists 'awaiting_confirmation';


-- ────────────────────────────────────────────────────────────
-- VERIFY  (safe here: this only reads the catalog, it does not
-- use the new value as a literal)
-- ────────────────────────────────────────────────────────────
select 'awaiting_confirmation in job_status' as check,
       exists (
         select 1
           from pg_enum e
           join pg_type t on t.oid = e.enumtypid
          where t.typname = 'job_status'
            and e.enumlabel = 'awaiting_confirmation'
       ) as ok
union all
select 'now run 017 — do not deploy before it',
       true;
