/**
 * Pure cost-aggregation core for the cost-governor feature.
 *
 * Sums the `cost_estimate` (Reported_Cost) values recorded on `llm_provider_calls`
 * rows. `$0`/`null` costs (BYOK-routed and Azure deployments) are valid data, not
 * defects, and contribute exactly 0. Negative and non-numeric values are invalid;
 * they also contribute 0 but are counted so the caller can surface that the data
 * was malformed. Aggregation never throws.
 *
 * Requirements: 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5
 */

/** A single record's reported cost: a number, null, undefined, or an invalid value. */
export type ReportedCost = number | null | undefined

export interface CostSummary {
  /** Arithmetic sum of valid (finite, >= 0) contributions; always finite and >= 0. */
  total: number
  /** Count of records normalized to 0 because their cost was negative or non-numeric. */
  invalidCount: number
}

/**
 * Normalize one record's cost: a finite number `>= 0` keeps its value; everything
 * else (0 is already valid, null, undefined, negative, NaN, Infinity, non-number)
 * normalizes to 0.
 */
export function normalizeCost(cost: ReportedCost): number {
  return typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : 0
}

/** True for values that are invalid cost data: negative or non-numeric (incl. NaN/Infinity). */
function isInvalidCost(cost: ReportedCost): boolean {
  // null/undefined are "absent", not invalid (Req 4.2) — they contribute 0 but are not counted.
  if (cost === null || cost === undefined) return false
  // A non-finite or negative number is invalid (Req 4.5); so is a non-number.
  return typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0
}

/**
 * Sum reported costs, treating 0/null/absent/negative/non-numeric as a 0 contribution.
 * Returns the running `total` (finite, `>= 0`) and the `invalidCount` of entries that
 * were normalized away because they were negative or non-numeric. Never throws.
 */
export function sumReportedCost(costs: ReportedCost[]): CostSummary {
  let total = 0
  let invalidCount = 0

  for (const cost of costs) {
    if (isInvalidCost(cost)) invalidCount += 1
    total += normalizeCost(cost)
  }

  return { total, invalidCount }
}
