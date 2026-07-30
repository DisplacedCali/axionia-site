import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/authApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPool } from "@/lib/modules/research/db";
import { validatePlan, WAVES, TOTAL_MODEL_CALLS } from "@/lib/modules/research/pipeline/plan";
import { validateResearchData } from "@/lib/modules/research/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Readiness check for the research module.
 *
 * Exists because production is the only place some of this is observable:
 * env vars live in Vercel, and a mis-pasted key produces a confusing
 * downstream error rather than an obvious one.
 *
 * Reports what is and isn't configured WITHOUT echoing any secret. Keys are
 * described by length, shape and — for legacy JWTs — the decoded `role` claim,
 * which is the single most useful fact when a service-role key turns out to be
 * a publishable key.
 *
 * Admin only. GET is read-only. POST additionally runs a write probe that
 * inserts and immediately deletes one throwaway row.
 */

type Check = { ok: boolean; detail: string };

/** Describe a Supabase key without revealing it. */
function describeKey(raw: string | undefined): {
  present: boolean;
  chars?: number;
  shape?: string;
  role?: string;
  warning?: string;
} {
  if (!raw) return { present: false };
  const out: { present: boolean; chars: number; shape: string; role?: string; warning?: string } = {
    present: true,
    chars: raw.length,
    shape: "unrecognised",
  };

  if (raw.startsWith("sb_publishable_")) {
    out.shape = "new publishable key";
    out.role = "anon (client-safe)";
    out.warning = "This is a CLIENT key. It cannot write past RLS.";
  } else if (raw.startsWith("sb_secret_")) {
    out.shape = "new secret key";
    out.role = "service_role (server-only)";
  } else if (raw.split(".").length === 3) {
    out.shape = "legacy JWT";
    try {
      const payload = JSON.parse(
        Buffer.from(raw.split(".")[1], "base64url").toString("utf8"),
      ) as { role?: string };
      out.role = payload.role ?? "unknown";
      if (payload.role !== "service_role") {
        out.warning = `JWT role is "${payload.role}", not "service_role". Writes bypassing RLS will fail.`;
      }
    } catch {
      out.role = "unparseable";
    }
  }
  return out;
}

export async function GET() {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await report(false));
}

/** Same as GET, plus a reversible write probe. */
export async function POST() {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await report(true));
}

