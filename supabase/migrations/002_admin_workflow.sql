-- ============================================================
-- Axionia — migration 002: company layer, report requests,
-- file artifacts, email log, admin access.
--
-- Run AFTER schema.sql, once, in the Supabase SQL Editor.
-- Safe to re-run: every statement is guarded.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. COMPANIES
-- Identity is the email domain. Personal-email domains are
-- never allowed to become a company (see lib/company.ts) —
-- otherwise every gmail.com requester collapses into one org.
-- ────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  domain      text not null unique,
  name        text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists profiles_company_id_idx on public.profiles(company_id);


-- ────────────────────────────────────────────────────────────
-- 2. REPORT REQUESTS  — what the admin monitoring page reads
-- kind = 'new'     → first pull for this company
-- kind = 'refresh' → company already has a released report
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type public.request_status as enum ('new','in_review','ready','sent','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_kind as enum ('new','refresh');
exception when duplicate_object then null; end $$;

create table if not exists public.report_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  company_id     uuid references public.companies(id) on delete set null,
  contact_email  text not null,
  contact_name   text,
  company_name   text,
  kind           public.request_kind   not null default 'new',
  status         public.request_status not null default 'new',
  payload        jsonb not null default '{}'::jsonb,
  admin_notes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists report_requests_status_idx  on public.report_requests(status);
create index if not exists report_requests_company_idx on public.report_requests(company_id);
create index if not exists report_requests_user_idx    on public.report_requests(user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists report_requests_touch on public.report_requests;
create trigger report_requests_touch
  before update on public.report_requests
  for each row execute function public.touch_updated_at();


-- ────────────────────────────────────────────────────────────
-- 3. REPORTS — company scoping + version chain
-- A refresh supersedes the prior report rather than
-- overwriting it, so history stays auditable.
-- ────────────────────────────────────────────────────────────
alter table public.reports
  add column if not exists company_id    uuid references public.companies(id) on delete set null,
  add column if not exists request_id    uuid references public.report_requests(id) on delete set null,
  add column if not exists version       integer not null default 1,
  add column if not exists supersedes_id uuid references public.reports(id) on delete set null,
  add column if not exists summary       text;

create index if not exists reports_company_id_idx on public.reports(company_id);


-- ────────────────────────────────────────────────────────────
-- 4. REPORT FILES — artifacts in Supabase Storage
-- Answers "which files are already generated for this account."
-- ────────────────────────────────────────────────────────────
create table if not exists public.report_files (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid references public.reports(id)   on delete cascade,
  company_id    uuid references public.companies(id) on delete cascade,
  storage_path  text not null,
  filename      text not null,
  content_type  text,
  size_bytes    bigint,
  kind          text not null default 'report',
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists report_files_report_idx  on public.report_files(report_id);
create index if not exists report_files_company_idx on public.report_files(company_id);


-- ────────────────────────────────────────────────────────────
-- 5. EMAIL LOG — every automated send, for debugging silent failures
-- ────────────────────────────────────────────────────────────
create table if not exists public.email_log (
  id            uuid primary key default gen_random_uuid(),
  to_email      text not null,
  template      text not null,
  subject       text,
  status        text not null default 'sent',
  provider_id   text,
  error         text,
  request_id    uuid references public.report_requests(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists email_log_created_idx on public.email_log(created_at desc);


-- ────────────────────────────────────────────────────────────
-- 6. ADMIN HELPER
-- security definer so the policy can read profiles without
-- recursing through profiles' own RLS.
-- ────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ────────────────────────────────────────────────────────────
-- 7. RLS
-- ────────────────────────────────────────────────────────────
alter table public.companies      enable row level security;
alter table public.report_requests enable row level security;
alter table public.report_files   enable row level security;
alter table public.email_log      enable row level security;

-- Reports: released reports are visible to the requester AND to
-- anyone else at the same company. Drafts stay invisible.
drop policy if exists "reports_select_own_ready"     on public.reports;
drop policy if exists "reports_select_company_ready" on public.reports;
create policy "reports_select_company_ready"
  on public.reports for select
  using (
    status = 'ready'
    and (
      user_id = auth.uid()
      or (
        company_id is not null
        and company_id = (select company_id from public.profiles where id = auth.uid())
      )
    )
  );

-- Companies: readable by members of that company.
drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies for select
  using (id = (select company_id from public.profiles where id = auth.uid()));

-- Requests: a user can see their own requests (to check status).
drop policy if exists "requests_select_own" on public.report_requests;
create policy "requests_select_own"
  on public.report_requests for select
  using (user_id = auth.uid());

-- Files: visible only alongside a released report for your company.
drop policy if exists "report_files_select_company" on public.report_files;
create policy "report_files_select_company"
  on public.report_files for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_files.report_id
        and r.status = 'ready'
        and (
          r.user_id = auth.uid()
          or (
            r.company_id is not null
            and r.company_id = (select company_id from public.profiles where id = auth.uid())
          )
        )
    )
  );

-- Profiles: admins may read all profiles (needed for user management
-- when acting as the signed-in admin rather than the service role).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- email_log has no client-facing policy: service role only.


-- ────────────────────────────────────────────────────────────
-- 8. GRANTS
-- ────────────────────────────────────────────────────────────
grant select on public.companies       to authenticated;
grant select on public.report_requests to authenticated;
grant select on public.report_files    to authenticated;


-- ────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET for report artifacts (private)
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- No public storage policies: files are served through short-lived
-- signed URLs minted server-side after an access check.
