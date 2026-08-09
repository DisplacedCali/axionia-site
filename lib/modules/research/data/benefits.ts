/**
 * Benefit library — 31 curated benefit programs.
 *
 * Each row carries four independent value scores (perceived, financial,
 * retention, clinical) plus Axionia's point of view. The scores are what let
 * the engine reason about fit per workforce segment rather than listing
 * benefits generically.
 *
 * Extracted programmatically from axionia-app src/App.js — values are
 * identical to the source. Do not hand-edit for formatting.
 *
 * ONE EXCEPTION, and it matters for provenance: **BEN029 was added later** and
 * is NOT from App.js. Its scores were derived from its Career Development
 * neighbours and ratified by Tom, with the reasoning recorded inline on the
 * row. Everything else in this file can be diffed against the source; that row
 * cannot. Any future addition should be marked the same way.
 */

import type { Benefit } from "./types";

export const BENEFITS: readonly Benefit[] = [
  {
    "id": "BEN001",
    "name": "Medical plan coverage",
    "category": "Health Plan Core",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 5,
    "financial": 5,
    "retention": 5,
    "clinical": 5,
    "axioniaPOV": "Foundational baseline — not a differentiator."
  },
  {
    "id": "BEN002",
    "name": "Dental insurance",
    "category": "Health Plan Core",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 4,
    "financial": 2,
    "retention": 3,
    "clinical": 3,
    "axioniaPOV": "Baseline expectation."
  },
  {
    "id": "BEN003",
    "name": "Vision insurance",
    "category": "Health Plan Core",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 4,
    "financial": 1,
    "retention": 3,
    "clinical": 2,
    "axioniaPOV": "Low-cost table stakes."
  },
  {
    "id": "BEN004",
    "name": "Pharmacy benefit / PBM strategy",
    "category": "Health Plan Core",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 4,
    "financial": 5,
    "retention": 3,
    "clinical": 5,
    "axioniaPOV": "High financial leverage; transparency critical."
  },
  {
    "id": "BEN005",
    "name": "Primary care navigation",
    "category": "Healthcare Access",
    "type": "Differentiated",
    "segments": "All employees",
    "perceived": 4,
    "financial": 5,
    "retention": 4,
    "clinical": 5,
    "axioniaPOV": "High strategic value if linked to total cost."
  },
  {
    "id": "BEN006",
    "name": "Direct primary care",
    "category": "Healthcare Access",
    "type": "Differentiated",
    "segments": "Hourly, field, chronic conditions",
    "perceived": 4,
    "financial": 5,
    "retention": 4,
    "clinical": 5,
    "axioniaPOV": "Strong financial story; test against local access."
  },
  {
    "id": "BEN007",
    "name": "Concierge medicine / executive physicals",
    "category": "Executive / Premium Perk",
    "type": "Customized",
    "segments": "Executives, physicians, high-income professionals",
    "perceived": 5,
    "financial": 2,
    "retention": 4,
    "clinical": 4,
    "axioniaPOV": "High perceived value for physician/executive populations."
  },
  {
    "id": "BEN009",
    "name": "Centers of excellence / surgery bundles",
    "category": "Clinical Value",
    "type": "Differentiated",
    "segments": "Employees needing episodic specialty care",
    "perceived": 3,
    "financial": 5,
    "retention": 3,
    "clinical": 5,
    "axioniaPOV": "High financial and quality upside when steerage is real."
  },
  {
    "id": "BEN012",
    "name": "MSK care",
    "category": "Clinical Value",
    "type": "Differentiated",
    "segments": "Desk workers, field workers, industrial",
    "perceived": 4,
    "financial": 5,
    "retention": 4,
    "clinical": 5,
    "axioniaPOV": "Strong category; claims hinge on surgery avoidance."
  },
  {
    "id": "BEN013",
    "name": "Diabetes management",
    "category": "Clinical Value",
    "type": "Standard",
    "segments": "Employees with diabetes or prediabetes",
    "perceived": 4,
    "financial": 5,
    "retention": 3,
    "clinical": 5,
    "axioniaPOV": "High financial/clinical relevance."
  },
  {
    "id": "BEN014",
    "name": "GLP-1 obesity management",
    "category": "Clinical Value",
    "type": "Differentiated",
    "segments": "Employees with obesity, diabetes, metabolic risk",
    "perceived": 5,
    "financial": 3,
    "retention": 4,
    "clinical": 5,
    "axioniaPOV": "Huge demand and cost volatility; requires rigorous ROI modeling."
  },
  {
    "id": "BEN016",
    "name": "Mental health therapy / EAP expansion",
    "category": "Behavioral Health",
    "type": "Standard",
    "segments": "All employees; frontline, clinicians, high-stress",
    "perceived": 5,
    "financial": 4,
    "retention": 5,
    "clinical": 5,
    "axioniaPOV": "Top perceived-value category."
  },
  {
    "id": "BEN020",
    "name": "Financial wellness / coaching",
    "category": "Financial Wellbeing",
    "type": "Standard",
    "segments": "Early career, hourly, lower-wage, high-debt",
    "perceived": 5,
    "financial": 3,
    "retention": 4,
    "clinical": 3,
    "axioniaPOV": "Strong retention value for lower/mid-wage populations."
  },
  {
    "id": "BEN021",
    "name": "Student loan repayment",
    "category": "Financial Wellbeing",
    "type": "Differentiated",
    "segments": "Clinicians, early career, professional staff",
    "perceived": 5,
    "financial": 2,
    "retention": 5,
    "clinical": 2,
    "axioniaPOV": "High attraction value for nurses, physicians, early-career."
  },
  {
    "id": "BEN024",
    "name": "Retirement savings / 401(k)",
    "category": "Financial Wellbeing",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 2,
    "axioniaPOV": "Table-stakes; match design drives perceived value."
  },
  {
    "id": "BEN026",
    "name": "Tuition assistance / education reimbursement",
    "category": "Career Development",
    "type": "Standard",
    "segments": "Early career, nurses, frontline leaders",
    "perceived": 4,
    "financial": 3,
    "retention": 5,
    "clinical": 2,
    "axioniaPOV": "Strong retention if tied to career ladders."
  },
  {
    "id": "BEN027",
    "name": "Continuing education / CEU travel account",
    "category": "Career Development",
    "type": "Customized",
    "segments": "Surgeons, physicians, nurses, licensed professionals",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 3,
    "axioniaPOV": "High relevance for licensed professionals; near table-stakes for physician recruiting."
  },
  {
    "id": "BEN028",
    "name": "Professional memberships / dues",
    "category": "Career Development",
    "type": "Customized",
    "segments": "Licensed professionals, executives, technical experts",
    "perceived": 4,
    "financial": 2,
    "retention": 4,
    "clinical": 2,
    "axioniaPOV": "Low dollar, high signal of professional support."
  },
  {
    /*
      Added after the extraction, to close the dangling BENEFIT_VENDORS
      reference from BetterUp (VEN049). Scores are calibrated against the
      Career Development neighbours rather than sourced from App.js:

      perceived 4 — high for the selected cohort, but reach is narrow, and the
        people not chosen can read it as an executive perk. Below BEN027 (5),
        which is near-universal for licensed staff.
      financial 2 — the honest number. Value flows through retention and
        productivity, which /methodology publicly commits to not monetising, so
        the financial case cannot be evidenced to Axionia's own standard.
        BetterUp's own red flag is "impact measurement".
      retention 4 — where the value actually is. Manager quality is among the
        better-evidenced drivers of team retention. Not 5: the effect lands on
        the coached leader's team rather than the leader, and attribution is
        contested.
      clinical 1 — deliberately below its neighbours. Coaching is adjacent to
        mental health and is not therapy. Vendors blur that line; scoring it as
        clinical would endorse the blur.
    */
    "id": "BEN029",
    "name": "Leadership / executive coaching",
    "category": "Career Development",
    "type": "Customized",
    "segments": "Managers, emerging leaders, executives, high-potential talent",
    "perceived": 4,
    "financial": 2,
    "retention": 4,
    "clinical": 1,
    "axioniaPOV": "Real retention lever through manager quality; the ROI case rests on outcomes we decline to monetise."
  },
  {
    "id": "BEN030",
    "name": "Childcare subsidy / dependent care support",
    "category": "Family Care",
    "type": "Differentiated",
    "segments": "Parents, hourly, clinicians, shift workers",
    "perceived": 5,
    "financial": 4,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "High retention/absence impact where childcare is a bottleneck."
  },
  {
    "id": "BEN031",
    "name": "Backup care",
    "category": "Family Care",
    "type": "Differentiated",
    "segments": "Parents, caregivers, clinicians, executives",
    "perceived": 5,
    "financial": 4,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "Strong for absenteeism and continuity."
  },
  {
    "id": "BEN032",
    "name": "Parental leave",
    "category": "Leave / Family",
    "type": "Standard",
    "segments": "Parents, early/mid-career talent",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "Highly visible attraction/retention lever."
  },
  {
    "id": "BEN033",
    "name": "Fertility and family forming",
    "category": "Family / Reproductive Health",
    "type": "Differentiated",
    "segments": "Mid-career talent, LGBTQ+, women, executives",
    "perceived": 5,
    "financial": 4,
    "retention": 5,
    "clinical": 5,
    "axioniaPOV": "High perceived and equity value."
  },
  {
    "id": "BEN035",
    "name": "Menopause / midlife women's health",
    "category": "Family / Reproductive Health",
    "type": "Differentiated",
    "segments": "Women 40-60, leaders, clinicians",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "Rising category with strong inclusion and retention narrative."
  },
  {
    "id": "BEN036",
    "name": "Caregiver / eldercare support",
    "category": "Family Care",
    "type": "Differentiated",
    "segments": "Mid-career, older workers, caregivers, executives",
    "perceived": 5,
    "financial": 4,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "Undervalued retention and productivity lever for mid-career employees."
  },
  {
    "id": "BEN038",
    "name": "Lifestyle spending account",
    "category": "Lifestyle / Flexible Perk",
    "type": "Differentiated",
    "segments": "All employees; diverse workforce",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 3,
    "axioniaPOV": "Excellent flexible architecture."
  },
  {
    "id": "BEN042",
    "name": "Remote work / home office stipend",
    "category": "Flexible Work",
    "type": "Standard",
    "segments": "Remote employees, knowledge workers",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 3,
    "axioniaPOV": "High perceived value for remote roles."
  },
  {
    "id": "BEN048",
    "name": "PTO / flexible time off",
    "category": "Leave / Flexibility",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 4,
    "axioniaPOV": "Foundational; manager norms matter more than policy."
  },
  {
    "id": "BEN055",
    "name": "Disability / leave management",
    "category": "Risk / Income Protection",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 4,
    "financial": 4,
    "retention": 4,
    "clinical": 4,
    "axioniaPOV": "Core risk and compliance benefit."
  },
  {
    "id": "BEN056",
    "name": "Life insurance / AD&D",
    "category": "Risk / Income Protection",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 3,
    "financial": 2,
    "retention": 3,
    "clinical": 1,
    "axioniaPOV": "Table-stakes."
  },
  {
    "id": "BEN059",
    "name": "Housing assistance / relocation",
    "category": "Lifestyle / Core Work Support",
    "type": "Customized",
    "segments": "Clinicians, teachers, new hires, executives",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 2,
    "axioniaPOV": "Potentially huge retention lever in high-cost geographies."
  },

  /* ──────────────────────────────────────────────────────────────────────
     LIFESTYLE, ON-SITE AND EXECUTIVE PERQUISITES — added 2026-08

     Why these were missing, and why it mattered.

     The library was built from the clinical side of the ledger, where the
     evidence lives. Everything in it competes on avoided claims. But the
     non-clinical half of a benefit budget competes for the same dollar and
     was almost entirely absent — "Lifestyle / Flexible Perk" held one row.

     That absence quietly decided an answer. A high-comp, hard-to-replace
     workforce has low claims utilisation relative to compensation, so the
     clinical case is weakest exactly where the retention case is strongest.
     With no perks in the library, a retention-weighted analysis could only
     rank clinical programs against each other — and returned the fourth
     overlapping point solution because nothing else was on the list.

     Nobody in the advice chain surfaces this substitution, and not because
     anyone is failing: perks are largely unbrokered, so there is no
     commission, no catalogue entry and no reason for them to come up. An
     MSK vendor cannot recommend a fitness stipend instead of itself.

     HARD LINE ON WHAT THESE ROWS CONTAIN. The four scores and axioniaPOV
     are editorial judgments — that is what those fields are for. They carry
     NO prevalence percentages and NO cost figures, because those are facts
     and would need a citation (SHRM's benefits survey and the BLS National
     Compensation Survey, which publishes incidence by wage quartile, are
     the sources when we add them). A plausible invented benchmark is worse
     than a missing one. See BEN029.

     And the constraint from lib/objectives.ts, which governs how these get
     used: weights order decisions, they do not monetise outcomes. These
     rows let a retention-weighted portfolio RANK a fitness stipend above a
     marginal point solution. They must never be used to claim it is worth
     $X PMPM — /methodology commits publicly against exactly that.
     ────────────────────────────────────────────────────────────────────── */

  {
    "id": "BEN060",
    "name": "Fitness / gym membership subsidy",
    "category": "Lifestyle / Flexible Perk",
    "type": "Standard",
    "segments": "All employees; highest uptake among knowledge and professional workforces",
    "perceived": 5,
    "financial": 2,
    "retention": 4,
    "clinical": 2,
    "axioniaPOV": "The most visible benefit per dollar in the library, and the one most often dismissed because its clinical case is weak. Judge it on the axis it actually serves. Where a portfolio already carries several overlapping clinical programs, a fitness subsidy is frequently the better marginal dollar for a retention-led objective — not because it is more effective clinically, but because it is not the fifth claim on the same avoided event."
  },
  {
    "id": "BEN061",
    "name": "Personal training / coached fitness",
    "category": "Executive / Premium Perk",
    "type": "Customized",
    "segments": "Executives, senior professionals; occasionally broad in small high-comp firms",
    "perceived": 4,
    "financial": 1,
    "retention": 3,
    "clinical": 2,
    "axioniaPOV": "A premium extension of a gym subsidy rather than a distinct benefit. Defensible where it is part of an executive package being priced as a whole; hard to defend as a standalone line."
  },
  {
    "id": "BEN062",
    "name": "On-site or subsidised meals",
    "category": "Lifestyle / On-site",
    "type": "Differentiated",
    "segments": "Onsite and hybrid workforces; strongest where attendance is a live question",
    "perceived": 5,
    "financial": 2,
    "retention": 4,
    "clinical": 2,
    "axioniaPOV": "Daily, tangible and impossible to forget you have — the opposite of a point solution nobody engages with. Its real argument is usually attendance and cohesion rather than health, and it should be evaluated against that objective rather than defended on nutrition."
  },
  {
    "id": "BEN063",
    "name": "Commuter and parking benefit",
    "category": "Lifestyle / On-site",
    "type": "Standard",
    "segments": "Onsite workforces in dense metros",
    "perceived": 4,
    "financial": 3,
    "retention": 3,
    "clinical": 1,
    "axioniaPOV": "Tax-advantaged and unglamorous. Where return-to-office is contested it is one of the few benefits that directly reduces the cost of the thing being asked for."
  },
  {
    "id": "BEN064",
    "name": "Pet insurance / pet care benefit",
    "category": "Lifestyle / Flexible Perk",
    "type": "Standard",
    "segments": "All employees; skews younger and to remote workforces",
    "perceived": 4,
    "financial": 4,
    "retention": 2,
    "clinical": 1,
    "axioniaPOV": "Usually voluntary and employee-paid, so employer cost is near zero and the honest case is goodwill per dollar rather than retention. Cheap to offer, weak to lean on."
  },
  {
    "id": "BEN065",
    "name": "Sabbatical / long-service leave",
    "category": "Leave / Flexibility",
    "type": "Differentiated",
    "segments": "Long-tenure professional workforces; partnerships and senior technical staff",
    "perceived": 5,
    "financial": 3,
    "retention": 5,
    "clinical": 3,
    "axioniaPOV": "One of very few benefits whose value is explicitly tied to staying, which makes it unusually well matched to a retention objective. Cost is real but deferred and largely coverage rather than cash."
  },
  {
    "id": "BEN066",
    "name": "Executive perquisites (vehicle, club, allowance)",
    "category": "Executive / Premium Perk",
    "type": "Customized",
    "segments": "Named executives and partner-track roles",
    "perceived": 4,
    "financial": 1,
    "retention": 3,
    "clinical": 1,
    "axioniaPOV": "Compensation wearing a benefits label. Worth carrying in the portfolio so it is visible in the total, but it should be assessed as pay — evaluating it as a benefit flatters it, and the tax treatment usually decides the answer anyway."
  },
  {
    "id": "BEN067",
    "name": "AI tool subscriptions",
    "category": "Career Development",
    "type": "Differentiated",
    "segments": "Knowledge, technical and professional workforces",
    "perceived": 5,
    "financial": 4,
    "retention": 4,
    "clinical": 1,
    "axioniaPOV": "The fastest-moving line in a professional benefits package, and the one where absence is most visible to a candidate comparing offers. Cheap relative to its signalling value; the risk is procurement treating it as IT spend and nobody counting it in the benefits total at all."
  },
  {
    "id": "BEN068",
    "name": "Paternity / secondary caregiver leave",
    "category": "Leave / Family",
    "type": "Differentiated",
    "segments": "All employees; disproportionate signalling value in male-majority professional workforces",
    "perceived": 5,
    "financial": 3,
    "retention": 4,
    "clinical": 3,
    "axioniaPOV": "Held separately from BEN032 because the two behave differently. Primary-caregiver leave is close to table stakes; secondary-caregiver leave still varies widely and is read as a statement about culture rather than as a benefit. Take-up is usually the binding constraint, not the policy."
  },
  {
    "id": "BEN069",
    "name": "Concierge / navigation for dependents and elders",
    "category": "Family Care",
    "type": "Differentiated",
    "segments": "Mid-career and senior professionals with caregiving load",
    "perceived": 4,
    "financial": 3,
    "retention": 4,
    "clinical": 3,
    "axioniaPOV": "Adjacent to BEN036 and frequently sold as a separate product — check for overlap before adding it. Where both exist the second one rarely earns its line."
  },
  {
    "id": "BEN070",
    "name": "Wellbeing stipend / wellness reimbursement",
    "category": "Lifestyle / Flexible Perk",
    "type": "Standard",
    "segments": "All employees",
    "perceived": 4,
    "financial": 3,
    "retention": 3,
    "clinical": 2,
    "axioniaPOV": "Functionally a narrow lifestyle spending account. Where BEN038 already exists this is usually duplication with extra administration — the flexible account does the same job with fewer rules."
  },
  {
    "id": "BEN071",
    "name": "Sleep, recovery and preventive screening programs",
    "category": "Clinical Value",
    "type": "Differentiated",
    "segments": "Shift workers, executives, high-stress professional roles",
    "perceived": 3,
    "financial": 2,
    "retention": 2,
    "clinical": 3,
    "axioniaPOV": "A category where vendor claims outrun the evidence more than most. Reasonable to carry, but treat the savings case as unverified until the population and the comparison group are both stated."
  }
] as const;

export const BENEFITS_BY_ID: ReadonlyMap<string, Benefit> = new Map(
  BENEFITS.map((b) => [b.id, b]),
);
