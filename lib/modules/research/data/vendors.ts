/**
 * Vendor library and benefit→vendor mapping.
 *
 * evidenceQuality is load-bearing: 3 = independent/peer-reviewed, 2 =
 * vendor-reported, 1 = emerging. redFlags is never dropped from client-facing
 * output — de-duplicating and discounting vendor claims is the moat, so a
 * vendor row without its caveats is worse than no vendor row.
 *
 * Extracted programmatically from axionia-app src/App.js — values are
 * identical to the source. Do not hand-edit for formatting.
 */

import type { Vendor, BenefitVendor, FertilityVendor } from "./types";

export const VENDORS: readonly Vendor[] = [
  {
    "id": "VEN001",
    "name": "Progyny",
    "category": "Fertility / family forming",
    "description": "Managed fertility and family-building benefit with provider network and Rx integration.",
    "momentum": 4,
    "stability": 4,
    "bestFit": "Large self-funded employers",
    "evidenceQuality": 2,
    "url": "https://progyny.com",
    "redFlags": "Vendor-reported outcomes; public company volatility"
  },
  {
    "id": "VEN002",
    "name": "Carrot Fertility",
    "category": "Fertility / family forming",
    "description": "Global fertility, family-forming and hormonal health platform.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Tech, professional, global employers",
    "evidenceQuality": 2,
    "url": "https://www.get-carrot.com",
    "redFlags": "Intent not same as observed outcome"
  },
  {
    "id": "VEN003",
    "name": "Maven Clinic",
    "category": "Women and family health",
    "description": "Virtual clinic for fertility, maternity, parenting, menopause and family health.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Large self-funded employers",
    "evidenceQuality": 2,
    "url": "https://www.mavenclinic.com",
    "redFlags": "Vendor-authored outcomes"
  },
  {
    "id": "VEN007",
    "name": "Bright Horizons",
    "category": "Childcare / backup care",
    "description": "Employer-sponsored childcare, backup care, early education and workforce consulting.",
    "momentum": 4,
    "stability": 4,
    "bestFit": "Large employers, hospitals, campuses",
    "evidenceQuality": 2,
    "url": "https://www.brighthorizons.com",
    "redFlags": "Local supply constraints"
  },
  {
    "id": "VEN011",
    "name": "Lyra Health",
    "category": "Mental health",
    "description": "Workforce mental health benefit with therapy, coaching, psychiatry and digital tools.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Employers with high-stress workforce",
    "evidenceQuality": 1,
    "url": "https://www.lyrahealth.com",
    "redFlags": "Engagement and severity matching"
  },
  {
    "id": "VEN012",
    "name": "Spring Health",
    "category": "Mental health",
    "description": "Mental health platform with navigation, therapy, coaching, psychiatry and EAP.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Employers needing EAP replacement",
    "evidenceQuality": 1,
    "url": "https://www.springhealth.com",
    "redFlags": "Outcomes validation needed"
  },
  {
    "id": "VEN016",
    "name": "Hinge Health",
    "category": "MSK",
    "description": "Digital MSK clinic with exercise therapy, coaching and care team model.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Self-funded employers/plans",
    "evidenceQuality": 2,
    "url": "https://www.hingehealth.com",
    "redFlags": "Surgery avoidance attribution"
  },
  {
    "id": "VEN021",
    "name": "Included Health",
    "category": "Navigation / virtual care",
    "description": "Virtual care, navigation, advocacy, and expert opinion.",
    "momentum": 4,
    "stability": 3,
    "bestFit": "Employers needing integrated navigation",
    "evidenceQuality": 1,
    "url": "https://includedhealth.com",
    "redFlags": "Integration complexity"
  },
  {
    "id": "VEN025",
    "name": "One Medical",
    "category": "Primary care / concierge-like",
    "description": "Membership-based primary care as employer benefit; virtual and in-person access.",
    "momentum": 4,
    "stability": 5,
    "bestFit": "Tech, professional services, distributed employers",
    "evidenceQuality": 3,
    "url": "https://www.onemedical.com/business",
    "redFlags": "Geographic office coverage"
  },
  {
    "id": "VEN029",
    "name": "PartnerMD",
    "category": "Concierge medicine",
    "description": "Concierge primary care and executive physicals.",
    "momentum": 3,
    "stability": 3,
    "bestFit": "Executive-heavy employers, physician groups",
    "evidenceQuality": 1,
    "url": "https://www.partnermd.com",
    "redFlags": "Regional footprint; equity optics"
  },
  {
    "id": "VEN032",
    "name": "Virta Health",
    "category": "Diabetes / metabolic",
    "description": "Clinic model focused on diabetes reversal and metabolic health.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Self-funded employers/plans with chronic condition population",
    "evidenceQuality": 2,
    "url": "https://www.virtahealth.com",
    "redFlags": "Adherence and selection effects"
  },
  {
    "id": "VEN040",
    "name": "Forma",
    "category": "LSA / personalized benefits",
    "description": "Personalized benefits platform for LSAs, pre-tax accounts, wellness stipends.",
    "momentum": 5,
    "stability": 3,
    "bestFit": "Tech/global employers",
    "evidenceQuality": 2,
    "url": "https://www.joinforma.com",
    "redFlags": "Taxability and eligible expense governance"
  },
  {
    "id": "VEN049",
    "name": "BetterUp",
    "category": "Coaching",
    "description": "Coaching, leadership development and mental fitness platform.",
    "momentum": 4,
    "stability": 3,
    "bestFit": "Employers investing in manager/leader development",
    "evidenceQuality": 1,
    "url": "https://www.betterup.com",
    "redFlags": "Premium price; impact measurement"
  },
  {
    "id": "VEN051",
    "name": "Guild",
    "category": "Education benefits",
    "description": "Education and skilling marketplace/platform for employers.",
    "momentum": 4,
    "stability": 3,
    "bestFit": "Large frontline employers",
    "evidenceQuality": 2,
    "url": "https://www.guild.com",
    "redFlags": "Program economics depend on career pathways"
  },
  {
    "id": "VEN054",
    "name": "SoFi at Work",
    "category": "Financial wellness",
    "description": "Student loan, financial wellness and workplace financial products.",
    "momentum": 4,
    "stability": 4,
    "bestFit": "Professional employers, healthcare",
    "evidenceQuality": 2,
    "url": "https://www.sofi.com/at-work",
    "redFlags": "Financial product cross-sell risk"
  },
  {
    "id": "VEN066",
    "name": "Unum",
    "category": "Disability / leave",
    "description": "Insurance and absence management provider; own-occupation disability for clinical staff.",
    "momentum": 5,
    "stability": 5,
    "bestFit": "All employers; critical for clinical/professional",
    "evidenceQuality": 3,
    "url": "https://www.unum.com",
    "redFlags": "Claims/admin experience"
  },
  {
    "id": "VEN_WIN",
    "name": "WIN (Women's Information Network)",
    "category": "Fertility / women's health / menopause",
    "description": "Comprehensive women's health platform covering fertility, menopause, hormonal health, and maternal care with clinical navigation and employer analytics.",
    "momentum": 4,
    "stability": 4,
    "bestFit": "Clinical employers, DSOs, professional services — employers with significant female workforce age 30-55",
    "evidenceQuality": 2,
    "url": "https://winhealth.com",
    "redFlags": "Outcomes data largely vendor-reported; menopause ROI harder to isolate than fertility",
    "disclosure": "Axionia's analyst has a professional relationship with WIN, which is why this profile is more detailed than the others in this category. We've kept the vendor in the library rather than dropping it: the depth is useful to you, and the honest response to knowing a vendor well is to say so. Weigh our assessment of WIN accordingly — the red flags above are the same ones we'd raise about anyone, and the hard questions are the ones we'd want answered before signing.",
    "axioniaNotes": "Axionia has deep familiarity with WIN's model. Strongest differentiator is breadth — fertility through menopause — which most point solutions don't span. Clinical navigation is a genuine strength. Evidence quality is moderate.",
    "hardQuestions": [
      "How do you isolate menopause-related productivity gains from confounding variables?",
      "What is your claims integration methodology and how do you handle attribution for members already in treatment?",
      "Can you provide de-identified utilization data by employer size and industry?",
      "What is average time-to-engagement after enrollment by condition?"
    ],
    "fitByIndustry": {
      "dental": "Strong — clinical workforce with high proportion of women in hygienist/assistant roles; menopause coverage relevant for 40-55 cohort",
      "manufacturing": "Moderate — depends on female workforce proportion",
      "tech": "Strong — high utilization in knowledge worker populations",
      "retail": "Moderate — shift work complicates engagement"
    }
  }
] as const;

