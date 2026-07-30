#!/usr/bin/env node
/**
 * Research pipeline dry run.
 *
 *   npm run research:dryrun
 *
 * Compiles the research module to a temp dir and exercises the whole DAG
 * against a deterministic mock model. No database, no API key, no tokens spent.
 *
 * Checks: wave ordering, dependency resolution, JSON extraction from fenced and
 * prose-wrapped output, overall-score recomputation, optional-step degradation,
 * required-step failure, resumability without repeating work, the concurrency
 * claim, and the workforce fallback path.
 *
 * Run this before touching prompts, the wave plan, or the scoring weights.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".dryrun-build");
const tsc = path.join(ROOT, "node_modules", ".bin", "tsc");

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });

  process.stdout.write("Compiling research module… ");
  try {
    execFileSync(
      tsc,
      [
        ...globTs("lib/modules/research/data"),
        ...globTs("lib/modules/research/pipeline"),
        "lib/modules/research/report.ts",
        "--outDir", OUT,
        "--module", "commonjs",
        "--target", "ES2020",
        "--moduleResolution", "node",
        "--skipLibCheck",
        "--esModuleInterop",
      ],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (e) {
    console.log("failed\n");
    process.stdout.write(e.stdout?.toString() ?? "");
    process.stderr.write(e.stderr?.toString() ?? "");
    process.exit(1);
  }
  console.log("ok\n");

  runChecks(
    require(path.join(OUT, "pipeline", "__dryrun__.js")),
    require(path.join(OUT, "pipeline", "llm.js")),
    require(path.join(OUT, "report.js")),
  );
}

function globTs(dir) {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(dir, f));
}

async function runChecks(D, { createMockClient }, R) {
  let fail = 0;
  const ok = (cond, msg, extra = "") => {
    console.log(`  ${cond ? "✓" : "✗"} ${msg}${extra ? "  " + extra : ""}`);
    if (!cond) fail++;
  };

  const drive = async (store, jobId, llm, limit = 30) => {
    for (let i = 0; i < limit; i++) {
      const r = await D.advance(store, jobId, llm);
      if (r.done || r.error) return r;
    }
    return null;
  };

  console.log("── Plan integrity ──");
  const problems = D.validatePlan();
  ok(problems.length === 0, "wave order satisfies declared dependencies", problems.join(" | "));
  ok(D.WAVES.flat().length === D.STEPS.length, `all ${D.STEPS.length} steps assigned to a wave`);

  console.log("\n── Happy path ──");
  const calls = [];
  const store = new D.MemoryJobStore();
  const job = store.create({ companyName: "Meridian Manufacturing", industry: "Manufacturing" });
  const final = await drive(
    store, job.id,
    createMockClient({ responses: D.MOCK_RESPONSES, onCall: (l) => calls.push(l) }),
  );
  ok(!!final?.done, "job completed");
  ok(calls.length === 10, "10 model calls", `(${calls.length})`);
  ok((final?.result?.workforceData?.benefitDesign?.length ?? 0) > 0, "benefit design derived");

  console.log("\n── Scoring ──");
  const s = final.result.scores;
  ok(s.overallScore !== 99, "model's bogus overallScore overwritten", `-> ${s.overallScore}`);
  const expected =
    Math.round(((42 * 13 + 38 * 13 + 30 * 13 + 45 * 10 + 33 * 10 + 55 * 10 + 48 * 11 + 29 * 11) / 91) * 10) / 10;
  ok(Math.abs(s.overallScore - expected) < 0.15, "recomputed from normalised weights", `~${expected}`);
  ok(s._fallback !== true, "real scores, not fallback");

  console.log("\n── Optional step degrades ──");
  const s2 = new D.MemoryJobStore();
  const j2 = s2.create({ companyName: "Meridian Manufacturing" });
  const f2 = await drive(s2, j2.id, createMockClient({
    responses: D.MOCK_RESPONSES, failOn: ["linkedin", "regulatory"],
  }));
  ok(!!f2?.done, "completed with optional steps failing");
  ok(s2.get(j2.id).steps.scoring.status === "done", "scoring ran despite skipped dependency");

  console.log("\n── Required step failure ──");
  const s3 = new D.MemoryJobStore();
  const j3 = s3.create({ companyName: "Meridian Manufacturing" });
  const f3 = await drive(s3, j3.id, createMockClient({
    responses: D.MOCK_RESPONSES, failOn: ["profile"],
  }));
  ok(!!f3?.error, "job failed as expected");
  ok(s3.get(j3.id).status === "failed", "status is failed");

  console.log("\n── Resumability ──");
  const s4 = new D.MemoryJobStore();
  const j4 = s4.create({ companyName: "Meridian Manufacturing" });
  for (let i = 0; i < 4; i++) {
    await D.advance(s4, j4.id, createMockClient({
      responses: D.MOCK_RESPONSES, failOn: ["workforce", "workforce-fallback"],
    }));
  }
  const doneBefore = Object.entries(s4.get(j4.id).steps)
    .filter(([, v]) => v.status === "done").map(([k]) => k);
  const second = [];
  const f4 = await drive(s4, j4.id, createMockClient({
    responses: D.MOCK_RESPONSES, onCall: (l) => second.push(l),
  }));
  ok(!!f4?.done, "resumed to completion");
  ok(doneBefore.filter((id) => second.includes(id)).length === 0,
     "no completed step re-called", `(2nd pass: ${second.join(",")})`);

  console.log("\n── Concurrency ──");
  const s5 = new D.MemoryJobStore();
  const j5 = s5.create({ companyName: "Meridian Manufacturing" });
  const llm5 = createMockClient({ responses: D.MOCK_RESPONSES });
  const both = await Promise.all([D.advance(s5, j5.id, llm5), D.advance(s5, j5.id, llm5)]);
  ok(both.filter((r) => r.wave !== null).length === 1, "only one advance claimed the job");

  console.log("\n── Workforce fallback ──");
  const s6 = new D.MemoryJobStore();
  const j6 = s6.create({ companyName: "Meridian Manufacturing" });
  const seen6 = [];
  const f6 = await drive(s6, j6.id, createMockClient({
    responses: { ...D.MOCK_RESPONSES, workforce: "not json at all" },
    onCall: (l) => seen6.push(l),
  }));
  ok(seen6.includes("workforce-fallback"), "fallback agent invoked");
  ok(!!f6?.done, "completed via fallback");

  // ── Report assembly ──────────────────────────────────────────────────────
  console.log("\n── Report assembly ──");
  const content = final.result;

  const summary = R.assembleReport({ content, view: "summary" });
  const full    = R.assembleReport({ content, view: "full" });

  ok(!summary.visibleSections.includes("workforce"),
     "summary withholds Workforce Intelligence");
  ok(!summary.visibleSections.includes("benefitDesign"),
     "summary withholds Benefit Design");
  ok(!summary.visibleSections.includes("brief"),
     "summary withholds the internal brief");
  ok(summary.visibleSections.includes("regulatory"),
     "summary includes Regulatory Exposure");
  ok(summary.visibleSections.length === 4,
     "summary shows 4 sections", `(${summary.visibleSections.join(",")})`);
  ok(full.visibleSections.length === 7, "full shows all 7 sections");
  ok(summary.withheldSections.length === 3, "summary reports 3 withheld sections");

  ok(summary.findings.length > 0, "findings derived without an extra model call",
     `(${summary.findings.length})`);
  ok(summary.findings.every(f => f.edited === false), "derived findings not marked edited");

  console.log("\n── Edit overlay ──");
  const edited = R.assembleReport({
    content,
    view: "summary",
    edits: {
      scores: { cfoEngagement: 80 },
      narrative: { findings: ["Hand-written finding."], summary: "Rewritten summary." },
      hiddenSections: ["regulatory"],
    },
  });
  ok(edited.scores.cfoEngagement === 80, "score override applied");
  ok(content.scores.cfoEngagement === 55, "content NOT mutated by the overlay",
     `(still ${content.scores.cfoEngagement})`);
  ok(edited.anyScoreAdjusted === true, "adjustment flagged");
  ok(edited.axes.find(a => a.key === "cfoEngagement").modelScore === 55,
     "model's original score still visible alongside the override");
  ok(edited.overallScore !== summary.overallScore,
     "overall recomputed from the edited axis",
     `${summary.overallScore} -> ${edited.overallScore}`);
  ok(edited.findings.length === 1 && edited.findings[0].edited === true,
     "narrative override replaces findings and is marked edited");
  ok(edited.summary === "Rewritten summary.", "summary override applied");
  ok(!edited.visibleSections.includes("regulatory"),
     "explicit hide overrides the view default");

  console.log("\n── Release guard ──");
  const clean = R.releaseBlockers({ content, reviewedAt: "2026-07-29T00:00:00Z" });
  ok(clean.length === 0, "reviewed, complete report has no blockers", clean.join("; "));
  ok(R.releaseBlockers({ content, reviewedAt: null })
      .some(b => /reviewed/i.test(b)), "unreviewed report is blocked");
  const fb = JSON.parse(JSON.stringify(content));
  fb.scores._fallback = true;
  ok(R.releaseBlockers({ content: fb, reviewedAt: "x" })
      .some(b => /fallback/i.test(b)), "fallback scores block release");
  const missing = JSON.parse(JSON.stringify(content));
  delete missing.scores.cfoEngagement;
  ok(R.releaseBlockers({ content: missing, reviewedAt: "x" })
      .some(b => /CFO Engagement/.test(b)), "missing axis blocks release and names it");

  // ── Revise agent ─────────────────────────────────────────────────────────
  console.log("\n── Revise agent ──");
  const { reviseSection } = require(path.join(OUT, "pipeline", "revise.js"));

  const reviseMock = createMockClient({
    responses: {
      "revise:findings": JSON.stringify({
        text: "Absence cost, not premium, is the lever here.",
        note: "Removed the vendor name and sharpened the economic claim.",
      }),
      "revise:profile": "Plain prose, no JSON envelope at all.",
    },
  });

  const r1 = await reviseSection({
    section: "findings",
    current: "Old finding text.",
    comment: "Drop the vendor name and lead with absence economics.",
    content,
    llm: reviseMock,
  });
  ok(r1.text.includes("Absence cost"), "structured revision parsed");
  ok(r1.note.length > 0, "revision note captured for the audit trail");

  const r2 = await reviseSection({
    section: "profile",
    current: "Old profile.",
    comment: "Tighten it.",
    content,
    llm: reviseMock,
  });
  ok(r2.text.startsWith("Plain prose"),
     "unstructured model output still accepted rather than losing the call");

  let threw = false;
  try {
    await reviseSection({
      section: "brief",
      current: "x",
      comment: "y",
      content,
      llm: createMockClient({ responses: { "revise:brief": "no" } }),
    });
  } catch { threw = true; }
  ok(threw, "too-short output rejected instead of overwriting good text with junk");

  // The overlay must carry the revision without touching content.
  const withRevision = R.assembleReport({
    content,
    view: "summary",
    edits: { narrative: { findings: [r1.text] } },
  });
  ok(withRevision.findings[0].text === r1.text, "revision surfaces through the overlay");
  ok(withRevision.findings[0].edited === true, "revised finding marked as edited");
  ok(content.scores.cfoEngagement === 55, "content still untouched after revision");

  fs.rmSync(OUT, { recursive: true, force: true });
  console.log("\n" + (fail === 0 ? "ALL CHECKS PASSED" : `${fail} CHECK(S) FAILED`));
  process.exit(fail ? 1 : 0);
}

main();
