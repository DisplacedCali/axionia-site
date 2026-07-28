-- ============================================================
-- Axionia — Supabase schema + Row-Level Security
-- Run ONCE in the Supabase SQL Editor on a fresh project.
--
-- Updated from the original axionia_supabase_schema.md draft to add:
--   1. profiles.role (needed by the site's login/dashboard for role-aware access)
--   2. profiles.full_name / company_name auto-populated from signup metadata
--   3. public.leads — anon-insert-only table for the public site's contact form
--      (general contact, founding-member inquiries, on-prem inquiries)
--
-- Auth note: use email OTP CODES, not magic links. In Supabase Dashboard ->
-- Authentication -> Email Templates -> "Magic Link", replace the button/link
-- markup with the literal token: {{ .Token }}
-- This is required — magic links have previously been silently invalidated by
-- corporate/Google Workspace link-prefetch scanners (confirmed with Yale
-- Google Workspace) before the real recipient could click them. A typed code
-- has no clickable link for a scanner to consume.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES  (1:1 with auth.users)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  company_name text,
  role         text not null default 'client' check (role in ('client', 'admin')),
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up, pulling
-- full_name / company_name out of the signup metadata (see app/signup —
-- passed via supabase.auth.signInWithOtp({ options: { data: {...} } })).
-- so you never have a logged-in user without a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'company_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. INTAKE_RESPONSES
-- payload is jsonb: structured, AGGREGATE/de-identified intake
-- only. The form layer is the PHI firewall — never collect
-- member-level PHI here (see note at bottom).
-- ────────────────────────────────────────────────────────────
create table public.intake_responses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  payload      jsonb not null default '{}'::jsonb
);

create index intake_responses_user_id_idx on public.intake_responses(user_id);


-- ────────────────────────────────────────────────────────────
-- 3. REPORTS
-- status drives visibility: drafts stay invisible to the client
-- until you flip to 'ready'. content is jsonb so the 6-tab agent
-- output can be stored structured (swap to text if you'd rather
-- paste markdown).
-- ────────────────────────────────────────────────────────────
create type public.report_status as enum ('pending', 'in_review', 'ready');

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text,
  status       public.report_status not null default 'pending',
  content      jsonb,
  created_at   timestamptz not null default now(),
  released_at  timestamptz
);

create index reports_user_id_idx on public.reports(user_id);

-- Auto-stamp released_at the moment a report first becomes 'ready'.
create or replace function public.stamp_report_release()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ready' and (old.status is distinct from 'ready') then
    new.released_at = now();
  end if;
  return new;
end;
$$;

create trigger reports_release_stamp
  before update on public.reports
  for each row execute function public.stamp_report_release();


-- ────────────────────────────────────────────────────────────
-- 4. LEADS
-- Public-site contact/interest capture — no auth required.
-- Powers /contact, and the "Inquire about founding membership"
-- and "Contact us about on-prem" CTAs. Anonymous visitors may
-- INSERT only; they can never read leads back. You read/manage
-- leads from the Supabase dashboard (service role).
-- ────────────────────────────────────────────────────────────
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  full_name     text not null,
  email         text not null,
  company_name  text,
  interest      text not null default 'general'
                check (interest in ('general', 'founding-member', 'on-prem')),
  message       text
);


-- ============================================================
-- ROW-LEVEL SECURITY  (the spine — without this, every signed-in
-- user can read every client's data)
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.intake_responses enable row level security;
alter table public.reports          enable row level security;
alter table public.leads            enable row level security;

-- PROFILES: see / edit only your own
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INTAKE: submit and read only your own
create policy "intake_insert_own"
  on public.intake_responses for insert
  with check (auth.uid() = user_id);

create policy "intake_select_own"
  on public.intake_responses for select
  using (auth.uid() = user_id);

-- REPORTS: read only your own, and ONLY once released.
-- Pending / in_review rows are invisible to the client — the
-- premium "we'll release it when it's ready" signal, enforced
-- at the database, not just the UI.
create policy "reports_select_own_ready"
  on public.reports for select
  using (auth.uid() = user_id and status = 'ready');

-- LEADS: anonymous + authenticated visitors may submit; nobody
-- (other than the service role, which bypasses RLS) may read them
-- back through the API. This keeps the public contact form open
-- without exposing other people's inquiries.
create policy "leads_insert_anyone"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- Note: no policies are needed for YOUR admin work. The dashboard
-- uses the service role, which bypasses RLS entirely. You read
-- intake, create reports, manage leads, and flip report status there.
-- To promote a user to admin: update public.profiles set role = 'admin'
-- where email = '...' from the Supabase SQL editor (dashboard-only for now;
-- no admin UI yet — that's part of the broader application build).


-- ============================================================
-- POSTGREST ACCESS GRANTS
-- Required for projects created after 2026-05-30. Without these,
-- supabase-js calls can fail even with correct RLS. RLS still
-- governs WHICH rows; these grants govern table-level access for
-- the API roles.
-- (Confirm exact syntax against current Supabase docs if a call 401s.)
-- ============================================================
grant usage on schema public to authenticated, anon;
grant select, update            on public.profiles          to authenticated;
grant select, insert            on public.intake_responses  to authenticated;
grant select                    on public.reports           to authenticated;
grant insert                    on public.leads             to authenticated, anon;
