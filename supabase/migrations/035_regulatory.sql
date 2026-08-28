-- 035_regulatory.sql
--
-- The regulatory store: state and federal rules, each with the date we last
-- verified it.
--
-- Depends on: research_schema.sql (the `research` schema must exist) AND
-- 034_simulation.sql. The tables themselves are standalone -- no foreign keys
-- leave this file -- but the sim_regulatory_exposure view at the bottom joins
-- sim_run and sim_intake to answer the only question that makes the store
-- worth keeping: when a rule moves, WHICH CLIENTS does it change an answer for?
-- If you want the store without 034, drop that one view and the rest applies.
--
-- WHY THIS EXISTS
--
-- A state insurance mandate binds INSURANCE COMPANIES, not employers. ERISA's
-- savings clause (29 USC 1144(b)(2)(A)) lets a state regulate insurance, so a
-- mandate reaches a fully insured plan. The deemer clause (1144(b)(2)(B))
-- stops a state reaching a self-funded plan -- level funding included. So the
-- same benefit has two prices, and which one an employer pays was decided by a
-- funding choice made months earlier for unrelated reasons. Governmental and
-- church plans are outside ERISA entirely (29 USC 1003(b)) and get a third
-- answer, which is why self_insured_reach is three-valued.
--
-- Rows are IMMUTABLE. A correction is a new id with supersedes_id set.

BEGIN;

-- ===========================================================================
-- THE REGULATORY STORE
-- ===========================================================================
--
-- Where 034 answers "what did we model?", this answers "what does the law
-- require, where, of whom, and when did we last check?"
--
-- Three design decisions, each of which exists because of a specific way this
-- kind of store goes wrong:
--
--   1. APPEND, NEVER UPDATE. A mandate record is immutable once written. A
--      change is a new row with supersedes_id pointing back. Overwriting is
--      how you end up unable to answer "was that true when we advised them?",
--      and that question does eventually get asked, usually by a lawyer.
--
--   2. FRESHNESS IS A FIELD, NOT A VIBE. Every row carries verified_at,
--      verified_by and a recheck window. A record with no verification date is
--      not a fact, it is a memory. The stale view is the sweep's work queue.
--
--   3. COVER AND OFFER ARE DIFFERENT COLUMNS OF THE SAME ENUM, and
--      self_insured_reach is three-valued rather than boolean. Those two
--      fields carry almost all the real-world consequence, and flattening
--      either one is how a store quietly starts lying.

