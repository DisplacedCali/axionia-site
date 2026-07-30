/**
 * State benefit mandate library.
 *
 * The selfInsured flag is the whole point. Most state mandates are ERISA-
 * preempted for self-insured plans; the ones that are NOT (CA SB 729) are a
 * materially different compliance exposure. Never flatten those two cases.
 *
 * Extracted programmatically from axionia-app src/App.js — values are
 * identical to the source. Do not hand-edit for formatting.
 */

import type { Mandate } from "./types";

export const MANDATES: readonly Mandate[] = [
  {
    "id": "M001",
    "state": "CA",
    "category": "Fertility",
    "benefit": "Infertility treatment coverage",
    "law": "SB 729 / CA Insurance Code §10119.6",
    "effectiveDate": "2025-01-01",
    "selfInsured": true,
    "erisa": "Applies to self-insured — ERISA preemption does NOT apply",
    "urgency": "High",
    "description": "California now mandates infertility treatment coverage for self-insured ERISA plans — a rare and significant exception to ERISA preemption. Employers with CA employees on self-funded plans must comply. Covers diagnosis and treatment of infertility including IVF.",
    "axioniaTake": "This is the most significant state fertility mandate in the country because it explicitly reaches self-insured plans. Most CA employers are unaware this applies to them. Immediate plan design review required.",
    "tags": [
      "fertility",
      "reproductive",
      "CA"
    ]
  },
  {
    "id": "M002",
    "state": "IL",
    "category": "Fertility",
    "benefit": "Infertility treatment coverage",
    "law": "IL Insurance Code §356m",
    "effectiveDate": "2019-01-01",
    "selfInsured": false,
    "erisa": "Fully insured only — ERISA preempts self-insured",
    "urgency": "Medium",
    "description": "Illinois mandates infertility treatment coverage including IVF for fully insured plans. Self-insured ERISA plans are exempt under federal preemption.",
    "axioniaTake": "Applies only to fully insured plans. Self-insured employers in IL are exempt but should monitor CA SB 729 as a precedent.",
    "tags": [
      "fertility",
      "reproductive",
      "IL"
    ]
  },
  {
    "id": "M003",
    "state": "MA",
    "category": "Fertility",
    "benefit": "Infertility treatment coverage",
    "law": "MA General Laws Ch. 175 §47H",
    "effectiveDate": "1987-01-01",
    "selfInsured": false,
    "erisa": "Fully insured only — ERISA preempts self-insured",
    "urgency": "Low",
    "description": "Massachusetts has a longstanding infertility mandate for fully insured plans, one of the oldest in the country.",
    "axioniaTake": "Baseline compliance for fully insured MA plans. Self-insured plans are exempt.",
    "tags": [
      "fertility",
      "reproductive",
      "MA"
    ]
  },
  {
    "id": "M004",
    "state": "NY",
    "category": "Reproductive Health",
    "benefit": "Contraceptive coverage — all FDA-approved methods",
    "law": "NY Insurance Law §4303",
    "effectiveDate": "2002-01-01",
    "selfInsured": false,
    "erisa": "Fully insured only",
    "urgency": "Low",
    "description": "New York mandates coverage of all FDA-approved contraceptive methods with no cost-sharing for fully insured plans.",
    "axioniaTake": "Standard compliance item for fully insured NY plans.",
    "tags": [
      "contraception",
      "reproductive",
      "NY"
    ]
  },
  {
    "id": "M010",
    "state": "MN",
    "category": "Mental Health",
    "benefit": "Mental health parity — enhanced enforcement",
    "law": "MN Statute §62Q.47",
    "effectiveDate": "1995-01-01",
    "selfInsured": "partial",
    "erisa": "State enforcement applies to state-regulated plans; federal MHPAEA governs self-insured",
    "urgency": "High",
    "description": "Minnesota's mental health parity law predates and exceeds federal MHPAEA requirements. The state aggressively audits compliance including NQTL analyses. Self-insured plans are governed by federal MHPAEA but MN regulators coordinate with DOL on enforcement.",
    "axioniaTake": "MN employers on self-insured plans should have a current NQTL comparative analysis under the 2024 MHPAEA final rules. MN regulators are among the most active in the country on this.",
    "tags": [
      "mentalhealth",
      "parity",
      "MN"
    ]
  },
  {
    "id": "M011",
    "state": "CA",
    "category": "Mental Health",
    "benefit": "Mental health and SUD parity — state enforcement",
    "law": "CA Mental Health Parity Act / SB 855",
    "effectiveDate": "2021-01-01",
    "selfInsured": "partial",
    "erisa": "SB 855 applies to state-regulated plans; ERISA preempts for self-insured but CA DOI coordinates with DOL",
    "urgency": "High",
    "description": "California SB 855 significantly strengthened state mental health parity enforcement, expanding covered conditions to all DSM/ICD-listed conditions and requiring annual reporting. While ERISA preempts for self-insured plans, CA actively coordinates with federal regulators.",
    "axioniaTake": "Self-insured CA employers should conduct NQTL analyses aligned with both federal MHPAEA 2024 rules and CA SB 855 standards. Enforcement risk is elevated.",
    "tags": [
      "mentalhealth",
      "parity",
      "CA"
    ]
  },
  {
    "id": "M020",
    "state": "MN",
    "category": "Paid Leave",
    "benefit": "Paid Family and Medical Leave",
    "law": "MN Paid Leave Act",
    "effectiveDate": "2026-01-01",
    "selfInsured": true,
    "erisa": "Not an insurance mandate — payroll tax / leave policy requirement; ERISA does not preempt",
    "urgency": "High",
    "description": "Minnesota Paid Leave launches January 1, 2026. Up to 20 weeks combined paid family/medical leave. Mandatory employer and employee payroll tax contributions. Employers must post notices, update policies, and build leave administration infrastructure. Applies to all MN employees.",
    "axioniaTake": "This is a live compliance deadline. Employers with MN employees who have not finalized implementation plans are behind. Payroll systems, leave tracking, and policy documents all require updates.",
    "tags": [
      "paidleave",
      "MN"
    ]
  },
  {
    "id": "M021",
    "state": "CA",
    "category": "Paid Leave",
    "benefit": "Paid Family Leave — expanded wage replacement",
    "law": "CA SDI / SB 951",
    "effectiveDate": "2025-01-01",
    "selfInsured": true,
    "erisa": "Not an insurance mandate — state payroll tax; ERISA does not preempt",
    "urgency": "High",
    "description": "California expanded PFL wage replacement to 90% of weekly wages for lower earners (under 1x SAWW) and 70% for higher earners effective 2025. Employers must coordinate their own leave policies with the new replacement rates or risk integration gaps and inequitable outcomes by state.",
    "axioniaTake": "Employers with CA operations must audit their leave policy coordination with CA PFL. The 90% replacement rate for lower earners creates a meaningful gap if the employer's supplemental pay policy is not updated.",
    "tags": [
      "paidleave",
      "CA"
    ]
  },
  {
    "id": "M022",
    "state": "NY",
    "category": "Paid Leave",
    "benefit": "Paid Family Leave — 12 weeks at 67% SAWW",
    "law": "NY PFL Law / Workers' Compensation Law §200",
    "effectiveDate": "2018-01-01",
    "selfInsured": true,
    "erisa": "Employee-funded payroll deduction; employer must ensure withholding and carrier coordination",
    "urgency": "Medium",
    "description": "New York Paid Family Leave provides up to 12 weeks at 67% of the statewide average weekly wage, employee-funded via payroll deduction. Employers must ensure proper withholding and maintain compliant carrier or self-insured arrangement.",
    "axioniaTake": "Baseline compliance for NY employers. Review carrier coordination and withholding setup annually at contribution rate updates.",
    "tags": [
      "paidleave",
      "NY"
    ]
  },
  {
    "id": "M023",
    "state": "IL",
    "category": "Paid Leave",
    "benefit": "Paid leave — any reason, 40 hours/year",
    "law": "IL Paid Leave for All Workers Act",
    "effectiveDate": "2024-01-01",
    "selfInsured": true,
    "erisa": "Not an insurance mandate; ERISA does not preempt",
    "urgency": "Medium",
    "description": "Illinois mandates 40 hours of paid leave per year for any reason, no documentation required. One of the broadest paid leave laws in the country. Applies to all IL employees.",
    "axioniaTake": "IL employers must ensure their PTO or leave policies meet or exceed the 40-hour any-reason standard. The no-documentation-required provision is broader than most existing PTO policies.",
    "tags": [
      "paidleave",
      "IL"
    ]
  },
  {
    "id": "M030",
    "state": "CA",
    "category": "Gender-Affirming Care",
    "benefit": "Gender-affirming care coverage",
    "law": "CA Insurance Code / AB 465",
    "effectiveDate": "2023-01-01",
    "selfInsured": false,
    "erisa": "Fully insured only — ERISA preempts self-insured; watch for litigation",
    "urgency": "Medium",
    "description": "California mandates coverage of gender-affirming care under fully insured plans. Self-insured ERISA plans are preempted but face increasing advocacy pressure and some federal non-discrimination guidance.",
    "axioniaTake": "Self-insured employers are currently exempt under ERISA but should monitor federal Section 1557 non-discrimination regulations and litigation landscape.",
    "tags": [
      "genderaffirming",
      "CA"
    ]
  },
  {
    "id": "M040",
    "state": "NY",
    "category": "Prenatal Care",
    "benefit": "Paid prenatal leave — 20 hours annually",
    "law": "NY Labor Law §196-b(4)",
    "effectiveDate": "2025-01-01",
    "selfInsured": true,
    "erisa": "Not an insurance mandate; ERISA does not preempt",
    "urgency": "High",
    "description": "New York now requires 20 hours of paid prenatal leave annually, separate from sick leave or PTO. Applies to all NY employees. Effective January 1, 2025 — a new and often overlooked obligation.",
    "axioniaTake": "This is frequently missed in compliance audits because it's separate from both PFL and sick leave. NY employers must track this separately and ensure managers are trained.",
    "tags": [
      "prenatal",
      "maternity",
      "NY"
    ]
  },
  {
    "id": "M050",
    "state": "MN",
    "category": "Paid Sick Leave",
    "benefit": "Earned Sick and Safe Time",
    "law": "MN ESST / SF 3035",
    "effectiveDate": "2024-01-01",
    "selfInsured": true,
    "erisa": "Not an insurance mandate; ERISA does not preempt",
    "urgency": "High",
    "description": "Minnesota ESST effective January 1, 2024 requires 1 hour of paid sick and safe time for every 30 hours worked, up to 48 hours/year. Applies to all employees including part-time. Employers must post notices, track accrual per location, and update policies.",
    "axioniaTake": "Live requirement. Distributed employers with MN locations must ensure per-location accrual tracking and manager training. Part-time and variable-hour employees are explicitly included.",
    "tags": [
      "sickleave",
      "MN"
    ]
  }
] as const;
