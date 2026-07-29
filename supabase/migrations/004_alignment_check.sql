-- ============================================================
-- Axionia — migration 004: requester / subject alignment
--
-- Flags requests where the company someone asked us to research
-- doesn't plausibly match the email domain they asked from —
-- the shape of a broker researching a prospect, or someone
-- pulling competitive intelligence on a rival.
--
-- Nothing is blocked automatically. A flagged request routes to
-- a human, who either clears it or restricts it.
--
-- Run AFTER 003. Safe to re-run.
-- ============================================================

do $$ begin
  create type public.alignment_status as enum (
    'matched',     -- company name resembles the email domain
    'review',      -- mismatch — needs a human look
    'cleared',     -- admin confirmed the affiliation is legitimate
    'restricted'   -- admin declined the request on alignment grounds
  );
exception when duplicate_object then null; end $$;

alter table public.report_requests
  add column if not exists alignment public.alignment_status not null default 'matched',
  add column if not exists alignment_reason text,
  add column if not exists alignment_note text;

create index if not exists report_requests_alignment_idx
  on public.report_requests(alignment);
