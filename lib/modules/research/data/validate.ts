/**
 * Integrity checks for the benefit intelligence library.
 *
 * This data is the product's defensible spine — it's what lets Axionia claim
 * independent assessment rather than vendor-repeated marketing. A silently
 * broken reference undermines that more than a loud failure would, so these
 * checks exist to be run in CI and in a dev-time script, not just trusted.
 *
 * Pure. No I/O. Safe to call anywhere.
 */

import { BENEFITS } from "./benefits";
import { SEGMENTS } from "./segments";
import { VENDORS, BENEFIT_VENDORS, FERTILITY_VENDORS } from "./vendors";
import { MANDATES } from "./mandates";
import { AXES, AXIS_WEIGHTS } from "./axes";

export type IssueSeverity = "error" | "warning";

export interface DataIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
}

/**
 * Known, accepted issues. Listed explicitly so they stay visible instead of
 * being suppressed by a blanket filter.
 *
 * BEN029: BENEFIT_VENDORS maps a BetterUp offering ("Leadership coaching and
 * mental fitness") to benefit BEN029, which is absent from BENEFITS — the table
 * runs BEN028 → BEN030. The mapping is therefore unreachable: nothing looks up
 * BEN029, so the row is dead rather than dangerous. Two valid fixes, both a
 * product-data decision rather than a code one:
 *   1. Add the missing benefit (leadership/executive coaching, Career
 *      Development) to BENEFITS, or
 *   2. Drop the BetterUp mapping.
 * Left as a warning until that's decided — inventing the benefit row would be
 * fabricating library content.
 */
const ACCEPTED_WARNINGS = new Set(["dangling-benefit-ref:BEN029"]);

