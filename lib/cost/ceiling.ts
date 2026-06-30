/**
 * Pure ceiling-evaluation and validation core for the cost governor.
 *
 * A ceiling trips iff it is configured (non-null) AND the accumulated cost is
 * strictly greater than the ceiling. An unconfigured (null) ceiling never trips
 * and never restricts. Validation accepts exactly the finite values in
 * [CEILING_MIN, CEILING_MAX].
 *
 * Requirements: 1.2, 1.3, 1.6, 2.5, 3.2, 3.3
 */

export type CeilingType = 'per_debate' | 'per_run'

export interface CeilingDecision {
  tripped: boolean
  ceilingType: CeilingType
  /** Configured ceiling, or null when unconfigured. */
  ceiling: number | null
  accumulated: number
}

export const CEILING_MIN = 0
export const CEILING_MAX = 1_000_000

export interface CeilingValidationError {
  field: 'perDebateCostCeilingUsd' | 'perRunCostCeilingUsd'
  reason: string
}

/**
 * Trips iff `ceiling` is configured (non-null) AND `accumulated` is strictly
 * greater than `ceiling`. A null ceiling is unconfigured: it never trips.
 */
export function evaluateCeiling(
  ceilingType: CeilingType,
  accumulated: number,
  ceiling: number | null
): CeilingDecision {
  const tripped = ceiling !== null && accumulated > ceiling
  return { tripped, ceilingType, ceiling, accumulated }
}

/** A finite number within the inclusive [CEILING_MIN, CEILING_MAX] range. */
function isValidCeiling(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= CEILING_MIN &&
    value <= CEILING_MAX
  )
}

/**
 * Validate the optional cost-ceiling fields of a run config. A ceiling that is
 * absent (null/undefined) is unconfigured and valid. Any present ceiling must
 * be a finite number in [CEILING_MIN, CEILING_MAX]; otherwise an error naming
 * the offending field is returned.
 */
export function validateCostCeilings(config: {
  perDebateCostCeilingUsd?: unknown
  perRunCostCeilingUsd?: unknown
}): { valid: boolean; errors: CeilingValidationError[] } {
  const errors: CeilingValidationError[] = []

  const fields: CeilingValidationError['field'][] = [
    'perDebateCostCeilingUsd',
    'perRunCostCeilingUsd',
  ]

  for (const field of fields) {
    const value = config[field]
    // Absent ceilings are unconfigured and valid.
    if (value === undefined || value === null) continue
    if (!isValidCeiling(value)) {
      errors.push({
        field,
        reason: `must be a finite number in [${CEILING_MIN}, ${CEILING_MAX}]`,
      })
    }
  }

  return { valid: errors.length === 0, errors }
}
