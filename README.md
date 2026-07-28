# Axionia — Public Website

Next.js 14 (App Router) + Tailwind + Supabase. Marketing pages, login/signup with role
storage, and a placeholder dashboard shell to build the real application into later.

Build has been verified locally (`npm run build` passes clean — 10 routes compile).

## What's here

- `/` `/platform` `/founding-members` `/pricing` `/about` `/contact` — marketing pages
- `/login` `/signup` — email OTP auth (6-digit code, not a magic link — see below)
- `/dashboard` — role-aware placeholder, gated by `middleware.ts`
- `supabase/schema.sql` — full DB schema (profiles + role, intake, reports, leads)

## 1. Create the Supabase project

1. Go to supabase.com → New project. Pick a region close to your users (US region is fine).
2. Once it's provisioned, go to **SQL Editor** → paste in the entire contents of
   `supabase/schema.sql` → Run. This creates all four tables and RLS policies in one shot.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

## 2. Turn on OTP codes instead of magic links

This is the one non-obvious step, and it matters: the earlier version of this stack used
magic links, and they silently broke for at least one real user (Yale's Google Workspace
prefetch-scans inbound links, which consumes the single-use magic link before the person
ever clicks it — so login fails with no useful error). This build sidesteps that
entirely by having people type in a 6-digit code instead of clicking a link. The API call
is the same either way — it's just the email template that needs to change:

1. Supabase Dashboard → **Authentication → Email Templates → Magic Link**
2. Replace the template body so it shows `{{ .Token }}` (the 6-digit code) instead of a
   `{{ .ConfirmationURL }}` link/button. Something like:
   ```
   Your Axionia login code is: {{ .Token }}
   This code expires in 60 minutes.
   ```
3. Save.

Login and signup both use this same code flow (`supabase.auth.signInWithOtp` +
`verifyOtp`) — signup additionally passes `full_name` and `company_name` as user
metadata, which a database trigger copies into `profiles` automatically.

## 3. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in the two values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 4. Run it locally

```
npm install
npm run dev
```

Visit `localhost:3000`. Try signup → you should get an email with a 6-digit code.

## 5. Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project** → import the repo.
3. Add the same two environment variables from step 3 in Vercel's project settings
   (**Settings → Environment Variables**), for all environments.
4. Deploy. Point your domain (Cloudflare DNS → Vercel, per your existing setup) at it.

## Roles

Every new signup gets `role = 'client'` by default. To make yourself (or anyone) an
admin, run this in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@axionia.com';
```

There's no admin UI yet — `/dashboard` just reads `profile.role` and shows slightly
different copy for admins. Real role-gated features (intake review, report release,
lead management) are the next layer to build on top of this once you're ready to pick
the application back up.

## Notes on scope / what's deliberately NOT here yet

- **Leads table, no email notification yet.** Contact/founding-member/on-prem form
  submissions land in `public.leads` in Supabase. You'll want to check that table
  manually (or wire up a Resend/email notification later) until there's a proper
  admin view.
- **No Portfolio Scorer / intake / report flows.** Those are the "broader application"
  pieces — `intake_responses` and `reports` tables already exist in the schema
  (carried over from the earlier draft) so you're not starting from zero on the data
  model when you get there.
- **Founding member pricing is intentionally not published anywhere on the site** —
  matches how you described wanting to handle it. The page describes the program and
  routes interest to `/contact`.
- **One Next.js app, not a split marketing-site + app.axionia.com portal.** The earlier
  plan split these into a static site and a separate portal app; this build merges them
  into one app so login/roles are foundational from day one instead of bolted on later.