export function validateResearchData(): DataIssue[] {
  const issues: DataIssue[] = [];
  const add = (severity: IssueSeverity, code: string, message: string) =>
    issues.push({ severity, code, message });

  const benefitIds = new Set(BENEFITS.map((b) => b.id));
  const vendorIds = new Set(VENDORS.map((v) => v.id));

  // Duplicate IDs would make Map lookups silently prefer one row.
  const dupes = (ids: string[], label: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) add("error", "duplicate-id", `Duplicate ${label} ID: ${id}`);
      seen.add(id);
    }
  };
  dupes(BENEFITS.map((b) => b.id), "benefit");
  dupes(VENDORS.map((v) => v.id), "vendor");
  dupes(SEGMENTS.map((s) => s.id), "segment");
  dupes(MANDATES.map((m) => m.id), "mandate");

  // Segment → benefit references.
  for (const seg of SEGMENTS) {
    const refs = [
      ...seg.highValueBenefits,
      ...seg.mediumValueBenefits,
      ...seg.lowValueBenefits,
    ];
    for (const id of refs) {
      if (!benefitIds.has(id)) {
        add("error", "dangling-benefit-ref", `Segment ${seg.id} references missing benefit ${id}`);
      }
    }
    const dupeWithin = refs.filter((id, i) => refs.indexOf(id) !== i);
    if (dupeWithin.length) {
      add("warning", "benefit-in-multiple-tiers",
        `Segment ${seg.id} lists ${[...new Set(dupeWithin)].join(", ")} in more than one value tier`);
    }
  }

  // BenefitVendor → benefit / vendor references.
  for (const bv of BENEFIT_VENDORS) {
    const key = `dangling-benefit-ref:${bv.benefitId}`;
    if (!benefitIds.has(bv.benefitId)) {
      add(ACCEPTED_WARNINGS.has(key) ? "warning" : "error", "dangling-benefit-ref",
        `BENEFIT_VENDORS maps ${bv.vendorName} to missing benefit ${bv.benefitId}`
        + (ACCEPTED_WARNINGS.has(key) ? " (known, see ACCEPTED_WARNINGS)" : ""));
    }
    if (!vendorIds.has(bv.vendorId)) {
      add("error", "dangling-vendor-ref",
        `BENEFIT_VENDORS references missing vendor ${bv.vendorId} (${bv.vendorName})`);
    }
  }

  // Vendor name drift between the join row and the vendor record.
  for (const bv of BENEFIT_VENDORS) {
    const v = VENDORS.find((x) => x.id === bv.vendorId);
    if (v && v.name !== bv.vendorName) {
      add("warning", "vendor-name-mismatch",
        `BENEFIT_VENDORS says "${bv.vendorName}" but VENDORS says "${v.name}" for ${bv.vendorId}`);
    }
  }

  // Every benefit should be reachable from at least one segment, or it can
  // never appear in a report.
  const reachable = new Set(
    SEGMENTS.flatMap((s) => [
      ...s.highValueBenefits,
      ...s.mediumValueBenefits,
      ...s.lowValueBenefits,
    ]),
  );
  const orphans = BENEFITS.filter((b) => !reachable.has(b.id));
  if (orphans.length) {
    add("warning", "unreachable-benefit",
      `${orphans.length} benefit(s) not referenced by any segment, so they can never surface: `
      + orphans.map((b) => b.id).join(", "));
  }

  // Vendors with no benefit mapping are similarly unreachable.
  const mappedVendors = new Set(BENEFIT_VENDORS.map((bv) => bv.vendorId));
  const looseVendors = VENDORS.filter((v) => !mappedVendors.has(v.id));
  if (looseVendors.length) {
    add("warning", "unmapped-vendor",
      `${looseVendors.length} vendor(s) with no benefit mapping: `
      + looseVendors.map((v) => v.id).join(", "));
  }

  // Mandates: dates parseable, self-insured claims carry an ERISA note.
  for (const m of MANDATES) {
    if (Number.isNaN(Date.parse(m.effectiveDate))) {
      add("error", "bad-date", `Mandate ${m.id} has unparseable effectiveDate "${m.effectiveDate}"`);
    }
    if (!/^[A-Z]{2}$/.test(m.state)) {
      add("error", "bad-state", `Mandate ${m.id} has malformed state "${m.state}"`);
    }
    if (!m.erisa?.trim()) {
      add("error", "missing-erisa-note",
        `Mandate ${m.id} has no ERISA applicability note — self-insured reach is the load-bearing fact`);
    }
  }

  // Every segment must carry dimensions, or the matcher silently skips it and
  // that segment becomes unreachable without any error.
  for (const seg of SEGMENTS) {
    if (!seg.dimensions) {
      add("error", "missing-dimensions",
        `Segment ${seg.id} (${seg.name}) has no dimensions — matchSegmentToLibrary skips it entirely`);
    }
  }

  // Normalised weights must sum to 1, or the overall score is not what it
  // claims to be. Derived from relativeWeight, so this is a guard against a
  // future edit breaking the derivation rather than a transcription check.
  const weightSum = Object.values(AXIS_WEIGHTS).reduce((t, w) => t + w, 0);
  if (Math.abs(weightSum - 1) > 1e-9) {
    add("error", "axis-weights",
      `Normalised axis weights sum to ${weightSum.toFixed(6)}, expected 1.0 — overall score would be misscaled`);
  }
  if (AXES.some((a) => !Number.isInteger(a.relativeWeight) || a.relativeWeight <= 0)) {
    add("error", "axis-weights", "Every axis relativeWeight must be a positive integer");
  }
  if (new Set(AXES.map((a) => a.colorToken)).size !== AXES.length) {
    add("error", "axis-colour-collision", "Two axes share a colour token");
  }

  // Fertility comparison set should have exactly one featured vendor.
  const featured = FERTILITY_VENDORS.filter((v) => v.featured);
  if (featured.length > 1) {
    add("warning", "multiple-featured-vendors",
      `${featured.length} fertility vendors flagged featured: ${featured.map((v) => v.name).join(", ")}`);
  }

  return issues;
}

/** True when there are no errors. Warnings are allowed. */
export function isResearchDataValid(): boolean {
  return !validateResearchData().some((i) => i.severity === "error");
}

/** Human-readable report, for a script or CI log. */
export function formatDataIssues(issues: DataIssue[] = validateResearchData()): string {
  if (!issues.length) return "Research data: no issues.";
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const lines = [
    `Research data: ${errors.length} error(s), ${warnings.length} warning(s).`,
    ...issues.map((i) => `  [${i.severity}] ${i.code}: ${i.message}`),
  ];
  return lines.join("\n");
}
