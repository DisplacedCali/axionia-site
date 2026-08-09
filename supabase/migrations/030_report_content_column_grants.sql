-- ============================================================
-- Axionia — migration 030: withheld should mean inaccessible
--
-- ── The hole ────────────────────────────────────────────────
--
-- `reports_select_company_ready` gates ROWS: released only, and
-- only for the requester or someone at the same company. It says
-- nothing about COLUMNS, and PostgREST returns whatever columns
-- the caller asks for.
--
-- So a client with a released report could call the API with
-- their own session token and select `content` — the entire
-- research blob. That includes `brief`, which the synthesis step
-- writes as an INTERNAL pre-meeting document: Conversation Hooks
-- and Watch-Outs, about the reader. It also includes every
-- section withheld at their tier.
--
-- Section visibility was presentational. `client_view` decided
-- what got RENDERED, never what could be READ. Nothing has
-- leaked, because it needs someone to deliberately query the API
-- rather than use the page — but "nobody has bothered" is not an
-- access control.
--
-- ── Why grants rather than a filtering function ─────────────
--
-- The obvious alternative is a security-definer function that
-- strips non-visible sections from the jsonb before returning
-- it. Rejected: `content`'s keys do not map one-to-one onto
-- section ids — scorecard comes from `scores`, findings are
-- derived, designedMix and benefitDesign both live inside
-- `workforceData` — and that mapping already exists, once, in
-- assembleReport(). Reimplementing it in SQL would create two
-- definitions of what a section contains, and the one that
-- drifts would be the one facing the client. Exactly the
-- divergence report_sections exists to prevent.
--
-- ── Why this keeps the guarantee in the database ────────────
--
-- app/reports/[id]/page.tsx documents its own rule: authorisation
-- is the database's job, not TypeScript's. That still holds. The
-- page now reads the SAFE columns through the anon client — and
-- that read IS the authorisation check, performed by the existing
-- RLS policy. If the policy says no, no row comes back and the
-- page 404s before anything touches the service role. Only after
-- the database has said yes does the server fetch `content`.
--
-- One policy, one definition, and the payload never leaves the
-- server unfiltered.
--
-- ── The Postgres detail that makes this necessary ───────────
--
-- Column-level grants do not narrow a table-level grant. Holding
-- SELECT on the table means SELECT on every column, so the
-- table-level grant has to be revoked first and the permitted
-- columns granted back explicitly. Getting this backwards leaves
-- the hole open while looking like it closed it.
--
-- Run AFTER 029. Safe to re-run.
-- ============================================================

revoke select on public.reports from anon, authenticated;

-- Everything except `content` and `edits`. Enumerated rather than
-- expressed as an exclusion, so a column added later is withheld
-- by default and has to be let out on purpose.
grant select (
  id,
  user_id,
  company_id,
  request_id,
  title,
  summary,
  status,
  version,
  supersedes_id,
  client_view,
  sections,
  research_run_id,
  reviewed_at,
  reviewed_by,
  released_at,
  created_at
) on public.reports to anon, authenticated;

-- service_role is server-only and already bypasses RLS; it needs
-- the whole row to assemble a report. Restated because the
-- revoke above is table-wide.
grant select on public.reports to service_role;


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
select 'authenticated cannot read content' as check,
       not has_column_privilege('authenticated', 'public.reports', 'content', 'SELECT') as ok
union all
select 'authenticated cannot read edits',
       not has_column_privilege('authenticated', 'public.reports', 'edits', 'SELECT')
union all
select 'anon cannot read content',
       not has_column_privilege('anon', 'public.reports', 'content', 'SELECT')
union all
select 'authenticated can still read title (the dashboard)',
       has_column_privilege('authenticated', 'public.reports', 'title', 'SELECT')
union all
select 'authenticated can still read status (the RLS check)',
       has_column_privilege('authenticated', 'public.reports', 'status', 'SELECT')
union all
select 'service_role can still read content',
       has_column_privilege('service_role', 'public.reports', 'content', 'SELECT');
