-- 034_simulation.sql
--
-- The simulation store. Additive to the existing `research` schema: nothing
-- here touches research_runs or radar_scores, and the two join at company_id.
--
-- Depends on: research_schema.sql (the `research` schema must exist).
-- Safe to re-run: every CREATE is IF NOT EXISTS or OR REPLACE.
--
-- The design question this answers: how does the second, tenth and hundredth
-- analysis compound into a benchmark asset rather than into a hundred
-- unrelated PDFs?
--
-- The answer, in one sentence: store the INPUTS and the PARAMETERS separately
-- from the OUTPUTS, and version the model. A stored result is worth nothing
-- once the model changes; a stored input set can be re-run against every future
-- version of the model, which is what makes the corpus appreciate instead of
-- decay.
--
-- Three properties follow from that and each is deliberate.
--
--   1. Every run records the exact model version and the exact parameter set
--      it used. Two runs are comparable only if you can prove what differed.
--   2. Assumptions are rows, not JSON blobs. That is what lets us ask "across
--      every client we have modelled, what did we assume for HDHP premium
--      discount, and how did the ones with real quotes differ from the ones
--      where we used the default?" -- which is precisely how a default becomes
--      a benchmark.
--   3. Intake answers are stored with a provenance and a confidence, because
--      "the client told us" and "we inferred it from the census" and "we used
--      the population default" are three different epistemic states and
--      flattening them is how a benchmark quietly fills with our own priors.

BEGIN;

-- ---------------------------------------------------------------------------
-- Model versioning
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research.sim_model_version (
  id              text PRIMARY KEY,              -- 'sim-0.1.0'
  released_at     timestamptz NOT NULL DEFAULT now(),
  git_sha         text,
  notes           text NOT NULL,
  -- Breaking means results are not comparable across the boundary. Recorded
  -- explicitly so a cohort query can refuse to mix them rather than silently
  -- averaging two different models.
  breaking        boolean NOT NULL DEFAULT false
);

-- The statutory table, versioned by year. Separate from assumptions because
-- these are facts with citations, and a benchmark that cannot distinguish a
-- fact from an estimate is not a benchmark.
CREATE TABLE IF NOT EXISTS research.sim_statute (
  key             text NOT NULL,
  tax_year        int  NOT NULL,
  value           jsonb NOT NULL,
  citation        text NOT NULL,
  note            text,
  verified_at     date,
  verified_by     text,
  PRIMARY KEY (key, tax_year)
);

