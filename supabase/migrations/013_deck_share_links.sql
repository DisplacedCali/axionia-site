-- ============================================================
-- Axionia — migration 013: share-link labels on deck events
--
-- A separate file rather than an edit to 012, on principle: 012
-- may already be applied, and editing an applied migration means
-- the file and the database disagree with nobody able to tell.
-- One column is not worth breaking that rule for.
--
-- The founders deck is reachable two ways — a staff session, or a
-- signed link minted for a named recipient. link_label records
-- which recipient's link was used, so "who opened the $250K deck,
-- and how many times" is answerable without an IP address.
--
-- The label is written server-side after the signature verifies.
-- It cannot be set by the caller: a forged label would mean a
-- forged signature, which is the thing the HMAC prevents.
--
-- Run AFTER 012. Safe to re-run.
-- ============================================================

alter table public.deck_events
  add column if not exists link_label text;

create index if not exists deck_events_link_label_idx
  on public.deck_events(link_label)
  where link_label is not null;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'link_label exists' as check,
       exists (select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'deck_events'
                  and column_name = 'link_label') as ok
union all
select 'still no ip column (intentional)',
       not exists (select 1 from information_schema.columns
                    where table_schema = 'public'
                      and table_name = 'deck_events'
                      and column_name in ('ip', 'ip_address'));
