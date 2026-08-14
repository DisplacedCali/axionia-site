-- ============================================================
-- Axionia — migration 036: how far they got, and what a
--                          "download" actually counted
--
-- Two faults in the deck log, both of which make the numbers on
-- /admin/decks say something other than what they appear to say.
--
-- ── 1. DEPTH ──
--
-- deck_events had two event kinds, view and print. So someone who
-- opened the investor deck, read the title slide and closed the
-- tab produced exactly the same row as someone who read all
-- thirteen. At the moment the question is "who is paying
-- attention", those are the two answers that most need telling
-- apart, and the schema could not tell them apart at all.
--
-- max_slide and total_slides record the furthest slide reached.
-- Both are stored because deck length changes: 9/13 read against
-- a thirteen-slide deck means something different from 9/13 after
-- four slides are cut, and a percentage computed at write time
-- would lose the ability to say which deck was being measured.
--
-- The 'progress' event kind carries them. A progress row is not
-- an access — it is a revision of what a view already recorded —
-- so it is excluded from the activity feed and from the open
-- counts, and read only as MAX(max_slide) per session.
--
-- ── 2. SESSION ID, AND WHY IT IS NOT A NEW IDENTIFIER ──
--
-- Progress rows are useless without something to attach them to.
-- session_id is the SAME opaque first-party value site_events
-- already stores — the ax_sid cookie minted in lib/analytics.ts.
-- Nothing new is collected: a deck open was already being logged
-- and the cookie was already being set, and this only writes down
-- which of the two it belonged to.
--
-- What it buys beyond depth is the stitch. A deck open and the
-- six marketing pages read on the way to it now share a key, so
-- "they read /pricing twice and then opened the investor deck" is
-- answerable. That was the entire argument for first-party
-- analytics in 014 and the deck log was the one thing standing
-- outside it.
--
-- STILL NO IP COLUMN. 012 and 014 said this and /privacy now
-- commits to it publicly, so adding one is a policy change rather
-- than a migration. Coarse geography is not added here either;
-- the deck log has never had it and adding it alongside a depth
-- fix would bury the decision.
--
-- ── 3. 'request' — WHAT A DOWNLOAD COUNT WAS COUNTING ──
--
-- requestDeckDownload writes a print row when someone ASKS for
-- the emailed link, deliberately, so that a person who asks and
-- never clicks is not lost. Clicking the link and printing then
-- writes a second print row. One download journey, two rows —
-- and the "N downloads" figure on /admin/decks counted both, so
-- every verified download was reported twice while every
-- unanswered request was reported as a download.
--
-- 'request' separates them. A request is an ask; a print is the
-- file leaving. The pair is more informative than either: a
-- request with no print behind it is someone who wanted it and
-- did not follow through, which is a different conversation from
-- someone who has the PDF.
--
-- Existing rows are backfilled by a discriminator that is exact
-- rather than approximate — see the UPDATE.
--
-- Run AFTER 035. Safe to re-run.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. COLUMNS
-- ────────────────────────────────────────────────────────────
alter table public.deck_events
  add column if not exists session_id   text,
  add column if not exists max_slide    smallint,
  add column if not exists total_slides smallint;


-- ────────────────────────────────────────────────────────────
-- 2. EVENT KINDS
--
-- Dropped and recreated rather than altered: a check constraint
-- has no ALTER that widens it.
--
-- Dropped BY DISCOVERY rather than by name. 012 declared the
-- check inline, so the name is whatever Postgres generated, and
-- a hard-coded `drop constraint if exists deck_events_event_check`
-- would silently no-op against a database where it came out
-- differently — leaving the old constraint in place beside the
-- new one, so every 'progress' insert fails and depth quietly
-- never records. A migration that half-applies without saying so
-- is the failure worth spending eight lines to prevent.
-- ────────────────────────────────────────────────────────────
do $$
declare c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.deck_events'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%event%'
  loop
    execute format('alter table public.deck_events drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.deck_events
  add constraint deck_events_event_check
  check (event in ('view', 'print', 'progress', 'request'));


-- ────────────────────────────────────────────────────────────
-- 3. BACKFILL THE REQUESTS
--
-- The discriminator is user_agent, and it is exact rather than a
-- guess. Every print row written by logDeckPrint passes through
-- log(), which reads the request headers and always stores a
-- user_agent — a browser that sends none is not a browser that
-- reached a server action. requestDeckDownload inserts directly
-- against deck_events and sets neither header column, because it
-- is recording an intention rather than a page load.
--
-- So: a print with an email, no user_agent and no referrer was
-- written by the request path, and nothing else writes that
-- shape. Rows predating the emailed-link gate had a user_agent
-- and are left alone.
-- ────────────────────────────────────────────────────────────
update public.deck_events
   set event = 'request'
 where event = 'print'
   and contact_email is not null
   and user_agent is null
   and referrer is null
   and user_id is null;


-- ────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ────────────────────────────────────────────────────────────

-- The grouping key for depth, and the join back to site_events.
create index if not exists deck_events_session_idx
  on public.deck_events(session_id)
  where session_id is not null;

-- Depth is read as a MAX per session and never scanned whole.
create index if not exists deck_events_progress_idx
  on public.deck_events(session_id, max_slide desc)
  where event = 'progress';

-- The activity feed and every count exclude progress rows, which
-- will outnumber real events roughly three to one once logging is
-- live. A partial index keeps that exclusion off a sequential
-- scan as the table grows.
create index if not exists deck_events_access_idx
  on public.deck_events(created_at desc)
  where event <> 'progress';


-- ────────────────────────────────────────────────────────────
-- 5. VERIFY
--
-- The backfill count is reported rather than asserted: zero is
-- the correct answer on a database where nobody has requested a
-- download yet, and a non-zero number is worth reading once.
-- ────────────────────────────────────────────────────────────
select 'depth columns exist' as check,
       (select count(*) = 3 from information_schema.columns
         where table_schema = 'public'
           and table_name = 'deck_events'
           and column_name in ('session_id', 'max_slide', 'total_slides'))::text as ok
union all
select 'progress and request accepted',
       (select pg_get_constraintdef(oid) like '%progress%request%'
          from pg_constraint where conname = 'deck_events_event_check')::text
union all
select 'rows reclassified as request',
       (select count(*)::text from public.deck_events where event = 'request')
union all
select 'still no ip column (intentional)',
       (not exists (select 1 from information_schema.columns
                     where table_schema = 'public'
                       and table_name in ('deck_events', 'site_events', 'report_events')
                       and column_name in ('ip', 'ip_address')))::text
union all
select 'rls still on',
       (select relrowsecurity::text from pg_class where relname = 'deck_events');
