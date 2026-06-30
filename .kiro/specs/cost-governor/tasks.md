# Implementation Plan: cost-governor

## Overview

This plan implements the `cost-governor` feature as a thin layer over existing data: a pure cost-governance core (`lib/cost/*`), a DB shell that hooks `recordLLMProviderCall`, a fix for the hardcoded daily-spend bug in `lib/middleware/cost-guard.ts`, an opt-in extension to `buildModelMetrics`, a Drizzle schema-cleanup migration, and an idempotent document-supersede transform.

Implementation language is **TypeScript** (matches the design and the existing Next.js / Drizzle stack). Property tests use `fast-check` with the repo's built-in `node:test` runner (run via `tsx tests/run-unit-tests.ts`), minimum 100 runs each. `fast-check` is the only new dev dependency; this repo does not use vitest. Each property test carries the comment `// Feature: cost-governor, Property {n}: {text}`.

Tasks build incrementally: the pure core first, then the DB shell that consumes it, then wiring into telemetry and the runner, then the guard fix, then metrics, then schema cleanup, then the doc correction. Test sub-tasks marked `*` are optional.

## Tasks

- [x] 1. Create the pure cost-aggregation core
  - [x] 1.1 Implement `lib/cost/aggregate.ts`
    - Define `ReportedCost`, `CostSummary`, `normalizeCost`, and `sumReportedCost`
    - `normalizeCost`: finite & `>= 0` keeps value; `0`/`null`/`undefined`/negative/non-numeric → `0`
    - `sumReportedCost`: returns finite `total >= 0` and `invalidCount` (negative + non-numeric entries); never throws
    - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 1.2 Write property test for cost aggregation
    - **Property 1: Cost aggregation normalizes and sums**
    - Generate arrays mixing `fc.double()`, negatives, `NaN`, `Infinity`, `null`, `undefined`
    - **Validates: Requirements 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 2. Create the pure ceiling-evaluation and validation core
  - [x] 2.1 Implement `lib/cost/ceiling.ts`
    - Define `CeilingType`, `CeilingDecision`, `CEILING_MIN`, `CEILING_MAX`, `CeilingValidationError`
    - `evaluateCeiling`: trips iff ceiling is non-null AND `accumulated > ceiling` (strict); null ceiling never trips
    - `validateCostCeilings`: each present ceiling must be finite in `[0, 1_000_000]`; errors name the offending field
    - _Requirements: 1.2, 1.3, 1.6, 2.5, 3.2, 3.3_
  - [x] 2.2 Write property test for ceiling trip condition
    - **Property 2: Ceiling trips iff configured and strictly exceeded**
    - Generate accumulated/ceiling pairs including null ceilings and exact-boundary equality
    - **Validates: Requirements 1.2, 1.3, 1.6, 2.5, 3.2**
  - [x] 2.3 Write property test for ceiling validation range
    - **Property 10: Ceiling validation accepts exactly the in-range values**
    - Generate candidate values straddling `0` and `1_000_000`, plus non-finite/non-numeric
    - **Validates: Requirements 3.3**

- [x] 3. Create the pure cost error-state builder
  - [x] 3.1 Implement `lib/cost/error-state.ts`
    - Define `CostErrorState` (`stage: 'cost-governor'`, `ceilingType`, `ceiling`, `accumulated`, `measuredAt`)
    - `buildCostErrorState(decision)` populates ceiling type, configured ceiling, accumulated cost, ISO timestamp
    - _Requirements: 1.5, 2.4_
  - [x] 3.2 Write property test for error-state completeness
    - **Property 3: A cost trip records complete diagnostics**
    - **Validates: Requirements 1.5, 2.4**

- [x] 4. Checkpoint - pure core
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend benchmark run config with ceiling fields
  - [x] 5.1 Add ceiling fields to `lib/benchmark/config.ts`
    - Add optional `perDebateCostCeilingUsd` and `perRunCostCeilingUsd` to `benchmarkRunConfigSchema` (`z.number().finite().min(0).max(1_000_000).optional()`)
    - Confirm `parseBenchmarkRunConfig` throws a field-identifying error on invalid input (Req 3.3)
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.2 Write unit tests for config ceiling parsing
    - Valid, absent, and out-of-range ceiling values; assert field-identifying error message
    - _Requirements: 3.2, 3.3_

