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

  // ── Identity gate ────────────────────────────────────────────────────────
  /*
    A run once analysed a fertility vendor as a behavioral health employer:
    wrong at call two, faithfully inherited by the other eight. The job must
    now stop after wave 1 until a person ratifies the identity.

    The happy path above passes because MemoryJobStore.create marks validate
    pre-confirmed — otherwise every existing check would park at the gate. This
    exercises the gate itself.
  */
  console.log("\n── Identity gate ──");
  const sg = new D.MemoryJobStore();
  const jg = sg.create({ companyName: "Meridian Manufacturing" }, { gated: true });
  const llmG = createMockClient({ responses: D.MOCK_RESPONSES });

  const first = await D.advance(sg, jg.id, llmG);
  ok(sg.get(jg.id).status === "awaiting_confirmation",
     "job parks after wave 1", `(${sg.get(jg.id).status})`);
  ok(sg.get(jg.id).steps.validate?.status === "done", "validate still ran");
  ok(!first?.done, "and the job is not done");

  const spend = [];
  await D.advance(sg, jg.id, createMockClient({
    responses: D.MOCK_RESPONSES, onCall: (l) => spend.push(l),
  }));
  ok(spend.length === 0, "a poll at the gate spends nothing", `(${spend.length} calls)`);
  ok(sg.get(jg.id).nextWave === 0, "and does not walk past the gate");

  D.confirmIdentity(sg, jg.id, { industry: "Fertility & family building" });
  const st = sg.get(jg.id);
  ok(st.status === "paused", "confirming releases the gate", `(${st.status})`);
  ok(st.steps.validate.output.industry === "Fertility & family building",
     "the correction becomes the premise downstream reads");
  ok(st.steps.validate.modelOutput.industry !== "Fertility & family building",
     "and the model's original is preserved beside it",
     `(${st.steps.validate.modelOutput.industry})`);

  const afterG = await drive(sg, jg.id, createMockClient({ responses: D.MOCK_RESPONSES }));
  ok(!!afterG?.done, "job completes after confirmation");

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

  // ── Coherence fixes ──────────────────────────────────────────────────────
  console.log("\n── Coherence (from the PDF review) ──");

  const summ = R.assembleReport({ content, view: "full" });
  ok(summ.summary !== summ.findings[0]?.text,
     "summary is no longer findings[0] repeated verbatim");
  ok(summ.summary === content.workforceData.overallInsight,
     "summary uses the workforce synthesis");
  ok(!!summ.callToAction, "call to action present");
  ok(summ.callToAction.question === content.scores.conversationHook,
     "conversationHook finally rendered", `"${summ.callToAction.question}"`);

  const findingTexts = summ.findings.map(f => f.text.toLowerCase());
  ok(new Set(findingTexts).size === findingTexts.length, "no duplicate findings");

  // Benefit design must now key off the MODEL's segments.
  const bd = content.workforceData.benefitDesign ?? [];
  const modelNames = content.workforceData.segments.map(s => s.name);
  ok(bd.length > 0, "benefit design produced", `(${bd.length} segments)`);
  ok(bd.every(x => modelNames.includes(x.segment)),
     "benefit design segments match Workforce Intelligence segments",
     `(${bd.map(x=>x.segment).join(" / ")})`);

  const rationales = bd.flatMap(x => x.gap.map(g => g.gapRationale));
  ok(rationales.length === 0 || new Set(rationales).size > 1,
     "gap rationales are not one repeated template",
     `(${new Set(rationales).size} distinct of ${rationales.length})`);
  ok(!rationales.some(r => /commonly missing at\s*employers of this type/.test(r)),
     "the old filler sentence is gone");

  // Uncovered role types must decline rather than guess.
  const M = require(path.join(OUT, "data", "index.js"));
  // These two asserted the pre-dimension behaviour, where the library had no
  // home for either role. Both are now covered — that was the point.
  const pm = M.matchSegmentToLibrary("Portfolio Managers & Investment Principals");
  ok(pm.segmentId === "SEG006", "senior non-clinical professionals now have a segment",
     `(${pm.segmentId})`);
  ok(/very high|non-clinical/i.test(pm.reason), "and the reason cites dimensions",
     `"${pm.reason.slice(0, 64)}…"`);

  const mt = M.matchSegmentToLibrary("Maintenance Technicians", "", { replacementComplexity: "high" });
  ok(mt.segmentId === "SEG008", "maintenance technician maps to skilled trades", `(${mt.segmentId})`);
  ok(M.SEGMENTS_BY_ID.get(mt.segmentId).dimensions.clinical === false,
     "and that segment is not clinical");

  // Mandates now feed the report.
  ok(Array.isArray(summ.mandates.all), "curated mandates attached to the report");
  ok(summ.mandates.all.length > 0, "mandates found for MN/IL",
     `(${summ.mandates.all.length})`);
  ok(summ.mandates.selfInsuredFull.every(m => m.selfInsured === true),
     "self-insured-full list is exactly the true ones");
  ok(summ.mandates.selfInsuredPartial.every(m => m.selfInsured === "partial"),
     "partial list is exactly the partial ones");

  // ── Segment dimensions ───────────────────────────────────────────────────
  console.log("\n── Segment dimensions ──");
  const D2 = require(path.join(OUT, "data", "index.js"));

  ok(D2.SEGMENTS.length >= 9, "library expanded beyond the original five",
     `(${D2.SEGMENTS.length} segments)`);
  ok(D2.SEGMENTS.every(s => s.dimensions), "every segment carries dimensions");

  const expect = [
    ["Portfolio Managers & Investment Principals", "high", "SEG006"],
    ["Research Analysts & Associates", "high", "SEG007"],
    ["Software Engineers", "high", "SEG007"],
    ["Maintenance Technicians", "high", "SEG008"],
    ["Machine Operators", "medium", "SEG003"],
    ["Registered Nurses", "medium", "SEG002"],
    ["Dentists", "high", "SEG001"],
    ["Shift Supervisors", "medium", "SEG005"],
    ["Customer Success Managers", "medium", "SEG009"],
  ];
  let mism = 0;
  for (const [name, rc, want] of expect) {
    const r = D2.matchSegmentToLibrary(name, "", { replacementComplexity: rc });
    if (r.segmentId !== want) { mism++; console.log(`      ${name} -> ${r.segmentId} want ${want}`); }
  }
  ok(mism === 0, `${expect.length} role types map to the right segment`);

  // The discriminators that took two attempts to get right.
  ok(D2.matchSegmentToLibrary("Shift Supervisors","",{replacementComplexity:"medium"}).segmentId
     !== D2.matchSegmentToLibrary("Maintenance Technicians","",{replacementComplexity:"high"}).segmentId,
     "supervisory separates shift supervisor from maintenance technician");
  ok(D2.matchSegmentToLibrary("Portfolio Managers","",{}).segmentId !== "SEG001",
     "very-high-comp non-clinical does NOT land in Senior Clinical");
  ok(D2.inferDimensions({name:"Portfolio Manager"}).clinical === false,
     "clinical flag not set by pay level alone");
  ok(D2.inferDimensions({name:"Customer Success Manager"}).supervisory === false,
     "bare 'manager' is not treated as people-leadership");
  ok(D2.inferDimensions({name:"Shift Supervisor"}).supervisory === true,
     "'supervisor' is");

  // Coverage — the gap this was meant to close.
  const reach = new Set(D2.SEGMENTS.flatMap(s =>
    [...s.highValueBenefits, ...s.mediumValueBenefits, ...s.lowValueBenefits]));
  const unreachable = D2.BENEFITS.filter(b => !reach.has(b.id));
  ok(unreachable.length === 0, "every benefit is now reachable from some segment",
     unreachable.length ? `(${unreachable.map(b=>b.id).join(",")} still orphaned)` : "(was 10 of 30)");
  const f5 = D2.BENEFITS.filter(b => b.financial === 5);
  ok(f5.every(b => reach.has(b.id)),
     "all financial:5 benefits reachable", `(${f5.length} of them)`);

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

  // ── Fallback cause capture ───────────────────────────────────────────────
  /*
    runScoring used to catch the LlmError and discard it, so "estimated
    defaults were substituted" came with no way to find out why. Both failure
    paths must now name themselves — and the quiet one is the second: the model
    can return parseable JSON that is simply missing axes, which raises nothing.
  */
  console.log("\n── Fallback cause ──");

  const sfA = new D.MemoryJobStore();
  const jfA = sfA.create({ companyName: "Meridian Manufacturing" });
  const fA = await drive(sfA, jfA.id, createMockClient({
    responses: D.MOCK_RESPONSES, failOn: ["scoring"],
  }));
  ok(fA?.result?.scores?._fallback === true, "call failure falls back");
  ok(typeof fA?.result?.scores?._fallbackReason === "string",
     "and records why", `"${(fA?.result?.scores?._fallbackReason ?? "").slice(0, 60)}…"`);
  ok(/failed/i.test(fA?.result?.scores?._fallbackReason ?? ""),
     "the reason names a failed call");

  const sfB = new D.MemoryJobStore();
  const jfB = sfB.create({ companyName: "Meridian Manufacturing" });
  const fB = await drive(sfB, jfB.id, createMockClient({
    // Valid JSON, three axes short. Raises nothing — this is the silent path.
    responses: {
      ...D.MOCK_RESPONSES,
      scoring: JSON.stringify({
        spendEfficiency: 40, vendorIndependence: 35, analyticsReadiness: 30,
        cfoEngagement: 45, workforceAlignment: 33,
      }),
    },
  }));
  ok(fB?.result?.scores?._fallback === true, "an incomplete score set falls back too");
  const rB = fB?.result?.scores?._fallbackReason ?? "";
  ok(/5 of 8/.test(rB), "and counts what came back", `"${rB.slice(0, 70)}…"`);
  ok(/decisionMaturity/.test(rB) && /regulatoryReadiness/.test(rB),
     "and names the missing axes rather than saying 'incomplete'");

  const asmF = R.assembleReport({ content: fB.result, view: "full" });
  ok(asmF.fallbackReason === rB, "the reason reaches the rendered report");
  ok(R.assembleReport({ content, view: "full" }).fallbackReason === null,
     "a healthy run carries no reason");

  // ── Industry → segment matching ──────────────────────────────────────────
  /*
    "Retail & Hospitality" used to match "hospital" on a raw substring and
    return the full clinical mix, led by Senior Clinical / Licensed
    Professionals — a restaurant group analysed as though it employed surgeons.
    These checks exist so that cannot come back quietly.
  */
  console.log("\n── Industry → segments ──");
  const seg = (s) => D2.getSegmentsForIndustry(s);

  ok(!seg("Retail & Hospitality").includes("SEG001"),
     "hospitality does NOT match hospital", `(${seg("Retail & Hospitality").join(",")})`);
  ok(seg("Hospitality / Restaurants")[0] === "SEG003",
     "hospitality leads with frontline");
  ok(seg("Hospital / Health System").includes("SEG001"),
     "an actual hospital still gets the clinical mix");

  ok(seg("Professional Services / Consulting").join() !== seg("Other").join(),
     "professional services no longer falls through to the default",
     `(${seg("Professional Services / Consulting").join(",")})`);
  ok(seg("Professional Services / Consulting")[0] === "SEG006",
     "and leads with senior non-clinical professionals");

  ok(seg("Software / Technology")[0] === "SEG009",
     "tech leads with distributed knowledge workers");
  ok(seg("Construction / Skilled Trades").includes("SEG008"),
     "trades reach the skilled-trades segment");
  ok(seg("Manufacturer").join() === seg("Light Manufacturing").join(),
     "manufact* prefix matches both manufacturer and manufacturing");

  // Every option the intake can produce must resolve to something deliberate.
  const INTAKE = [
    "Dental / DSO", "Physician / Surgical Practice", "Hospital / Health System",
    "Behavioral Health / Therapy", "Home Care / Hospice", "Pharmacy / Other Healthcare",
    "Professional Services / Consulting", "Financial Services / Insurance",
    "Legal / Accounting", "Software / Technology", "Light Manufacturing",
    "Heavy Manufacturing / Industrial", "Logistics & Distribution",
    "Construction / Skilled Trades", "Utilities", "Retail",
    "Hospitality / Restaurants", "Grocery / Food Service", "Education",
    "Nonprofit / Social Services", "Government / Municipal", "Other",
  ];
  // These two are SUPPOSED to be the default mix — admin, frontline,
  // operations really is a nonprofit's shape. Listed rather than excluded by a
  // pattern so that adding a third silently is not possible.
  const INTENTIONAL_DEFAULT = ["Other", "Nonprofit / Social Services"];
  const dflt = seg("zzzz").join();
  const fellThrough = INTAKE.filter(
    (i) => !INTENTIONAL_DEFAULT.includes(i) && seg(i).join() === dflt,
  );
  ok(fellThrough.length === 0,
     `all ${INTAKE.length} intake options map deliberately`,
     fellThrough.length ? `(fell through: ${fellThrough.join(", ")})` : "");
  ok(INTENTIONAL_DEFAULT.every((i) => seg(i).join() === dflt),
     "and the two intentional defaults really are the default");
  ok(INTAKE.every((i) => seg(i).every((s) => D2.SEGMENTS_BY_ID.has(s))),
     "every returned segment id exists in the library");

  // ── Regulatory focus ─────────────────────────────────────────────────────
  /*
    The regulatory step is stubbed in MOCK_RESPONSES, so nothing above exercises
    the state ranking that decides how long the section gets. These checks cover
    it directly — it's pure and deterministic, which is the whole reason the
    prompt was made to depend on it rather than on detection order.
  */
  console.log("\n── Regulatory focus ──");
  const P = require(path.join(OUT, "pipeline", "prompts.js"));

  const many = D2.rankStatesByExposure(["CA", "TX", "MN", "NY", "FL", "IL"], "CA");
  ok(many.focus.length === 3, "at most three states get a paragraph",
     `(${many.focus.join(",")})`);
  ok(many.other.length === 3, "the rest get a line", `(${many.other.join(",")})`);
  ok(many.focus.includes("CA"),
     "CA leads — self-insured reach plus primary state");
  ok(many.focus.every(s => D2.coveredStates().includes(s)),
     "curated states outrank uncovered ones", `(${many.focus.join(",")})`);

  // Order-independence is the point of ranking rather than slicing.
  const a = D2.rankStatesByExposure(["IL", "NY", "MN", "CA"], "MN");
  const b = D2.rankStatesByExposure(["CA", "MN", "NY", "IL"], "MN");
  ok(a.focus.join() === b.focus.join(),
     "detection order does not change the focus set", `(${a.focus.join(",")})`);

  const one = D2.rankStatesByExposure(["MN"], "MN");
  ok(one.focus.length === 1 && one.other.length === 0, "single state, no remainder");

  ok(D2.rankStatesByExposure([], null).focus.length === 0,
     "empty input does not throw or invent a state");

  const promptMany = P.regulatorySystem(many.focus.join(", "), many.other.join(", "));
  const promptOne = P.regulatorySystem("MN", "");
  ok(!promptOne.includes("Other states"),
     "no empty 'Other states' heading when every state is in focus");
  ok(promptMany.includes("Other states"), "remainder section appears when there is a remainder");
  ok((promptMany.match(/Federal overlay/g) || []).length === 1,
     "federal overlay asked ONCE, not per state — the original repetition bug");
  ok(/already renders a curated table/i.test(promptMany),
     "prompt is told not to restate what the mandate table carries");

  // ── Release guard severity ───────────────────────────────────────────────
  /*
    releaseBlockers feeds the admin UI; hardReleaseBlockers is what
    releaseReport() actually refuses on. The split is only worth anything if
    the soft ones really do fall out of the hard list.
  */
  console.log("\n── Release guard severity ──");
  ok(R.hardReleaseBlockers({ content, reviewedAt: null }).length === 0,
     "unreviewed report does NOT hard-block — it is visibly incomplete, not wrong");
  ok(R.releaseBlockers({ content, reviewedAt: null }).some(x => /reviewed/i.test(x)),
     "but it still warns in the admin");
  ok(R.hardReleaseBlockers({ content: fb, reviewedAt: "x" }).some(x => /fallback/i.test(x)),
     "fallback scores DO hard-block");
  ok(R.hardReleaseBlockers({ content: missing, reviewedAt: "x" }).some(x => /CFO Engagement/.test(x)),
     "a missing axis hard-blocks and names it");
  ok(R.hardReleaseBlockers({ content: null }).length === 1,
     "no research output at all hard-blocks");
  ok(R.hardReleaseBlockers({ content, reviewedAt: "x" }).length === 0,
     "a clean report releases");

  fs.rmSync(OUT, { recursive: true, force: true });
  console.log("\n" + (fail === 0 ? "ALL CHECKS PASSED" : `${fail} CHECK(S) FAILED`));
  process.exit(fail ? 1 : 0);
}

main();