DO $$ BEGIN
  CREATE TYPE research.sim_mandate_type AS ENUM (
    'cover',        -- policy must include it
    'offer',        -- carrier must make it available; employer still buys it
    'benchmark',    -- reaches the market via the state EHB benchmark plan
    'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE research.sim_mandate_status AS ENUM (
    'in_force',
    'enacted_not_yet_effective',
    'contingent',   -- enacted, conditioned on an approval that has not happened
    'pending',      -- live bill, not law
    'died',
    'repealed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Three-valued on purpose. 'partial' is the governmental / church case, where
-- there is no ERISA to preempt with, so a state mandate reaches even a
-- self-funded plan.
DO $$ BEGIN
  CREATE TYPE research.sim_self_insured_reach AS ENUM ('yes', 'no', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS research.sim_regulatory_mandate (
  id                  text PRIMARY KEY,             -- 'REG-CA-FERT-001'
  jurisdiction        text NOT NULL,                -- 'CA', 'DC', 'US'
  topic               text NOT NULL,                -- 'fertility_ivf'
  summary             text NOT NULL,

  mandate_type        research.sim_mandate_type   NOT NULL,
  status              research.sim_mandate_status NOT NULL,
  statute             text NOT NULL,
  url                 text,
  effective_on        date,

  -- Scope. Any of these being null means "the statute does not set one",
  -- which is different from "we do not know" -- that is what confidence is for.
  market_segments     text[] NOT NULL DEFAULT '{}', -- individual|small_group|large_group
  size_threshold      integer,
  limits              jsonb  NOT NULL DEFAULT '{}'::jsonb,  -- cycles, caps, ages
  exemptions          text[] NOT NULL DEFAULT '{}',

  -- The ERISA question, which is the one that decides the money.
  self_insured_reach  research.sim_self_insured_reach NOT NULL DEFAULT 'no',
  erisa_note          text,

  -- Coverage is not access. Kept as its own field so a utilisation assumption
  -- can cite it rather than inventing one.
  access_notes        text,

  verified_at         date NOT NULL,
  verified_by         text NOT NULL,                -- 'agent:regulatory-sweep' | 'human:tld'
  confidence          smallint NOT NULL CHECK (confidence BETWEEN 1 AND 3),
  recheck_days        integer NOT NULL DEFAULT 90,
  supersedes_id       text REFERENCES research.sim_regulatory_mandate(id),
  axionia_take        text,
  tags                text[] NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN research.sim_regulatory_mandate.confidence IS
  '3 = primary source read. 2 = reliable secondary. 1 = identified but not '
  'verified -- must not appear in a client deliverable.';

CREATE INDEX IF NOT EXISTS sim_reg_topic_juris
  ON research.sim_regulatory_mandate (topic, jurisdiction);

-- Every sweep, whether or not it found anything. A month with no changes is
-- itself a fact, and without this table it is indistinguishable from a month
-- the agent failed to run.
CREATE TABLE IF NOT EXISTS research.sim_regulatory_sweep (
  id              bigserial PRIMARY KEY,
  ran_at          timestamptz NOT NULL DEFAULT now(),
  ran_by          text NOT NULL,
  topics          text[] NOT NULL DEFAULT '{}',
  records_checked integer NOT NULL DEFAULT 0,
  records_added   integer NOT NULL DEFAULT 0,
  records_changed integer NOT NULL DEFAULT 0,
  no_change       boolean NOT NULL DEFAULT false,
  notes           text
);

-- What changed, in a form a human can read in thirty seconds. This is the
-- monthly note that goes to the team, and the audit trail if a client asks why
-- our advice moved.
CREATE TABLE IF NOT EXISTS research.sim_regulatory_change (
  id            bigserial PRIMARY KEY,
  sweep_id      bigint NOT NULL REFERENCES research.sim_regulatory_sweep(id),
  mandate_id    text   NOT NULL REFERENCES research.sim_regulatory_mandate(id),
  change_kind   text   NOT NULL,   -- 'added'|'status'|'scope'|'effective'|'verified_only'
  before_value  jsonb,
  after_value   jsonb,
  -- Written by the sweep in plain language: who this changes an answer for.
  client_impact text
);

-- Which clients an answer just changed for. The reason the store exists is that
-- a mandate change is not interesting in the abstract -- it is interesting
-- because six specific companies are fully insured in that state.
CREATE OR REPLACE VIEW research.sim_regulatory_exposure AS
SELECT
  m.id            AS mandate_id,
  m.jurisdiction,
  m.topic,
  m.mandate_type,
  r.company_id,
  (i.completeness->>'funding')      AS funding,
  (i.completeness->>'headcount')::numeric AS headcount,
  CASE
    WHEN (i.completeness->>'funding') = 'fully_insured'
     AND m.mandate_type = 'cover'
     AND (m.size_threshold IS NULL
          OR (i.completeness->>'headcount')::numeric >= m.size_threshold)
      THEN 'covered_inside_premium'
    WHEN (i.completeness->>'funding') <> 'fully_insured'
     AND m.self_insured_reach = 'no'
      THEN 'forfeited_by_funding_choice'
    ELSE 'no_effect'
  END AS effect
FROM research.sim_regulatory_mandate m
JOIN research.sim_run r  ON true
JOIN research.sim_intake i ON i.id = r.intake_id
WHERE m.status IN ('in_force', 'enacted_not_yet_effective')
  AND (i.completeness->>'state') = m.jurisdiction;

-- The sweep's work queue: anything past its own recheck window, worst first.
CREATE OR REPLACE VIEW research.sim_regulatory_stale AS
SELECT
  m.*,
  (current_date - m.verified_at) AS days_since_verified,
  (current_date - m.verified_at) - m.recheck_days AS days_overdue
FROM research.sim_regulatory_mandate m
WHERE NOT EXISTS (SELECT 1 FROM research.sim_regulatory_mandate s
                  WHERE s.supersedes_id = m.id)
  AND (current_date - m.verified_at) > m.recheck_days
ORDER BY days_overdue DESC;


-- ---------------------------------------------------------------------------
-- Access -- same rule as 034. Staff only.
--
-- The sequence grant matters here specifically: sim_regulatory_sweep and
-- sim_regulatory_change use bigserial, and 009_service_role_grants.sql sets
-- default privileges for sequences in `public` but not in `research`. Without
-- this line an INSERT fails on the sequence, not the table, which is a
-- confusing error to debug at 6am when the monthly sweep writes its first row.
-- ---------------------------------------------------------------------------

ALTER TABLE research.sim_regulatory_mandate ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.sim_regulatory_sweep   ENABLE ROW LEVEL SECURITY;
ALTER TABLE research.sim_regulatory_change  ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA research TO service_role;
GRANT ALL ON research.sim_regulatory_mandate TO service_role;
GRANT ALL ON research.sim_regulatory_sweep   TO service_role;
GRANT ALL ON research.sim_regulatory_change  TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA research TO service_role;


-- ---------------------------------------------------------------------------
-- Seed. Verified 12 Aug 2026. Generated from axionia_sim/regulatory.py --
-- regenerate with:  python3 -c "from axionia_sim import regulatory as R; print(R.export_sql())"
-- ---------------------------------------------------------------------------

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-CA-FERT-001', 'CA', 'fertility_ivf', 'Large group (100+) plans must COVER IVF. Small group must be OFFERED it.', 'cover'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'SB 729 (2024), amending Cal. Health & Safety Code 1374.55 and Ins. Code 10119.6; effective date pushed from 1 Jul 2025 to 1 Jan 2026 by AB 116', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB729', '2026-01-01'::date, ARRAY['large_group']::text[], 100, '{"oocyte_retrievals": 3, "embryo_transfers": "unlimited", "small_group_treatment": "offer only"}'::jsonb, ARRAY['religious employer']::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 90, NULL, 'The size threshold is the whole story for a firm our clients'' size. At 100+ employees in California and fully insured, IVF arrives inside the premium and costs nothing to add. Under 100, the carrier only has to offer it.', ARRAY['fertility','erisa','size-threshold']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-IL-FERT-001', 'IL', 'fertility_ivf', 'Infertility coverage required, expanded in 2026 to remove several restrictions on who qualifies.', 'cover'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, '215 ILCS 5/356m, as amended by SB 773 (2023)', 'https://www.ilga.gov/legislation/ilcs/documents/021500050K356m.htm', '2026-01-01'::date, ARRAY['large_group','small_group']::text[], 25, '{"note": "statute applies to group policies covering more than 25 employees"}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 2, 90, NULL, 'One of the oldest mandates in the country and still one of the broadest. The 2026 expansion widened eligibility rather than the benefit itself.', ARRAY['fertility','erisa']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-DC-FERT-001', 'DC', 'fertility_ivf', 'Fertility coverage including IVF required for large group plans.', 'cover'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'D.C. Law 25-171, Fertility Treatment and Insurance Coverage Amendment Act', 'https://code.dccouncil.gov/us/dc/council/laws/25-171', '2025-01-01'::date, ARRAY['large_group']::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 2, 90, NULL, NULL, ARRAY['fertility','erisa']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-ME-FERT-001', 'ME', 'fertility_ivf', 'Fertility diagnosis, treatment and IVF required in group plans.', 'cover'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, '24-A M.R.S. 4320-Q (LD 1539, 2022)', 'https://legislature.maine.gov/statutes/24-A/title24-Asec4320-Q.html', '2024-01-01'::date, ARRAY['large_group','small_group']::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 2, 90, NULL, NULL, ARRAY['fertility','erisa']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-NY-FERT-001', 'NY', 'fertility_ivf', 'Large group (100+) plans must cover three cycles of IVF.', 'cover'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'N.Y. Ins. Law 3221(k)(6) and 4303(s)', 'https://www.dfs.ny.gov/consumers/health_insurance/fertility_services', '2020-01-01'::date, ARRAY['large_group']::text[], 100, '{"ivf_cycles": 3}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 90, NULL, 'The template most later mandates copied: 100+ employees, a fixed cycle count, fully insured only.', ARRAY['fertility','erisa','size-threshold']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-TX-FERT-001', 'TX', 'fertility_ivf', 'Carriers must OFFER IVF coverage. Employers may decline, and most do.', 'offer'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'Tex. Ins. Code ch. 1366, subch. A', 'https://statutes.capitol.texas.gov/Docs/IN/htm/IN.1366.htm', '1987-09-01'::date, ARRAY['large_group','small_group']::text[], NULL, '{}'::jsonb, ARRAY['religious employer']::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 90, NULL, 'The clearest example of why the cover/offer distinction matters. Texas appears on every ''states with IVF mandates'' list and delivers almost no coverage, because the employer still has to say yes and pay.', ARRAY['fertility','offer-only','counting-error']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-VA-FERT-001', 'VA', 'fertility_ivf', 'Fertility coverage added through the state EHB benchmark plan, contingent on federal approval.', 'benchmark'::research.sim_mandate_type, 'contingent'::research.sim_mandate_status, 'HB 328, enacted 22 Apr 2026, Va. Acts ch. 1048', 'https://lis.virginia.gov/cgi-bin/legp604.exe?261+sum+HB328', NULL, ARRAY['individual','small_group']::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included. Benchmark route additionally excludes large group, so a 100-person employer is outside it either way.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 2, 60, NULL, 'Reads like a coverage win in the trade press and reaches almost no employer plans. Contingent on CMS approval and capped to individual and small group by construction.', ARRAY['fertility','ehb','contingent']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-MN-FERT-001', 'MN', 'fertility_ivf', 'No IVF mandate. HF1758 / SF1961 DIED at sine die adjournment of the 2026 session.', 'none'::research.sim_mandate_type, 'died'::research.sim_mandate_status, 'HF1758 / SF1961, 94th Legislature; no further action after sine die', 'https://www.fox9.com/news/minnesota-legislature-2026-session-ends', NULL, '{}'::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Moot -- there is no mandate. Had it passed it would have bound fully insured policies only.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 120, NULL, 'Widely reported as effective 1 Jan 2026 by secondary sources and by fertility-vendor marketing. It is not law. This record exists so we never have to re-establish that, and so we catch it the session it is reintroduced.', ARRAY['fertility','minnesota','died','correction']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-MULTI-FERT-000', 'US', 'fertility_ivf', 'Roughly 15-17 states plus DC have a mandate reaching IVF; several are offer-only. Full state-by-state verification is incomplete.', 'none'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'RESOLVE and NCSL trackers, cross-checked against KFF', 'https://resolve.org/learn/financial-resources-for-family-building/insurance-coverage/insurance-coverage-by-state/', NULL, '{}'::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'Private-sector plan: reaches fully insured only. 29 USC 1144(b)(2)(A) saves state insurance regulation; 1144(b)(2)(B) blocks it from reaching a self-funded plan, level funding included.', 'Known to include AR, CO, CT, DE, HI, MD, MA, NH, NJ, RI, UT in some form. Each needs its own record with statute, threshold and cover-versus-offer read to primary source before it is used in a client deliverable.', '2026-08-12'::date, 'agent:regulatory-sweep', 1, 30, NULL, 'Deliberately logged as incomplete rather than left out. An empty store looks the same as a verified-nothing store, and the difference matters.', ARRAY['fertility','todo','coverage-gap']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-US-FERT-001', 'US', 'fertility_ivf', 'Infertility treatment is NOT an Essential Health Benefit. There is no federal coverage requirement.', 'none'::research.sim_mandate_type, 'in_force'::research.sim_mandate_status, 'ACA 1302; 45 CFR 156.110 -- infertility is not among the ten EHB categories', 'https://www.law.cornell.edu/cfr/text/45/156.110', NULL, '{}'::text[], NULL, '{}'::jsonb, '{}'::text[], 'no'::research.sim_self_insured_reach, 'No federal mandate exists to preempt or apply.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 180, NULL, 'This is why fertility is the one genuinely optional piece of maternity-adjacent coverage. Maternity itself is an EHB and cannot carry a dollar limit, so ''pick a carrier that covers maternity'' is not a real decision. Fertility is.', ARRAY['fertility','federal','ehb']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_mandate (id, jurisdiction, topic, summary, mandate_type, status, statute, url, effective_on, market_segments, size_threshold, limits, exemptions, self_insured_reach, erisa_note, access_notes, verified_at, verified_by, confidence, recheck_days, supersedes_id, axionia_take, tags) VALUES (
  'REG-US-FERT-002', 'US', 'fertility_ivf', 'Proposed federal rule would let employers offer a standalone fertility benefit as an EXCEPTED benefit, capped at $120,000 lifetime. Proposed only -- no legal effect.', 'none'::research.sim_mandate_type, 'pending'::research.sim_mandate_status, 'Proposed rule, comment period closed 13 Jul 2026; proposed effective 1 Jan 2027', 'https://www.federalregister.gov/', NULL, '{}'::text[], NULL, '{"lifetime_cap": 120000}'::jsonb, '{}'::text[], 'yes'::research.sim_self_insured_reach, 'If finalised, an excepted benefit sits outside the ACA annual dollar limit ban and outside plan integration rules, so it would reach self-funded employers too. That is what makes it worth tracking despite having no current effect.', NULL, '2026-08-12'::date, 'agent:regulatory-sweep', 3, 30, NULL, 'The first federal route that would give a SELF-FUNDED employer a fertility benefit without building it from scratch. Watch it; do not plan on it. Proposed rules die routinely and this one has an obvious cost objection.', ARRAY['fertility','federal','watchlist','excepted-benefit']::text[]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO research.sim_regulatory_sweep (ran_by, topics, records_checked, records_added, notes)
SELECT 'human:tld+claude', ARRAY['fertility_ivf']::text[], 11, 11,
       'Initial seed. Established that MN HF1758/SF1961 died at sine die of the '
       '2026 session, correcting a prior record that had it in committee. '
       'Kaiser fertility-steering claim searched and NOT substantiated -- held '
       'as an unverified anecdote in the evidence library (FER005), not here.'
WHERE NOT EXISTS (SELECT 1 FROM research.sim_regulatory_sweep
                  WHERE ran_by = 'human:tld+claude' AND records_added = 11);

COMMIT;