- [x] 6. Implement the cost governor DB shell
  - [x] 6.1 Implement read helpers in `lib/cost/governor.ts`
    - `getRunCeilings(benchmarkRunId)`: read + validate ceilings from the run `config` jsonb
    - `isRunCostTripped(benchmarkRunId)`: preventive gate — true if the run is already cost-tripped
    - Consume `sumReportedCost` for debate/run sums over `llm_provider_calls`
    - _Requirements: 2.3, 3.1, 3.4_
  - [x] 6.2 Implement `recomputeAndGovern` and trip logic in `lib/cost/governor.ts`
    - Sum debate + run cost from `llm_provider_calls`; evaluate per-debate and per-run ceilings
    - Per-debate trip: set debate `status = evaluation_failed`, write cost `errorState`, increment `evaluationFailedDebates` once
    - Per-run trip: transition only `running`/`pending` debates; leave all others unchanged
    - Idempotent: a debate already `evaluation_failed` is left unchanged and does not re-increment the counter
    - Preserve turns, provider calls, votes, tallies (only `status`/`errorState`/`completedAt` change)
    - _Requirements: 1.2, 1.4, 1.5, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3_
  - [x] 6.3 Write property test for run-trip status filtering
    - **Property 5: A run trip transitions only running or pending debates**
    - Generate debate sets with random `status` values
    - **Validates: Requirements 2.2**
  - [x] 6.4 Write property test for artifact preservation and counter
    - **Property 6: Tripping preserves artifacts and increments the counter exactly once**
    - Generate random trip-attempt sequences across a run's debates
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [x] 6.5 Write property test for the preventive gate
    - **Property 4: No provider calls after a trip**
    - **Validates: Requirements 1.4, 2.3**

- [x] 7. Wire the governor into telemetry and the runner
  - [x] 7.1 Hook `recomputeAndGovern` into `recordLLMProviderCall` (`lib/llm/telemetry.ts`)
    - Call `recomputeAndGovern(debateId, benchmarkRunId)` after a successful insert
    - Catch + log governance errors (match existing telemetry try/catch) so a recorded artifact is never corrupted
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  - [x] 7.2 Add ceiling read + run-trip gate to `lib/benchmark/runner.ts`
    - Read ceilings via `getRunCeilings` before launching any debate (Req 3.1)
    - Re-check `isRunCostTripped` at the top of the loop body; stop starting new debates when tripped
    - Fail the run before dispatch if a ceiling reaches evaluation invalid/out-of-range (Req 3.4)
    - _Requirements: 2.3, 3.1, 3.4_
  - [x] 7.3 Write unit tests for runner gating
    - Ceilings read before first debate launches (Req 3.1); invalid ceiling injected at evaluation fails run before dispatch (Req 3.4)
    - _Requirements: 3.1, 3.4_

- [x] 8. Checkpoint - governor wired end to end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Fix the daily cost guard
  - [x] 9.1 Implement real spend in `lib/middleware/cost-guard.ts`
    - Add `computeCurrentDaySpend(now?)`: sum `cost_estimate` over `[00:00:00.000, 23:59:59.999]` UTC of the current date, normalizing `0`/`null` → `0`
    - Replace hardcoded `currentSpend = 0` in `checkCostGuard`; deny iff `currentSpend + estimatedCost > cap`
    - Return `currentSpend`, `cap`, `estimatedCost` in the response; **fail closed** (`allowed: false, error: true`) if the sum query throws
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 9.2 Write property test for current-day spend window
    - **Property 8: Current-day spend sums only in-window costs**
    - Generate timestamps clustered around the UTC midnight boundary
    - **Validates: Requirements 6.1, 6.5**
  - [x] 9.3 Write property test for the daily cap decision
    - **Property 9: Daily cap decision boundary and denial payload**
    - Generate spend/estimate/cap triples straddling the boundary
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [x] 9.4 Write unit test for fail-closed behavior
    - Throwing spend query → `allowed: false, error: true`, no provider call initiated
    - _Requirements: 6.6_

- [x] 10. Extend aggregate metrics with an evaluation-failed opt-in
  - [x] 10.1 Add `includeEvaluationFailed` option to `buildModelMetrics` (`lib/benchmark/dataset.ts`)
    - Default `false` keeps current exclusion; `true` includes `evaluation_failed` debates in win/loss/tie aggregation
    - Wire the opt-in query param through `app/api/monitoring/metrics` and `app/api/admin/metrics`
    - _Requirements: 5.4, 5.5_
  - [x] 10.2 Write property test for metrics inclusion/exclusion
    - **Property 7: Aggregate metrics exclude evaluation-failed debates by default and include them on opt-in**
    - Generate debate sets with random statuses
    - **Validates: Requirements 5.4, 5.5**
  - [x] 10.3 Write unit test for evaluation-failed debate inspection/export
    - Fetching an `evaluation_failed` debate returns retained turns, provider calls, metadata, and `errorState`
    - _Requirements: 5.6_

