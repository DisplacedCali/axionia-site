-- ============================================================
-- Axionia — migration 020: close privilege escalation on profiles
--
-- ** APPLY THIS BEFORE ANYTHING ELSE. **
--
-- schema.sql granted table-wide UPDATE on public.profiles to the
-- `authenticated` role and paired it with:
--
--   create policy "profiles_update_own"
--     on public.profiles for update
--     using (auth.uid() = id) with check (auth.uid() = id);
--
-- That policy restricts which ROW you may update. It cannot
-- restrict which COLUMNS — Postgres RLS has no column clause;
-- column-level control is a GRANT, and the grant was table-wide.
--
-- So any signed-in user could run, with nothing but the public
-- anon key from a browser console:
--
--   supabase.from('profiles').update({ role: 'owner' })
--           .eq('id', <their own id>)
--
-- and pass both USING and WITH CHECK, because the row is theirs.
--
-- Two escalations through one grant:
--
-- 1. ROLE. is_staff() reads profiles.role, and requireStaff /
--    requireRelease / requireOwner all trust it. Self-promotion to
--    'owner' hands over the entire admin surface — every client's
--    reports, the lead queue, release, and role assignment.
--
-- 2. COMPANY. reports_select_company_ready grants read on a
--    released report when the reader's profiles.company_id matches.
--    Setting your own company_id to a target's id reads that
--    employer's analysis, with no role change needed at all.
--
-- Nothing in the application ever used this grant. Every profile
-- write goes through the service role in a server action; the
-- client only ever SELECTs. The capability was pure exposure.
--
-- The fix is a column-scoped grant, not a policy change. Two safe
-- columns are granted so a future "edit your details" screen
-- doesn't have to reopen the table to build it.
--
-- Run AFTER 019. Safe to re-run.
-- ============================================================

revoke update on public.profiles from authenticated;

-- Display fields only. Deliberately NOT: role, company_id, id, email.
grant update (full_name, company_name) on public.profiles to authenticated;

-- The row-scoping policy stays and is still correct — it is now the second
-- of two checks rather than the only one.


-- ────────────────────────────────────────────────────────────
-- VERIFY
--
-- The first two rows are the ones that matter. Both must be false.
-- ────────────────────────────────────────────────────────────
select 'authenticated CANNOT update profiles.role' as check,
       not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') as ok
union all
select 'authenticated CANNOT update profiles.company_id',
       not has_column_privilege('authenticated', 'public.profiles', 'company_id', 'UPDATE')
union all
select 'authenticated CAN still update full_name',
       has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')
union all
select 'authenticated can still read own profile',
       has_table_privilege('authenticated', 'public.profiles', 'SELECT')
union all
select 'service_role unaffected',
       has_table_privilege('service_role', 'public.profiles', 'UPDATE');