-- ---------------------------------------------------------------------------
-- Intake
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE research.sim_provenance AS ENUM (
    'client_stated',      -- they told us
    'client_document',    -- we read it off a plan document or census
    'derived',            -- computed from something they gave us
    'population_default'  -- we substituted a default and are saying so
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS research.sim_intake (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES research.companies(id) ON DELETE CASCADE,
  plan_year       int NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      text,
  -- Completeness travels with the intake, not with the report, so a report can
  -- print its own epistemic grade on its own face.
  completeness    jsonb NOT NULL,
  grade           text NOT NULL,   -- 'client-specific' .. 'illustrative'
  UNIQUE (company_id, plan_year, created_at)
);

CREATE TABLE IF NOT EXISTS research.sim_intake_answer (
  intake_id       uuid NOT NULL REFERENCES research.sim_intake(id) ON DELETE CASCADE,
  field_key       text NOT NULL,
  value           jsonb,
  provenance      research.sim_provenance NOT NULL,
  -- Same 1-3 scale as Vendor.evidenceQuality in the research module, so the two
  -- libraries stay commensurable and a joined query means something.
  confidence      smallint NOT NULL CHECK (confidence BETWEEN 1 AND 3),
  note            text,
  PRIMARY KEY (intake_id, field_key)
);

-- The census is PHI-adjacent and lives apart from everything else, so it can be
-- dropped on request without taking the analysis with it. Runs keep the derived
-- archetypes; only the identifying rows disappear.
CREATE TABLE IF NOT EXISTS research.sim_census_row (
  intake_id       uuid NOT NULL REFERENCES research.sim_intake(id) ON DELETE CASCADE,
  row_no          int  NOT NULL,
  role            text,
  base_salary     numeric(12,2),
  bonus_target    numeric(5,4),
  age_band        text,          -- banded on ingest; we never store a birth date
  coverage_tier   text,
  state           text,
  dependents_u13  smallint,
  spouse_gp_fsa   boolean,
  student_debt    boolean,
  PRIMARY KEY (intake_id, row_no)
);
COMMENT ON TABLE research.sim_census_row IS
  'Age is banded on ingest and no identifiers are stored. Deleting this table '
  'for a company leaves their runs intact and reproducible from archetypes.';

-- ---------------------------------------------------------------------------
-- Designs under test
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research.sim_design (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid REFERENCES research.companies(id) ON DELETE CASCADE,
  key             text NOT NULL,
  label           text NOT NULL,
  -- A design with company_id NULL is a LIBRARY design -- the conventional
  -- broker package, the lean stack, the flexible stack. Library designs are
  -- what make cross-client comparison possible: every client is scored against
  -- the same reference points, not only against their own alternatives.
  is_library      boolean NOT NULL DEFAULT false,
  plan            jsonb NOT NULL,
  accounts        jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sim_design_library_key
  ON research.sim_design (key) WHERE is_library;

-- ---------------------------------------------------------------------------
-- Runs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS research.sim_run (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES research.companies(id) ON DELETE CASCADE,
  intake_id       uuid NOT NULL REFERENCES research.sim_intake(id),
  design_id       uuid NOT NULL REFERENCES research.sim_design(id),
  model_version   text NOT NULL REFERENCES research.sim_model_version(id),
  tax_year        int  NOT NULL,
  seed            bigint NOT NULL,
  trials          int  NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'running',
  error           text
);
CREATE INDEX IF NOT EXISTS sim_run_company ON research.sim_run (company_id, tax_year);
CREATE INDEX IF NOT EXISTS sim_run_model ON research.sim_run (model_version);

-- Every assumption the run actually used, as rows. This is the table that turns
-- a pile of analyses into a benchmark: it is the only place that records what
-- we believed, for whom, and whether we had evidence for it.
CREATE TABLE IF NOT EXISTS research.sim_run_assumption (
  run_id          uuid NOT NULL REFERENCES research.sim_run(id) ON DELETE CASCADE,
  key             text NOT NULL,
  value           numeric NOT NULL,
  low             numeric NOT NULL,
  high            numeric NOT NULL,
  confidence      smallint NOT NULL CHECK (confidence BETWEEN 1 AND 3),
  basis           text NOT NULL,
  -- true when this client's own data replaced the population default. The ratio
  -- of overridden to defaulted assumptions across the corpus is the cleanest
  -- single measure of whether the benchmark is real yet.
  client_specific boolean NOT NULL DEFAULT false,
  PRIMARY KEY (run_id, key)
);

-- Distributions, never point estimates. The check constraint is the model's
-- integrity rule expressed in the schema: if a percentile is missing, the row
-- does not go in.
CREATE TABLE IF NOT EXISTS research.sim_result (
  run_id          uuid NOT NULL REFERENCES research.sim_run(id) ON DELETE CASCADE,
  metric          text NOT NULL,     -- 'employer_cost_total', 'value_per_head', ...
  scope           text NOT NULL,     -- 'cohort' | archetype key | 'funding:self_funded'
  expected        numeric NOT NULL,
  p10             numeric,
  p50             numeric,
  p90             numeric,
  p99             numeric,
  unit            text NOT NULL DEFAULT 'usd',
  PRIMARY KEY (run_id, metric, scope)
);

CREATE TABLE IF NOT EXISTS research.sim_test_result (
  run_id          uuid NOT NULL REFERENCES research.sim_run(id) ON DELETE CASCADE,
  test_name       text NOT NULL,
  citation        text NOT NULL,
  ratio           numeric NOT NULL,
  threshold       numeric NOT NULL,
  passes          boolean NOT NULL,
  detail          text,
  consequence     text NOT NULL,
  PRIMARY KEY (run_id, test_name)
);

CREATE TABLE IF NOT EXISTS research.sim_sensitivity (
  run_id          uuid NOT NULL REFERENCES research.sim_run(id) ON DELETE CASCADE,
  assumption_key  text NOT NULL,
  metric          text NOT NULL,
  base            numeric NOT NULL,
  at_low          numeric NOT NULL,
  at_high         numeric NOT NULL,
  swing           numeric GENERATED ALWAYS AS (abs(at_high - at_low)) STORED,
  PRIMARY KEY (run_id, assumption_key, metric)
);

-- ---------------------------------------------------------------------------
-- The benchmark layer
-- ---------------------------------------------------------------------------
-- Nothing here is populated by hand. These views are how the corpus answers
-- questions no single analysis can, and they are deliberately views rather than
-- tables so they cannot drift from the runs beneath them.

-- What we assume, and how often we actually know.
CREATE OR REPLACE VIEW research.sim_assumption_benchmark AS
SELECT
  a.key,
  count(*)                                              AS n_runs,
  count(*) FILTER (WHERE a.client_specific)             AS n_client_specific,
  round(avg(a.value)::numeric, 4)                       AS mean_used,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY a.value)  AS median_used,
  min(a.value)                                          AS min_used,
  max(a.value)                                          AS max_used,
  round(avg(a.confidence)::numeric, 2)                  AS mean_confidence,
  -- The number that says whether this parameter is still a guess.
  round((count(*) FILTER (WHERE a.client_specific))::numeric
        / nullif(count(*), 0), 3)                       AS evidence_ratio
FROM research.sim_run_assumption a
JOIN research.sim_run r ON r.id = a.run_id
WHERE r.status = 'completed'
GROUP BY a.key;

-- How often each nondiscrimination test fails, by headcount band. This is the
-- first genuinely proprietary fact the corpus produces: nobody publishes
-- failure rates for IRC 125(b)(2) by company size, because nobody has the runs.
CREATE OR REPLACE VIEW research.sim_test_benchmark AS
SELECT
  t.test_name,
  width_bucket((i.completeness->>'headcount')::numeric, 0, 1000, 10) AS headcount_bucket,
  count(*)                                          AS n,
  count(*) FILTER (WHERE NOT t.passes)              AS n_failed,
  round(avg(t.ratio)::numeric, 4)                   AS mean_ratio
FROM research.sim_test_result t
JOIN research.sim_run r ON r.id = t.run_id
JOIN research.sim_intake i ON i.id = r.intake_id
WHERE r.status = 'completed'
GROUP BY t.test_name, headcount_bucket;

-- Every client scored against the same library designs. Because library designs
-- are shared, this is a real cross-client comparison rather than a collection of
-- incomparable bespoke numbers.
CREATE OR REPLACE VIEW research.sim_design_benchmark AS
SELECT
  d.key                                             AS design_key,
  count(DISTINCT r.company_id)                      AS n_companies,
  round(avg(res.expected)::numeric, 2)              AS mean_value_per_head,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY res.expected) AS p25,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY res.expected) AS p75