export const BENEFIT_VENDORS: readonly BenefitVendor[] = [
  {
    "benefitId": "BEN033",
    "vendorId": "VEN001",
    "vendorName": "Progyny",
    "offeringNote": "Managed fertility with Smart Cycles and pharmacy integration",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN033",
    "vendorId": "VEN002",
    "vendorName": "Carrot Fertility",
    "offeringNote": "Global fertility/family-forming; broad family types",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN033",
    "vendorId": "VEN003",
    "vendorName": "Maven Clinic",
    "offeringNote": "Fertility + maternity + menopause platform",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN016",
    "vendorId": "VEN011",
    "vendorName": "Lyra Health",
    "offeringNote": "Therapy, coaching, psychiatry — EAP replacement tier",
    "evidenceQuality": 1
  },
  {
    "benefitId": "BEN016",
    "vendorId": "VEN012",
    "vendorName": "Spring Health",
    "offeringNote": "Precision mental health with navigation",
    "evidenceQuality": 1
  },
  {
    "benefitId": "BEN007",
    "vendorId": "VEN025",
    "vendorName": "One Medical",
    "offeringNote": "Primary care membership as employer benefit; concierge-like access",
    "evidenceQuality": 3
  },
  {
    "benefitId": "BEN007",
    "vendorId": "VEN029",
    "vendorName": "PartnerMD",
    "offeringNote": "Concierge primary care and executive physicals",
    "evidenceQuality": 1
  },
  {
    "benefitId": "BEN012",
    "vendorId": "VEN016",
    "vendorName": "Hinge Health",
    "offeringNote": "Digital MSK clinic with exercise therapy",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN005",
    "vendorId": "VEN021",
    "vendorName": "Included Health",
    "offeringNote": "Navigation, expert opinion, virtual primary care",
    "evidenceQuality": 1
  },
  {
    "benefitId": "BEN038",
    "vendorId": "VEN040",
    "vendorName": "Forma",
    "offeringNote": "LSA/lifestyle benefits wallet — flexible spend categories",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN021",
    "vendorId": "VEN054",
    "vendorName": "SoFi at Work",
    "offeringNote": "Student loan repayment and financial wellness",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN027",
    "vendorId": "VEN051",
    "vendorName": "Guild",
    "offeringNote": "Education pathways and skilling — CEU/tuition administration",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN055",
    "vendorId": "VEN066",
    "vendorName": "Unum",
    "offeringNote": "Own-occupation disability — critical for clinical staff",
    "evidenceQuality": 3
  },
  {
    "benefitId": "BEN030",
    "vendorId": "VEN007",
    "vendorName": "Bright Horizons",
    "offeringNote": "Employer-sponsored childcare and backup care",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN013",
    "vendorId": "VEN032",
    "vendorName": "Virta Health",
    "offeringNote": "Diabetes reversal and metabolic health clinic",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN029",
    "vendorId": "VEN049",
    "vendorName": "BetterUp",
    "offeringNote": "Leadership coaching and mental fitness",
    "evidenceQuality": 1
  },
  {
    "benefitId": "BEN033",
    "vendorId": "VEN_WIN",
    "vendorName": "WIN (Women's Information Network)",
    "offeringNote": "Fertility + menopause + hormonal health in one platform — broadest women's health coverage of any vendor in this category",
    "evidenceQuality": 2
  },
  {
    "benefitId": "BEN035",
    "vendorId": "VEN_WIN",
    "vendorName": "WIN (Women's Information Network)",
    "offeringNote": "Menopause and midlife women's health navigation — clinical strength in hormonal health transitions",
    "evidenceQuality": 2
  }
] as const;

