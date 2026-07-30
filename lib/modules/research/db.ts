/**
 * Research-schema database access.
 *
 * Uses a direct Postgres connection, not supabase-js. This is not a style
 * preference: the `research` schema is deliberately absent from Project
 * Settings → API → Exposed schemas, so PostgREST does not serve it and
 * supabase-js physically cannot reach it. That is the isolation — the only way
 * in is code holding DATABASE_URL, which lives server-side only.
 *
 * SERVER ONLY. Never import from a "use client" file.
 */

import { Pool, type PoolClient } from "pg";
import type {
  JobInput,
  JobStatus,
  PipelineJob,
  ResearchResult,
  StepStates,
} from "./pipeline/types";

/**
 * Module-scoped pool. Serverless invocations are reused, so a pool per process
 * is correct; a pool per request would exhaust connections under any load.
 * Kept small because Supabase's transaction-mode pooler multiplexes anyway.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — the research pipeline stores state in the `research` schema, " +
        "which is not reachable via supabase-js because it is not an exposed schema.",
    );
  }

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
  pool = new Pool({
    connectionString,
    // Supabase requires TLS and its pooler presents a chain node-postgres
    // won't verify by default.
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (e) => console.error("[research/db] pool error:", e.message));
  return pool;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function toJob(r: Row): PipelineJob {
  return {
    id: r.id,
    companyId: r.company_id ?? null,
    requestId: r.request_id ?? null,
    status: r.status as JobStatus,
    input: r.input as JobInput,
    steps: (r.steps ?? {}) as StepStates,
    nextWave: r.next_wave ?? 0,
    attempts: r.attempts ?? 0,
    lastError: r.last_error ?? null,
    runId: r.run_id ?? null,
    inputTokens: r.input_tokens ?? 0,
    outputTokens: r.output_tokens ?? 0,
    model: r.model ?? null,
    createdAt: r.created_at?.toISOString?.() ?? String(r.created_at),
    updatedAt: r.updated_at?.toISOString?.() ?? String(r.updated_at),
  };
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export async function createJob(args: {
  input: JobInput;
  requestId?: string | null;
  createdBy?: string | null;
}): Promise<PipelineJob> {
  const { rows } = await getPool().query(
    `insert into research.pipeline_jobs (input, request_id, created_by, status)
     values ($1, $2, $3, 'queued')
     returning *`,
    [args.input, args.requestId ?? null, args.createdBy ?? null],
  );
  return toJob(rows[0]);
}

export async function getJob(id: string): Promise<PipelineJob | null> {
  const { rows } = await getPool().query(
    "select * from research.pipeline_jobs where id = $1",
    [id],
  );
  return rows[0] ? toJob(rows[0]) : null;
}

/**
 * Claim a job for a wave, atomically.
 *
 * The conditional UPDATE is the lock. Two concurrent advance() calls — an
 * impatient double-click, or a poll overlapping a retry — would otherwise both
 * run the same wave and pay for it twice. Only one transition to 'running'
 * succeeds; the loser gets null and backs off.
 *
 * Jobs stuck in 'running' for over 10 minutes are reclaimable: a serverless
 * invocation that died mid-wave leaves that state and nothing else clears it.
 */
export async function claimJob(id: string): Promise<PipelineJob | null> {
  const { rows } = await getPool().query(
    `update research.pipeline_jobs
        set status = 'running', attempts = attempts + 1
      where id = $1
        and (status in ('queued','paused')
             or (status = 'running' and updated_at < now() - interval '10 minutes'))
      returning *`,
    [id],
  );
  return rows[0] ? toJob(rows[0]) : null;
}

export async function saveWaveResult(args: {
  jobId: string;
  steps: StepStates;
  nextWave: number;
  companyId?: string | null;
  inputTokens: number;
  outputTokens: number;
  model?: string | null;
  status: JobStatus;
  lastError?: string | null;
}): Promise<PipelineJob> {
  const { rows } = await getPool().query(
    `update research.pipeline_jobs
        set steps         = $2,
            next_wave     = $3,
            company_id    = coalesce($4, company_id),
            input_tokens  = input_tokens + $5,
            output_tokens = output_tokens + $6,
            model         = coalesce($7, model),
            status        = $8,
            last_error    = $9
      where id = $1
      returning *`,
    [
      args.jobId,
      args.steps,
      args.nextWave,
      args.companyId ?? null,
      args.inputTokens,
      args.outputTokens,
      args.model ?? null,
      args.status,
      args.lastError ?? null,
    ],
  );
  return toJob(rows[0]);
}

export async function attachRunId(jobId: string, runId: string): Promise<void> {
  await getPool().query(
    "update research.pipeline_jobs set run_id = $2 where id = $1",
    [jobId, runId],
  );
}

export async function cancelJob(jobId: string): Promise<void> {
  await getPool().query(
    `update research.pipeline_jobs set status = 'cancelled'
      where id = $1 and status in ('queued','running','paused')`,
    [jobId],
  );
}

/**
 * The live job for a request, if any.
 *
 * Lets the admin page resume a progress view after a reload — the job outlives
 * the browser, only the view was lost.
 */
export async function getActiveJobForRequest(requestId: string): Promise<PipelineJob | null> {
  const { rows } = await getPool().query(
    `select * from research.pipeline_jobs
      where request_id = $1
        and status in ('queued','running','paused')
      order by created_at desc
      limit 1`,
    [requestId],
  );
  return rows[0] ? toJob(rows[0]) : null;
}

export async function listJobs(limit = 50): Promise<Row[]> {
  const { rows } = await getPool().query(
    "select * from research.pipeline_queue limit $1",
    [limit],
  );
  return rows;
}

// ── Company + completed run persistence ─────────────────────────────────────