- [x] 11. Checkpoint - cost safety complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Schema cleanup: edit Drizzle schema and add a guard
  - [x] 12.1 Remove gamification structures from `lib/db/schema.ts`
    - Delete `userProfiles` table + `userProfilesRelations`; remove `userVotes.{wagerAmount, oddsAtBet, payoutAmount}` and the `userVotes -> userProfiles` relation
    - Keep `userVotes.{vote, confidence, reasoning, debateId, userId, sessionId, ipAddress, wasCorrect, createdAt}` and `debates.{crowdVotesProCount, crowdVotesConCount, crowdVotesTieCount, crowdWinner}` intact
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_
  - [x] 12.2 Implement the protected-column migration guard
    - A pure check that rejects any drop/rename/retype of a protected `userVotes`/`debates` column and names it; allows operations on non-protected columns
    - _Requirements: 8.4_
  - [x] 12.3 Write property test for the column guard
    - **Property 12: Protected columns cannot be dropped, renamed, or retyped**
    - Generate column operations over the known `userVotes`/`debates` column set
    - **Validates: Requirements 8.4**
  - [x] 12.4 Write static schema-guard test over `lib/db/schema.ts`
    - Assert protected column set present and no relation references `userProfiles`
    - _Requirements: 7.3, 8.4_

- [x] 13. Schema cleanup: generate and harden the migration
  - [x] 13.1 Generate and edit the `drizzle/0005_*.sql` migration
    - Relocate `user_profiles` + betting columns into an `archive` schema (e.g. `archive.user_profiles_legacy`), unreachable from `public` (Req 7.7)
    - Drop `user_profiles` and the betting columns from `public`; wrap in a transaction (rollback on failure)
    - Make idempotent with `IF EXISTS` / `IF NOT EXISTS` guards (re-apply = no-op success)
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7_
  - [x] 13.2 Update callers that reference removed columns
    - Update `lib/middleware/validation.ts` (remove `wagerAmount` from the vote schema) and `app/api/monitoring/metrics/route.ts` (remove `wager_amount` read) so the build stays green
    - _Requirements: 7.2, 8.1_
  - [x] 13.3 Write integration tests for the migration (Neon branch)
    - Apply `0005` on a seeded branch: removals + relocation + unreachability; induced mid-migration rollback; re-application no-op; row-count + value preservation for `userVotes`/`debates`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.5_

- [x] 14. Checkpoint - schema cleanup complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Documentation correction: supersede transform
  - [x] 15.1 Implement the idempotent supersede transform
    - In `scripts/mark-superseded.ts`: read the archived paper, check for a notice sentinel, and if absent prepend a fixed notice block referencing `docs/REVIVAL_ROADMAP.md`, preserving original bytes below
    - Confirm the concrete archived-paper path at implementation time; error without partial writes if the file is missing/unreadable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 15.2 Write property test for the supersede transform
    - **Property 11: Document supersede is idempotent and preserves the original**
    - Generate empty, notice-already-present, and Unicode content
    - **Validates: Requirements 9.3, 9.4**
  - [x] 15.3 Write unit tests for supersede ordering and missing-file path
    - Notice-first ordering + roadmap reference on a sample doc (Req 9.1, 9.2); missing-file error path (Req 9.5)
    - _Requirements: 9.1, 9.2, 9.5_

- [x] 16. Final checkpoint - run full baseline
  - Ensure `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` pass; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (test sub-tasks) and can be skipped for a faster MVP, but property tests are how the design's correctness guarantees are verified.
- Each task references specific requirements for traceability.
- Property tests use `fast-check` with the built-in `node:test` runner (run via `tsx tests/run-unit-tests.ts`) at minimum 100 runs each; one property → one test, tagged `// Feature: cost-governor, Property {n}: {text}`. New test files are registered in `tests/run-unit-tests.ts`.
- Cost-safety paths fail closed; artifact-preservation paths fail soft (governance errors log and continue).
- Migration integration tests run against a disposable Neon branch so production data is never touched.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "5.1", "12.1", "15.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "3.2", "5.2", "6.1", "12.2", "15.2", "15.3"] },
    { "id": 2, "tasks": ["6.2", "12.3", "12.4", "13.1"] },
    { "id": 3, "tasks": ["6.3", "6.4", "6.5", "9.1", "13.2"] },
    { "id": 4, "tasks": ["7.1", "9.2", "9.3", "9.4", "13.3"] },
    { "id": 5, "tasks": ["7.2", "10.1"] },
    { "id": 6, "tasks": ["7.3", "10.2", "10.3"] }
  ]
}
```