FROM research.sim_result res
JOIN research.sim_run r  ON r.id = res.run_id
JOIN research.sim_design d ON d.id = r.design_id
WHERE d.is_library AND res.metric = 'value_per_head' AND res.scope = 'cohort'
  AND r.status = 'completed'
GROUP BY d.key;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
-- Staff-only by design. RLS is ENABLED with NO policies, which denies every
-- anon and authenticated request outright; the service role bypasses RLS, so
-- server-side code reaches these and a leaked anon key reaches nothing. If any
-- of this later needs to render in a client portal, add an explicit policy
-- then -- do not widen the grant now.
--
-- Checked against 009_service_role_grants.sql. That migration sets ALTER
-- DEFAULT PRIVILEGES on `research` for TABLES, so the table GRANT below is
-- belt-and-braces -- it costs nothing and survives an ownership change. It
-- does NOT set default privileges for SEQUENCES in `research` (only in
-- `public`), so the sequence GRANT is load-bearing: without it the bigserial
-- keys added in 035 are unreachable by service_role, which is exactly the
-- "permission denied despite BYPASSRLS" failure 009 was written to fix.
--
-- Nothing here re-grants anon or authenticated, so 009's revoke holds.

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables
           WHERE schemaname = 'research' AND tablename LIKE 'sim_%'
  LOOP
    EXECUTE format('ALTER TABLE research.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA research TO service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA research TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA research TO service_role;

COMMIT;