/**
 * Upsert the research company row. Domain is derived in the database via
 * research.normalize_domain so the rule has exactly one definition, shared with
 * promote_research_to_report.
 */
export async function upsertCompany(
  client: PoolClient,
  co: { name: string; website?: string | null; industry?: string | null; hq?: string | null; size?: string | null },
): Promise<string> {
  const { rows } = await client.query(
    `insert into research.companies as c
            (name, website, domain, industry, hq, size, first_researched, last_researched, refresh_due)
     values ($1, $2, research.normalize_domain($2), $3, $4, $5, now(), now(), now() + interval '30 days')
     on conflict (lower(name)) do update
       set website         = coalesce(excluded.website,  c.website),
           domain          = coalesce(excluded.domain,   c.domain),
           industry        = coalesce(excluded.industry, c.industry),
           hq              = coalesce(excluded.hq,       c.hq),
           size            = coalesce(excluded.size,     c.size),
           last_researched = now(),
           refresh_due     = now() + interval '30 days'
     returning id`,
    [co.name, co.website ?? null, co.industry ?? null, co.hq ?? null, co.size ?? null],
  );
  return rows[0].id;
}

/**
 * Write a completed run: company upsert, research_runs row, flattened radar
 * scores, benefit gaps. One transaction — a half-written run would corrupt the
 * benchmark views, which is worse than no run at all.
 */
export async function saveResearchRun(
  result: ResearchResult,
): Promise<{ companyId: string; runId: string; gapsSaved: number }> {
  const client = await getPool().connect();
  try {
    await client.query("begin");

    const companyId = await upsertCompany(client, {
      name: result.company,
      website: result.website,
      industry: result.industry,
      hq: result.hq,
      size: result.size,
    });

    const { rows: runRows } = await client.query(
      `insert into research.research_runs (
         company_id, run_date, pipeline_version,
         linkedin_data, profile, benefits, financial, regulatory, brief,
         workforce_data, scores, states_data, full_payload
       ) values ($1, now(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       returning id`,
      [
        companyId,
        result.pipelineVersion,
        result.linkedinData ?? null,
        result.profile ?? null,
        result.benefits ?? null,
        result.financial ?? null,
        result.regulatory ?? null,
        result.brief ?? null,
        result.workforceData ?? null,
        result.scores ?? null,
        result.statesData ?? null,
        result,
      ],
    );
    const runId = runRows[0].id;

    const s = result.scores;
    if (s) {
      await client.query(
        `insert into research.radar_scores (
           company_id, run_id, run_date,
           spend_efficiency, decision_maturity, workforce_alignment,
           vendor_independence, analytics_readiness, cfo_engagement,
           regulatory_readiness, appreciation_value,
           overall_score, readiness_label, weakest_axis, is_fallback
         ) values ($1,$2,now(),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          companyId,
          runId,
          s.spendEfficiency ?? null,
          s.decisionMaturity ?? null,
          s.workforceAlignment ?? null,
          s.vendorIndependence ?? null,
          s.analyticsReadiness ?? null,
          s.cfoEngagement ?? null,
          s.regulatoryReadiness ?? null,
          s.appreciationValue ?? null,
          s.overallScore ?? null,
          s.readinessLabel ?? null,
          s.weakestAxis ?? null,
          Boolean(s._fallback),
        ],
      );
    }

    const gaps = (result.workforceData?.benefitDesign ?? []).flatMap((seg) =>
      (seg.gap ?? []).map((g) => ({ ...g, segment: seg.segment })),
    );

    if (gaps.length) {
      const values: string[] = [];
      const params: unknown[] = [companyId, runId];
      gaps.forEach((g, i) => {
        const o = i * 5;
        values.push(`($1,$2,$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7})`);
        params.push(
          g.segment ?? null,
          g.benefit ?? null,
          ["High", "Medium", "Low"].includes(g.urgency) ? g.urgency : null,
          g.gapRationale ?? null,
          g.retentionImpact ?? null,
        );
      });
      await client.query(
        `insert into research.benefit_gaps
           (company_id, run_id, segment, benefit, urgency, gap_rationale, retention_impact)
         values ${values.join(",")}`,
        params,
      );
    }

    await client.query("commit");
    return { companyId, runId, gapsSaved: gaps.length };
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Latest run for a company, with freshness. Powers the cache check. */
export async function getCachedRun(companyName: string): Promise<{
  found: boolean;
  isFresh?: boolean;
  ageDays?: number;
  runId?: string;
  runDate?: string;
  data?: unknown;
}> {
  const { rows } = await getPool().query(
    `select c.id as company_id, c.name, c.refresh_due,
            r.id as run_id, r.full_payload, r.run_date,
            (c.refresh_due > now()) as is_fresh,
            date_part('day', now() - r.run_date)::int as age_days
       from research.companies c
       join research.research_runs r on r.company_id = c.id
      where lower(c.name) = lower($1)
      order by r.run_date desc
      limit 1`,
    [companyName],
  );
  if (!rows[0]) return { found: false };
  return {
    found: true,
    isFresh: rows[0].is_fresh,
    ageDays: rows[0].age_days,
    runId: rows[0].run_id,
    runDate: rows[0].run_date?.toISOString?.() ?? String(rows[0].run_date),
    data: rows[0].full_payload,
  };
}

/**
 * Promote a completed run into the client-facing delivery layer.
 * Thin wrapper over the SQL function so the logic has one home.
 */
export async function promoteRunToReport(args: {
  runId: string;
  domain?: string | null;
  title?: string | null;
}): Promise<string> {
  const { rows } = await getPool().query(
    "select research.promote_research_to_report($1, $2, $3) as report_id",
    [args.runId, args.domain ?? null, args.title ?? null],
  );
  return rows[0].report_id;
}
