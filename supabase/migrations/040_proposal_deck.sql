-- ============================================================
-- Axionia — migration 040: the proposal deck joins deck_versions
--
-- 026 built one company-specific-deck mechanism and scoped its check
-- constraint to the two decks that existed then. The proposal deck is
-- a third: same override-not-copy shape (decision 1), same
-- generated/edits split (decision 2), same draft-until-approved gate
-- enforced by the URL (decision 3), same source_report_id leash
-- (decision 4). Nothing about the mechanism changes — this migration
-- only widens the constraint that was naming the first two decks by
-- hand.
--
-- What's different about this deck is what it carries. Buyer and
-- founders customise a slide of prose from a completed report.
-- Proposal customises almost nothing — a client name — because its
-- one real variable, price, is deliberately NOT stored here.
-- /deck/proposal reads it live from companies.founding_cohort and
-- companies.fee_rate (039) at render time. Storing a price on the
-- version would create a second place a number could go stale
-- against the Terms panel, which is the one place Tom actually edits
-- it. See lib/deck/proposalCustom.ts.
--
-- Run AFTER 039. Safe to re-run.
-- ============================================================

alter table public.deck_versions drop constraint if exists deck_versions_deck_check;
alter table public.deck_versions
  add constraint deck_versions_deck_check
  check (deck in ('buyer', 'founders', 'proposal'));

-- 'founders' stays in the list even though nothing mints a founders
-- deck_versions row today — narrowing to ('buyer', 'proposal') would
-- be a silent behavior change for a deck this migration has no
-- opinion about, for a few bytes of constraint text saved.

comment on constraint deck_versions_deck_check on public.deck_versions is
  'buyer and founders tailor slide copy from a report; proposal tailors '
  'a client name and reads its price live from companies.founding_cohort '
  '/ fee_rate (039) rather than storing one here. investor has no '
  'per-company version and does not appear in this constraint.';

-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'proposal is an allowed deck value' as check,
       exists (
         select 1
         from pg_constraint
         where conname = 'deck_versions_deck_check'
           and pg_get_constraintdef(oid) like '%proposal%'
       ) as ok;
