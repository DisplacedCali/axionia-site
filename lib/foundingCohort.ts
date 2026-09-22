import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Founding cohort terms.
 *
 * The first 5–10 clients run free, then convert to a fee priced against
 * verified savings (same basis as /pricing — a share of the value
 * protected, not of spend). Two of the three facts that define the offer
 * are the same for every company in the cohort, so they live here as
 * constants rather than as columns: `founding_cohort` and `fee_rate` on
 * `companies` (039) are the only per-row facts, because they're the only
 * ones that vary per row.
 *
 * CONVERSION_DATE is a placeholder pending confirmation — set from "free
 * through 2025, paid model into 2026" read against today's date (services in
 * 2026), i.e. one calendar year on from a stale draft. Move this one line
 * when the real date is decided; nothing else in the app should need to
 * change.
 */
export const FOUNDING_COHORT_CAP = 10;
export const FOUNDING_COHORT_CONVERSION_DATE = "2027-01-01"; // confirm this

export function daysUntilConversion(from: Date = new Date()): number {
  const target = new Date(`${FOUNDING_COHORT_CONVERSION_DATE}T00:00:00`);
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function conversionHasPassed(from: Date = new Date()): boolean {
  return daysUntilConversion(from) <= 0;
}

/**
 * How many of the founding seats are already spoken for.
 *
 * Counts `founding_cohort = true` regardless of stage — a company in
 * `proposal` with the terms on the table is holding a seat just as much as
 * one already at `client`, and the cap exists to keep the offer scarce,
 * not to track who's paying yet.
 */
export async function foundingCohortSeatsTaken(): Promise<number> {
  const { count } = await createAdminClient()
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("founding_cohort", true);
  return count ?? 0;
}
