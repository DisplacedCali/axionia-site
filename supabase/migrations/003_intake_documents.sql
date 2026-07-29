-- ============================================================
-- Axionia — migration 003: document intake
--
-- Lets a requester attach the materials they already have —
-- vendor decks, renewal packets, benefit summaries — so the
-- analysis starts from real documents rather than a form.
--
-- SCOPE LIMIT, deliberate: aggregate/document-level material
-- only. Member-level claims ingestion is NOT enabled here.
-- That requires the PHI firewall (schema-tolerant ingestion
-- that rejects PHI before persistence) to exist first —
-- without it, accepting claims files would pull Axionia into
-- HIPAA scope and require a BAA.
--
-- Run AFTER 002. Safe to re-run.
-- ============================================================

alter table public.report_files
  add column if not exists request_id uuid
    references public.report_requests(id) on delete cascade;

create index if not exists report_files_request_idx
  on public.report_files(request_id);

-- report_id is only set once a draft report exists; intake documents
-- arrive before that, so it must be nullable.
alter table public.report_files
  alter column report_id drop not null;

-- Clients may see the documents they themselves uploaded.
drop policy if exists "report_files_select_own_intake" on public.report_files;
create policy "report_files_select_own_intake"
  on public.report_files for select
  using (
    request_id is not null
    and exists (
      select 1 from public.report_requests r
      where r.id = report_files.request_id
        and r.user_id = auth.uid()
    )
  );
