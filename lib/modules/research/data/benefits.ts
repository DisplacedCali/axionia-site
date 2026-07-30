/**
 * Benefit library — 30 curated benefit programs.
 *
 * Each row carries four independent value scores (perceived, financial,
 * retention, clinical) plus Axionia's point of view. The scores are what let
 * the engine reason about fit per workforce segment rather than listing
 * benefits generically.
 *
 * Extracted programmatically from axionia-app src/App.js — values are
 * identical to the source. Do not hand-edit for formatting.
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
  }
] as const;

export const BENEFITS_BY_ID: ReadonlyMap<string, Benefit> = new Map(
  BENEFITS.map((b) => [b.id, b]),
);
