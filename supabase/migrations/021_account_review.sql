-- ============================================================
-- Axionia — migration 021: account review, and one grant narrowed
--
-- Signup abuse filled /admin/users with accounts that have random
-- names, random company strings and harvested-looking free-mail
-- addresses. They can't reach anything (see 020), but they bury
-- the real people in a list you're supposed to be able to scan.
--
-- NOTHING IS DELETED. Deleting an account destroys the evidence
-- of the abuse and risks taking a real person with it on a bad
-- guess. Hiding is reversible; deleting is not, and there is no
-- operational benefit to the irreversible version.
--
-- `review_state`, not `is_spam`. Three states because there are
-- genuinely three:
--
--   unreviewed  nobody has looked. The default, and the only one
--               that should ever be assigned automatically.
--   legitimate  a person confirmed this is real. Sticky — it
--               survives future sweeps, so a real client who
--               happens to look odd is never re-flagged.
--   spam        hidden from the working list, still in the table.
--
-- Deliberately NOT stored: "suspected". Whether an account looks
-- automated is derived at read time from signals that change —
-- verification status, age, whether they ever requested anything.
-- Freezing a guess into a column means the guess goes stale and
-- starts being treated as a fact.
--
-- Run AFTER 020. Safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists review_state text not null default 'unreviewed',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_review_state_check;

alter table public.profiles
  add constraint profiles_review_state_check
  check (review_state in ('unreviewed', 'legitimate', 'spam'));

-- The working query is "everyone who isn't hidden", so index for it.
create index if not exists profiles_review_state_idx
  on public.profiles(review_state)
  where review_state <> 'spam';

/*
  CRITICAL: review_state must NOT be added to the column grant from 020.
  It is a staff judgement about an account, and an account holder being able
  to edit it would be the same class of mistake 020 fixed — the grant there is
  exactly (full_name, company_name) and should stay exactly that.
*/


-- ────────────────────────────────────────────────────────────
-- Narrowing the leads UPDATE grant, defensively.
--
-- 019 granted table-wide UPDATE on leads to `authenticated`, held
-- back only by a policy requiring is_staff(). That is sound today
-- — unlike profiles, a client fails the USING clause. But it
-- leaves the same shape one policy edit away from a hole, and the
-- triage columns are the only ones anyone updates.
-- ────────────────────────────────────────────────────────────
revoke update on public.leads from authenticated;
grant update (handled_at, handled_by, handled_note) on public.leads to authenticated;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'profiles.review_state exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema='public' and table_name='profiles'
                  and column_name='review_state') as ok
union all
select 'account holders CANNOT set their own review_state',
       not has_column_privilege('authenticated', 'public.profiles', 'review_state', 'UPDATE')
union all
select 'role still locked (020 holding)',
       not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
union all
select 'leads update narrowed to triage columns',
       has_column_privilege('authenticated', 'public.leads', 'handled_at', 'UPDATE')
   and not has_column_privilege('authenticated', 'public.leads', 'email', 'UPDATE');