export const VENDORS_BY_ID: ReadonlyMap<string, Vendor> = new Map(
  VENDORS.map((v) => [v.id, v]),
);

/** Fertility / family-forming comparison set. */
export const FERTILITY_VENDORS: readonly FertilityVendor[] = [
  {
    "id": "VEN001",
    "name": "Progyny",
    "focus": "Managed fertility",
    "strength": "Network depth, Smart Cycles model",
    "gap": "Menopause not covered; public co. volatility",
    "fit": "Large self-funded",
    "eq": 2
  },
  {
    "id": "VEN002",
    "name": "Carrot",
    "focus": "Global fertility/family-forming",
    "strength": "Global reach, inclusive family types",
    "gap": "Intent ≠ observed outcome; no menopause",
    "fit": "Tech, global employers",
    "eq": 2
  },
  {
    "id": "VEN003",
    "name": "Maven Clinic",
    "focus": "Fertility + maternity + menopause",
    "strength": "Breadth of women's journey",
    "gap": "Vendor-authored outcomes; cost vs Progyny",
    "fit": "Large self-funded",
    "eq": 2
  },
  {
    "id": "VEN_WIN",
    "name": "WIN",
    "focus": "Fertility + menopause + hormonal",
    "strength": "Broadest women's health coverage; clinical nav",
    "gap": "Outcomes largely vendor-reported; smaller scale",
    "fit": "Clinical, DSO, professional",
    "eq": 2,
    "featured": true
  }
] as const;
