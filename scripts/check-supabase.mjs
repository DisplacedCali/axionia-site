#!/usr/bin/env node
/**
 * Supabase setup diagnostic.
 *
 *   node scripts/check-supabase.mjs
 *   node scripts/check-supabase.mjs --send-test you@company.com
 *
 * Reads .env.local, then checks: env vars, auth configuration, whether the
 * migration ran, the storage bucket, and whether an admin exists. With
 * --send-test it attempts a real OTP send and prints the FULL error, which
 * is what the browser hides behind "{}".
 *
 * No dependencies — Node 18+ only.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

const ok = (m, d) => console.log(`  ${C.green}✓${C.reset} ${m}${d ? ` ${C.dim}${d}${C.reset}` : ""}`);
const bad = (m, d) => console.log(`  ${C.red}✗${C.reset} ${m}${d ? ` ${C.dim}${d}${C.reset}` : ""}`);
const warn = (m, d) => console.log(`  ${C.yellow}!${C.reset} ${m}${d ? ` ${C.dim}${d}${C.reset}` : ""}`);
const head = (m) => console.log(`\n${C.bold}${C.blue}${m}${C.reset}`);

/* ── env ── */
function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(resolve(root, file), "utf8");
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!(k in env)) env[k] = v;
      }
    } catch {
      /* file absent — fine */
    }
  }
  return env;
}

const env = loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`${C.bold}Axionia — Supabase diagnostic${C.reset}`);

head("1. Environment variables");
URL_ ? ok("NEXT_PUBLIC_SUPABASE_URL", URL_) : bad("NEXT_PUBLIC_SUPABASE_URL missing");
ANON ? ok("NEXT_PUBLIC_SUPABASE_ANON_KEY", `${ANON.slice(0, 12)}…`) : bad("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
SERVICE
  ? ok("SUPABASE_SERVICE_ROLE_KEY", `${SERVICE.slice(0, 12)}…`)
  : bad("SUPABASE_SERVICE_ROLE_KEY missing", "— /admin will throw without this");

for (const k of ["RESEND_API_KEY", "EMAIL_FROM", "ADMIN_NOTIFY_EMAIL", "NEXT_PUBLIC_SITE_URL"]) {
  env[k] ? ok(k, k.includes("KEY") ? "set" : env[k]) : warn(`${k} not set`, "— optional");
}

if (!URL_ || !ANON) {
  console.log(`\n${C.red}Cannot continue without URL and anon key.${C.reset}\n`);
  process.exit(1);
}

/* ── auth settings (public endpoint) ── */
head("2. Auth configuration");
let settings = null;
try {
  const res = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: ANON } });
  settings = await res.json();

  if (settings.disable_signup === true) {
    bad("New signups are DISABLED", "— this causes 'Signups not allowed for otp'");
    console.log(
      `    ${C.dim}Fix: Authentication → Sign In / Providers → enable "Allow new users to sign up"${C.reset}`
    );
  } else {
    ok("New signups allowed");
  }

  if (settings.external?.email === false) {
    bad("Email provider is DISABLED", "— OTP cannot be sent at all");
  } else {
    ok("Email provider enabled");
  }

  if (settings.mailer_autoconfirm === true) {
    warn("mailer_autoconfirm is ON", "— users are auto-confirmed and NO email is sent");
    console.log(
      `    ${C.dim}If you expect a code by email, turn "Confirm email" back on.${C.reset}`
    );
  } else {
    ok("Email confirmation required", "(codes are sent)");
  }
} catch (e) {
  bad("Could not read auth settings", e.message);
}

/* ── database ── */
head("3. Database (did the migration run?)");
if (!SERVICE) {
  warn("Skipped — no service role key");
} else {
  const tables = [
    ["profiles", "base schema"],
    ["reports", "base schema"],
    ["leads", "base schema"],
    ["companies", "migration 002"],
    ["report_requests", "migration 002"],
    ["report_files", "migration 002"],
    ["email_log", "migration 002"],
  ];
  for (const [t, origin] of tables) {
    try {
      const res = await fetch(`${URL_}/rest/v1/${t}?select=*&limit=0`, {
        headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
      });
      if (res.ok) ok(`${t}`, origin);
      else bad(`${t} missing or unreadable`, `HTTP ${res.status} — ${origin}`);
    } catch (e) {
      bad(`${t}`, e.message);
    }
  }

  /* storage bucket */
  try {
    const res = await fetch(`${URL_}/storage/v1/bucket/reports`, {
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    });
    if (res.ok) {
      const b = await res.json();
      ok("storage bucket 'reports'", b.public ? "PUBLIC — should be private!" : "private");
    } else {
      bad("storage bucket 'reports' missing", `HTTP ${res.status}`);
    }
  } catch (e) {
    bad("storage bucket check failed", e.message);
  }

  /* admin + user counts */
  try {
    const res = await fetch(`${URL_}/rest/v1/profiles?select=email,role`, {
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    });
    if (res.ok) {
      const rows = await res.json();
      const admins = rows.filter((r) => r.role === "admin");
      ok(`${rows.length} user profile(s)`);
      if (admins.length === 0) {
        warn("No admin user yet", "— /admin will redirect you to /dashboard");
        console.log(
          `    ${C.dim}Fix: update public.profiles set role='admin' where email='you@…';${C.reset}`
        );
      } else {
        ok(`${admins.length} admin(s)`, admins.map((a) => a.email).join(", "));
      }
    }
  } catch (e) {
    warn("Could not read profiles", e.message);
  }
}

/* ── live OTP test ── */
const sendIdx = process.argv.indexOf("--send-test");
if (sendIdx !== -1) {
  const email = process.argv[sendIdx + 1];
  head("4. Live OTP send test");
  if (!email) {
    bad("Pass an address: --send-test you@company.com");
  } else {
    console.log(`  ${C.dim}Requesting a code for ${email}…${C.reset}`);
    try {
      const res = await fetch(`${URL_}/auth/v1/otp`, {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email, create_user: true }),
      });
      const body = await res.text();
      if (res.ok) {
        ok("Supabase accepted the request", `HTTP ${res.status}`);
        console.log(`  ${C.dim}Check the inbox. If nothing arrives, it's an SMTP/template problem.${C.reset}`);
      } else {
        bad(`Send failed — HTTP ${res.status}`);
        console.log(`  ${C.red}${body}${C.reset}`);
        console.log(
          `\n  ${C.dim}This is the real error the browser was showing as "{}".${C.reset}`
        );
      }
    } catch (e) {
      bad("Request threw", e.message);
    }
  }
} else {
  head("4. Live OTP send test");
  console.log(
    `  ${C.dim}Skipped. Run with --send-test you@company.com to see the real send error.${C.reset}`
  );
}

console.log("");
