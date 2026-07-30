/**
 * Workforce segment library — 5 canonical segments.
 *
 * Segments carry ordered benefit preferences. This encodes the core modelling
 * insight: a licensed-professional workforce and a frontline/hourly workforce
 * have different benefit economics, so the same spend buys different outcomes.
 *
 * Extracted programmatically from axionia-app src/App.js — values are
 * identical to the source. Do not hand-edit for formatting.
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
      "BEN036"
    ],
    "lowValueBenefits": [
      "BEN003",
      "BEN042"
    ],
    "notes": "Customized executive/professional benefits matter far more than broad LSA. Own-occupation disability is critical."
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
      "BEN038"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN042"
    ],
    "notes": "High retention leverage from childcare, scheduling flexibility, and student loan support. Ergonomic and safety investment is underrated."
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
    "notes": "Immediate, usable, low-friction benefits drive perceived value. Financial wellness and career ladder access are the primary retention levers."
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
    "notes": "Financial wellness and mental health are primary drivers. Career development investment signals organizational commitment to non-clinical staff."
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
      "BEN031",
      "BEN048"
    ],
    "lowValueBenefits": [
      "BEN007",
      "BEN059"
    ],
    "notes": "Bridge between frontline and leadership. Retention through career development, flexibility, and financial security."
  }
] as const;

export const SEGMENTS_BY_ID: ReadonlyMap<string, Segment> = new Map(
  SEGMENTS.map((s) => [s.id, s]),
);