async function report(withWriteProbe: boolean) {
  const checks: Record<string, Check> = {};
  const set = (k: string, ok: boolean, detail: string) => (checks[k] = { ok, detail });

  // ── 1. Env ────────────────────────────────────────────────────────────────
  const serviceKey = describeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = describeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  set(
    "SUPABASE_SERVICE_ROLE_KEY",
    serviceKey.present && !serviceKey.warning,
    !serviceKey.present
      ? "missing — the admin section cannot write"
      : (serviceKey.warning ?? `${serviceKey.shape}, role=${serviceKey.role}`),
  );

  // The specific mistake worth naming outright.
  if (
    serviceKey.present &&
    anonKey.present &&
    process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    set(
      "keys_distinct",
      false,
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are the SAME value. " +
        "Every read will work and every write will fail with 'permission denied'.",
    );
  } else if (serviceKey.present && anonKey.present) {
    set("keys_distinct", true, "service-role and anon keys are different values");
  }

  set(
    "ANTHROPIC_API_KEY",
    Boolean(process.env.ANTHROPIC_API_KEY),
    process.env.ANTHROPIC_API_KEY
      ? `present (${process.env.ANTHROPIC_API_KEY.length} chars), model=${process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"}`
      : "missing — the pipeline cannot make model calls",
  );

  set(
    "DATABASE_URL",
    Boolean(process.env.DATABASE_URL),
    process.env.DATABASE_URL ? "present" : "missing — research state is unreachable",
  );

  // ── 2. Service-role client can actually write ─────────────────────────────
  // Decoding the key says what it claims to be; this says what it can do.
  if (serviceKey.present) {
    try {
      const admin = createAdminClient();
      const { error: readErr } = await admin.from("companies").select("id").limit(1);
      set(
        "service_role_read",
        !readErr,
        readErr ? readErr.message : "can read public.companies",
      );

      if (withWriteProbe) {
        const probeDomain = `internal.healthcheck-${Date.now()}`;
        const { data, error: insErr } = await admin
          .from("companies")
          .insert({ domain: probeDomain, name: "Health check probe", notes: "Delete me." })
          .select("id")
          .single();

        if (insErr) {
          set(
            "service_role_write",
            false,
            `${insErr.message} — this is the failure you saw on /admin/new. ` +
              "It means the key is not service_role.",
          );
        } else {
          const { error: delErr } = await admin.from("companies").delete().eq("id", data.id);
          set(
            "service_role_write",
            true,
            delErr
              ? `write OK, but cleanup failed — delete company ${data.id} manually`
              : "can insert and delete public.companies (probe row removed)",
          );
        }
      }
    } catch (e) {
      set("service_role_client", false, (e as Error).message);
    }
  }

  // ── 3. Research schema state ──────────────────────────────────────────────
  if (process.env.DATABASE_URL) {
    try {
      const pool = getPool();
      const { rows: who } = await pool.query("select current_user as u");
      set("db_connection", true, `connected as ${who[0].u}`);

      const { rows: objs } = await pool.query(
        `select table_name from information_schema.tables where table_schema='research'
         union all
         select routine_name from information_schema.routines where routine_schema='research'`,
      );
      const names = new Set(objs.map((r) => r.table_name as string));

      set(
        "research_schema",
        names.has("companies") && names.has("research_runs"),
        names.size ? `${names.size} objects` : "not found — run supabase_research_schema.sql",
      );

      // normalize_domain only exists in the domain-canonical version. db.ts
      // calls it on every save, so its absence breaks the pipeline at the
      // final step — after all ten model calls have been paid for.
      set(
        "schema_up_to_date",
        names.has("normalize_domain"),
        names.has("normalize_domain")
          ? "normalize_domain() present"
          : "STALE — normalize_domain() missing. Re-run supabase_research_schema.sql, " +
            "or the pipeline will fail when saving a completed run.",
      );

      set(
        "migration_008",
        names.has("pipeline_jobs"),
        names.has("pipeline_jobs")
          ? "pipeline_jobs present"
          : "not applied — run supabase/migrations/008_research_pipeline_jobs.sql",
      );

      set(
        "promote_function",
        names.has("promote_research_to_report"),
        names.has("promote_research_to_report")
          ? "promote_research_to_report() present"
          : "absent — needs axionia-site migrations 002-007, then re-run the research schema",
      );

      // Grants: can the connecting role actually use these tables?
      if (names.has("pipeline_jobs")) {
        const { rows: g } = await pool.query(
          `select has_table_privilege(current_user,'research.pipeline_jobs','SELECT') as sel,
                  has_table_privilege(current_user,'research.pipeline_jobs','INSERT') as ins,
                  has_table_privilege(current_user,'research.companies','INSERT')     as co_ins`,
        );
        const ok = g[0].sel && g[0].ins && g[0].co_ins;
        set(
          "research_grants",
          ok,
          ok
            ? "connecting role can read and write the research tables"
            : `insufficient: select=${g[0].sel} insert=${g[0].ins} companies_insert=${g[0].co_ins}`,
        );

        const { rows: jobs } = await pool.query(
          "select status, count(*)::int n from research.pipeline_jobs group by status",
        );
        set(
          "job_queue",
          true,
          jobs.length ? jobs.map((r) => `${r.status}=${r.n}`).join(", ") : "empty",
        );
      }
    } catch (e) {
      set("db_connection", false, (e as Error).message);
    }
  }

  // ── 4. Code-level self-checks (no I/O) ────────────────────────────────────
  const planProblems = validatePlan();
  set(
    "pipeline_plan",
    planProblems.length === 0,
    planProblems.length
      ? planProblems.join("; ")
      : `${WAVES.length} waves, ${TOTAL_MODEL_CALLS} model calls, dependencies consistent`,
  );

  const dataIssues = validateResearchData();
  const dataErrors = dataIssues.filter((i) => i.severity === "error");
  set(
    "benefit_library",
    dataErrors.length === 0,
    dataErrors.length
      ? dataErrors.map((i) => i.message).join("; ")
      : `${dataIssues.length} warning(s), 0 errors`,
  );

  const failing = Object.entries(checks).filter(([, v]) => !v.ok).map(([k]) => k);

  return {
    ready: failing.length === 0,
    failing,
    checks,
    // Ordered so the first unmet item is the next thing to do.
    nextSteps: failing.length
      ? failing.map((k) => `${k}: ${checks[k].detail}`)
      : ["All checks pass. POST to /api/modules/research to start a job."],
    writeProbeRun: withWriteProbe,
  };
}
