/**
 * Workforce segment library — 9 canonical segments.
 *
 * Segments carry ordered benefit preferences. This encodes the core modelling
 * insight: a licensed-professional workforce and a frontline/hourly workforce
 * have different benefit economics, so the same spend buys different outcomes.
 *
 * SEG001–005 were extracted programmatically from axionia-app src/App.js and
 * are identical to that source — do not hand-edit them for formatting.
 *
 * SEG006–009 were added afterwards to cover the non-clinical economy the
 * original five missed entirely: senior professionals (investment principals,
 * partners, attorneys), technical staff, skilled trades, and distributed
 * remote workers. Without them a professional-services firm or a trades
 * rollup had nowhere to land, and `matchSegmentToLibrary` would return its
 * closest clinical analogue — which is the wrong answer stated confidently.
 */

import type { Segment } from "./types";

export const SEGMENTS: readonly Segment[] = [
  {
    "id": "SEG001",
    "name": "Senior Clinical / Licensed Professionals",
    "compensationLevel": "Very High",
    "workModel": "Onsite / call",
    "industryExamples": "Dentists, Physicians, Surgeons, NPs, PAs",
    "highValueBenefits": [
      "BEN027",
      "BEN007",
      "BEN028",
      "BEN030",
      "BEN031",
      "BEN024",
      "BEN033"
    ],
    "mediumValueBenefits": [
      "BEN016",
      "BEN038",
      "BEN036",
      "BEN009",
      "BEN004"
    ],
    "lowValueBenefits": [
      "BEN003",
      "BEN042"
    ],
    "notes": "Customized executive/professional benefits matter far more than broad LSA. Own-occupation disability is critical.",
    "dimensions": {
      "comp": "very_high",
      "work": [
        "onsite"
      ],
      "replaceability": "hard",
      "licensed": true,
      "clinical": true,
      "supervisory": false
    }
  },
  {
    "id": "SEG002",
    "name": "Clinical Support / Licensed Technical",
    "compensationLevel": "Medium",
    "workModel": "Onsite / shift",
    "industryExamples": "Hygienists, Nurses, Technicians, Therapists, Home Health Aides (licensed)",
    "highValueBenefits": [
      "BEN030",
      "BEN031",
      "BEN016",
      "BEN027",
      "BEN021",
      "BEN048",
      "BEN032"
    ],
    "mediumValueBenefits": [
      "BEN033",
      "BEN020",
      "BEN038",
      "BEN012"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN042"
    ],
    "notes": "High retention leverage from childcare, scheduling flexibility, and student loan support. Ergonomic and safety investment is underrated.",
    "dimensions": {
      "comp": "medium",
      "work": [
        "shift",
        "onsite",
        "field"
      ],
      "replaceability": "moderate",
      "licensed": true,
      "clinical": true,
      "supervisory": false
    }
  },
  {
    "id": "SEG003",
    "name": "Frontline / Entry-Level Service Workers",
    "compensationLevel": "Low / Medium",
    "workModel": "Onsite / field",
    "industryExamples": "Dental Assistants, Home Care Workers, CNAs, Retail Associates, Warehouse",
    "highValueBenefits": [
      "BEN016",
      "BEN030",
      "BEN048",
      "BEN001",
      "BEN020",
      "BEN021"
    ],
    "mediumValueBenefits": [
      "BEN002",
      "BEN003",
      "BEN031",
      "BEN038"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN042",
      "BEN059"
    ],
    "notes": "Immediate, usable, low-friction benefits drive perceived value. Financial wellness and career ladder access are the primary retention levers.",
    "dimensions": {
      "comp": "low",
      "work": [
        "shift",
        "field"
      ],
      "replaceability": "easy",
      "licensed": false,
      "clinical": false,
      "supervisory": false
    }
  },
  {
    "id": "SEG004",
    "name": "Administrative / Office Staff",
    "compensationLevel": "Low / Medium",
    "workModel": "Onsite / hybrid",
    "industryExamples": "Front Office, Billing, Scheduling, Customer Service, HR Coordinators",
    "highValueBenefits": [
      "BEN016",
      "BEN020",
      "BEN048",
      "BEN001",
      "BEN030",
      "BEN032"
    ],
    "mediumValueBenefits": [
      "BEN026",
      "BEN038",
      "BEN021"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN042",
      "BEN027"
    ],
    "notes": "Financial wellness and mental health are primary drivers. Career development investment signals organizational commitment to non-clinical staff.",
    "dimensions": {
      "comp": "low",
      "work": [
        "onsite",
        "hybrid"
      ],
      "replaceability": "easy",
      "licensed": false,
      "clinical": false,
      "supervisory": false
    }
  },
  {
    "id": "SEG005",
    "name": "Operations / Team Leaders",
    "compensationLevel": "Medium / High",
    "workModel": "Onsite / hybrid",
    "industryExamples": "Practice Managers, Branch Managers, Shift Supervisors, Team Leads",
    "highValueBenefits": [
      "BEN016",
      "BEN024",
      "BEN030",
      "BEN033",
      "BEN036",
      "BEN038"
    ],
    "mediumValueBenefits": [
      "BEN026",
      "BEN027",
      "BEN029",
      "BEN031",
      "BEN048"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN059"
    ],
    "notes": "Bridge between frontline and leadership. Retention through career development, flexibility, and financial security. BEN029 (leadership coaching) sits here because this is the only supervisory segment in the library — without it the benefit is unreachable and can never surface in a report.",
    "dimensions": {
      "comp": "high",
      "work": [
        "onsite",
        "hybrid",
        "shift"
      ],
      "replaceability": "moderate",
      "licensed": false,
      "clinical": false,
      "supervisory": true
    }
  },
  {
    "id": "SEG006",
    "name": "Senior Non-Clinical Professionals",
    "compensationLevel": "Very High",
    "workModel": "Hybrid / onsite",
    "industryExamples": "Portfolio Managers, Investment Principals, Partners, Attorneys, Senior Consultants, Executives",
    "highValueBenefits": [
      "BEN055",
      "BEN007",
      "BEN024",
      "BEN033"
    ],
    "mediumValueBenefits": [
      "BEN036",
      "BEN048",
      "BEN038",
      "BEN006"
    ],
    "lowValueBenefits": [
      "BEN003",
      "BEN056"
    ],
    "notes": "Group long-term disability caps leave high earners materially underinsured; income protection and premium access matter more than perks. Standard packages are sized for mid-market employees, not this income band.",
    "dimensions": {
      "comp": "very_high",
      "work": [
        "hybrid",
        "onsite"
      ],
      "replaceability": "hard",
      "licensed": false,
      "clinical": false,
      "supervisory": false
    }
  },
  {
    "id": "SEG007",
    "name": "Technical / Engineering Staff",
    "compensationLevel": "High",
    "workModel": "Hybrid / remote",
    "industryExamples": "Software Engineers, Data Scientists, Architects, Analysts, Actuaries, Quantitative Staff",
    "highValueBenefits": [
      "BEN016",
      "BEN042",
      "BEN021",
      "BEN048"
    ],
    "mediumValueBenefits": [
      "BEN033",
      "BEN030",
      "BEN026",
      "BEN005"
    ],
    "lowValueBenefits": [
      "BEN002",
      "BEN003"
    ],
    "notes": "Recruited against employers with mature benefits platforms, so gaps are visible and priced into offers. Mental health and genuine flexibility outrank traditional insurance richness.",
    "dimensions": {
      "comp": "high",
      "work": [
        "hybrid",
        "remote"
      ],
      "replaceability": "hard",
      "licensed": false,
      "clinical": false,
      "supervisory": false
    }
  },
  {
    "id": "SEG008",
    "name": "Skilled Trades / Maintenance",
    "compensationLevel": "Medium / High",
    "workModel": "Shift / field",
    "industryExamples": "Maintenance Technicians, Electricians, Machinists, Millwrights, HVAC, Welders",
    "highValueBenefits": [
      "BEN012",
      "BEN055",
      "BEN024",
      "BEN016"
    ],
    "mediumValueBenefits": [
      "BEN013",
      "BEN006",
      "BEN030",
      "BEN048"
    ],
    "lowValueBenefits": [
      "BEN003",
      "BEN056"
    ],
    "notes": "Musculoskeletal injury is the dominant claims driver and the dominant absence driver; the two are the same problem. Hard to replace in tight labour markets despite non-professional classification.",
    "dimensions": {
      "comp": "high",
      "work": [
        "shift",
        "field"
      ],
      "replaceability": "hard",
      "licensed": true,
      "clinical": false,
      "supervisory": false
    }
  },
  {
    "id": "SEG009",
    "name": "Distributed / Remote Knowledge Workers",
    "compensationLevel": "Medium / High",
    "workModel": "Remote",
    "industryExamples": "Remote Operations, Customer Success, Sales, Marketing, Distributed Support Teams",
    "highValueBenefits": [
      "BEN042",
      "BEN016",
      "BEN005",
      "BEN048"
    ],
    "mediumValueBenefits": [
      "BEN014",
      "BEN035",
      "BEN020",
      "BEN038"
    ],
    "lowValueBenefits": [
      "BEN002",
      "BEN003"
    ],
    "notes": "Geographically dispersed, so network-based plans deliver unequal value and navigation matters more than network breadth. Benefits are one of few tangible signals of employer investment.",
    "dimensions": {
      "comp": "high",
      "work": [
        "remote"
      ],
      "replaceability": "moderate",
      "licensed": false,
      "clinical": false,
      "supervisory": false
    }
  }
] as const;

export const SEGMENTS_BY_ID: ReadonlyMap<string, Segment> = new Map(
  SEGMENTS.map((s) => [s.id, s]),
);
