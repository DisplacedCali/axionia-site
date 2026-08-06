# Email setup

## Where things stand

| Path | Provider | Status |
|---|---|---|
| Auth codes (login / signup OTP) | Google Workspace SMTP via Supabase | ✅ Working |
| Report notifications (`lib/email.ts`) | Resend API | ⬜ Not configured — sends are skipped and logged |

Supabase's **built-in mailer does not work** on this project. It returns
`{"code":500,"error_code":"unexpected_failure","msg":"Error sending magic link email"}`,
which the browser surfaces as an empty `{}`. This was reproduced repeatedly,
including after resetting the email templates to default, so it is the mailer
itself and not configuration. Custom SMTP is mandatory here, not optional.

## Current working config (Google Workspace SMTP)

Supabase → Project Settings → Authentication → SMTP Settings:

```
Host:          smtp.gmail.com
Port:          465
Username:      <your @axionia.com Workspace address>
Password:      16-character Google app password
Sender email:  <same address, or a configured alias>
Sender name:   Axionia
```

The app password comes from myaccount.google.com/apppasswords and requires
2-Step Verification on the account. The sender address must match the
authenticated account or be a configured alias — a mismatch fails the send.

Supabase shows a warning that Gmail is a personal rather than transactional
provider. That warning is accurate but non-blocking. Limits are roughly
2,000 sends/day, which is far above current volume.

Both **Confirm signup** (new users) and **Magic Link** (returning users)
templates must emit `{{ .Token }}` — this app uses typed codes, not links, and
has no `/auth/callback` handler. Editing only Magic Link is a common mistake;
new signups use Confirm signup.

---

## Migrating to Resend (do this before real traffic)

Why bother, given Workspace works: delivery logs, bounce and complaint
webhooks, no daily cap, and proper transactional reputation. Right now a
silently failed send is invisible. `lib/email.ts` is already written against
the Resend API, so report notifications need this regardless.

### 1. Verify the domain

1. resend.com → sign up → **Domains** → Add Domain → `axionia.com`
2. Resend shows DNS records. Add each in Cloudflare.
3. Click **Verify**.

**Trap 1 — do not proxy.** Cloudflare defaults new records to proxied (orange
cloud). Mail records must be **DNS only** (grey cloud). Proxied DKIM/SPF
records fail verification silently.

**Trap 2 — do not add a second SPF record.** A domain may have only one, and
`axionia.com` already has one for Google Workspace. Adding Resend's as a
separate TXT record breaks both. Merge instead — edit the existing record:

```
before:  v=spf1 include:_spf.google.com ~all
after:   v=spf1 include:_spf.google.com include:amazonses.com ~all
```

Use whatever `include:` Resend actually shows you if it differs.

### 2. Point auth email at Resend

Resend → **SMTP** tab, then Supabase → Authentication → SMTP Settings:

```
Host:          smtp.resend.com
Port:          465
Username:      resend
Password:      <a Resend API key>
Sender email:  reports@axionia.com
Sender name:   Axionia
```

### 3. Turn on report notifications

Resend → **API Keys** → create one, then set in `.env.local` **and** Vercel
(all environments):

```
RESEND_API_KEY=re_...
EMAIL_FROM=Axionia <reports@axionia.com>
EMAIL_REPLY_TO=tom@axionia.com
ADMIN_NOTIFY_EMAIL=tom@axionia.com
NEXT_PUBLIC_SITE_URL=https://axionia.com
```

Replies route to the Workspace inbox, so recipients see ordinary mail from you
and answers land in Gmail. Workspace stays the human mailbox; Resend only
carries automated sends.

### 4. Verify

```
node scripts/check-supabase.mjs --send-test you@company.com
```

Then submit a real request through `/request-report` and confirm two things:
a confirmation email to the requester, and an admin notification to
`ADMIN_NOTIFY_EMAIL`. Every attempt is recorded in the `email_log` table with
status `sent`, `skipped`, or `failed` — check there first when mail goes quiet.

---

## Before configuring Resend: stop the signup abuse

Do not point a fresh sending domain at this traffic. Signup abuse was creating
accounts with harvested-looking addresses, and because Supabase creates the
auth user when a code is **requested** rather than entered, every one of those
sent an OTP to a real person who never asked. A new domain doing that is a new
domain on a blocklist.

Order: Turnstile → verify it's stopped → then Resend.

### Turnstile

1. Cloudflare dashboard → **Turnstile** → Add widget. Domain `axionia.com`,
   widget mode **Managed**.
2. Copy the **site key** → Vercel env `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   (and `.env.local`). It is public by design; it ships in the page.
3. Copy the **secret key** → Supabase → Authentication → Settings →
   **Bot and Abuse Protection** → enable, provider **Turnstile**, paste it.
4. Redeploy. Env vars only take effect on a new build.

**Set both together or neither.** The component renders nothing without a site
key, so the client sends no token — and if Supabase is enforcing captcha at
that moment, every signup fails with an unhelpful error. Enabling Supabase's
setting before deploying the key is the way to take signup down.

### Cloudflare, in front of everything

Free tier, and worth having regardless:

- **Security → Bots → Bot Fight Mode: on.** Challenges obvious automation
  before it reaches Vercel.
- **Security → WAF → Rate limiting rules.** One rule covers the abuse:
  `/signup`, `/request-report`, `/contact` and `/api/track` — 10 requests per
  minute per IP, action Managed Challenge.

Cloudflare rate limits by IP and Turnstile by browser, so they fail
differently. That's the reason to run both.

### Then verify it worked

```sql
select date_trunc('day', created_at) as day,
       count(*) as signups,
       count(*) filter (where email_confirmed_at is null) as never_verified
from auth.users
group by 1 order by 1 desc limit 14;
```

`never_verified` should collapse toward zero. Once it has, configure Resend.
