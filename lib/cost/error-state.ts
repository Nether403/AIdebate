import type { CeilingDecision, CeilingType } from './ceiling'

/**
 * The errorState payload written to `debates.errorState` when the cost governor
 * trips a debate. `stage: 'cost-governor'` discriminates it from the existing
 * judge/execution error-state shapes that share the field.
 */
export interface CostErrorState {
  stage: 'cost-governor'
  ceilingType: CeilingType
  /** The configured ceiling value that was exceeded. */
  ceiling: number
  /** The accumulated cost measured at the time the ceiling was exceeded. */
  accumulated: number
  /** ISO 8601 timestamp of when the trip was recorded. */
  measuredAt: string
}

/**
 * Build the cost-trip errorState payload for a tripped ceiling decision
 * (Requirements 1.5, 2.4). A tripped decision always carries a configured
 * (non-null) ceiling; the `?? 0` keeps the result a finite number for the
 * type system without ever being reached for a genuine trip.
 */
export function buildCostErrorState(decision: CeilingDecision): CostErrorState {
  return {
    stage: 'cost-governor',
    ceilingType: decision.ceilingType,
    ceiling: decision.ceiling ?? 0,
    accumulated: decision.accumulated,
    measuredAt: new Date().toISOString(),
  }
}
