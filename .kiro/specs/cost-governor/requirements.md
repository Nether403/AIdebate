# Requirements Document

## Introduction

The `cost-governor` feature hardens cost safety and removes a data-integrity footgun in the AI Debate Arena benchmarking workbench. It bundles three related items, in priority order:

1. **Real cost governor (highest value).** Track accumulated real cost per debate and per benchmark run from already-recorded `llm_provider_calls.cost_estimate` values, and trip an offending debate to `evaluation_failed` when a configurable per-debate or per-run cost ceiling is exceeded. Also fix the existing `lib/middleware/cost-guard.ts` bug where `currentSpend` is hardcoded to `0`, so the daily spending cap reflects real accumulated spend within the current day window.
2. **Schema cleanup.** Remove the legacy gamification footgun: the `userProfiles` table and the betting columns on `userVotes`, which back explicit non-goals (prediction markets, DebatePoints, superforecaster badges). Plain crowd voting data is retained.
3. **Documentation correction.** Mark the archived "marketplace of truth" paper as superseded so its design idea stops resurfacing as a false contradiction against the current research-workbench direction.

This feature aligns with the project's Phase 7 cost-safety and data-integrity priorities. Per `AGENTS.md`, evaluation-failed debates must be preserved, diagnosable, and excluded from aggregate metrics by default, and `$0`-reported costs (BYOK-routed and Azure deployments) are expected and must not be treated as defects.

## Glossary

- **System**: The AI Debate Arena benchmarking platform.
- **Cost_Governor**: The component that aggregates real recorded LLM cost and enforces per-debate and per-run cost ceilings during benchmark execution.
- **Cost_Guard**: The existing pre-creation middleware in `lib/middleware/cost-guard.ts` that blocks new debate creation when the daily spending cap would be exceeded.
- **Provider_Call_Record**: A row in the `llm_provider_calls` table, recording one LLM call with `cost_estimate`, `benchmarkRunId`, `debateId`, `stage`, and `status`.
- **Reported_Cost**: The `cost_estimate` value on a Provider_Call_Record. May be `0` for BYOK-routed or Azure-deployed models, or `null` when not recorded.
- **Accumulated_Debate_Cost**: The sum of Reported_Cost across all Provider_Call_Records for a single debate.
- **Accumulated_Run_Cost**: The sum of Reported_Cost across all Provider_Call_Records for a single benchmark run.
- **Per_Debate_Cost_Ceiling**: A configurable upper bound, in USD, on Accumulated_Debate_Cost for one debate.
- **Per_Run_Cost_Ceiling**: A configurable upper bound, in USD, on Accumulated_Run_Cost for one benchmark run.
- **Daily_Spending_Cap**: The `DAILY_SPENDING_CAP_USD` environment value (default `25`) bounding total spend within the current day window.
- **Current_Day_Spend**: The sum of Reported_Cost across all Provider_Call_Records created within the current day window.
- **Evaluation_Failed**: The `'evaluation_failed'` value of the `debates.status` field.
- **Run_Config**: The `benchmarkRuns.config` jsonb field, which carries per-run configuration.
- **Crowd_Vote_Record**: A row in the `userVotes` table limited to non-betting fields (`vote`, `confidence`, `reasoning`, and identity/abuse-prevention fields).
- **Archived_Marketplace_Paper**: The archived "marketplace of truth" design document under the project archive/docs.

## Requirements

### Requirement 1: Per-Debate Cost Ceiling Enforcement

**User Story:** As a benchmark operator, I want a debate to stop and be marked as evaluation-failed when its accumulated real cost exceeds a configured ceiling, so that a single runaway debate cannot consume an unbounded budget.

#### Acceptance Criteria

1. WHEN a Provider_Call_Record is recorded for a debate, THE Cost_Governor SHALL recompute the Accumulated_Debate_Cost for that debate as the arithmetic sum of the Reported_Cost values across all Provider_Call_Records associated with that debate, treating any Provider_Call_Record whose Reported_Cost is absent, null, or unreported as a contribution of 0 to the sum.
2. WHERE a Per_Debate_Cost_Ceiling is configured in the Run_Config, WHEN the Accumulated_Debate_Cost for a debate is recomputed, IF the Accumulated_Debate_Cost is strictly greater than the Per_Debate_Cost_Ceiling, THEN THE Cost_Governor SHALL set that debate's status to `evaluation_failed`.
3. WHERE a Per_Debate_Cost_Ceiling is configured in the Run_Config, WHEN the Accumulated_Debate_Cost for a debate is recomputed, IF the Accumulated_Debate_Cost is less than or equal to the Per_Debate_Cost_Ceiling, THEN THE Cost_Governor SHALL allow the debate to continue.
4. WHEN the Cost_Governor sets a debate's status to `evaluation_failed` due to the Per_Debate_Cost_Ceiling being exceeded, THE Cost_Governor SHALL prevent any further Provider_Call_Records from being initiated for that debate.
5. WHEN the Cost_Governor sets a debate's status to `evaluation_failed` due to the Per_Debate_Cost_Ceiling being exceeded, THE Cost_Governor SHALL record in that debate's `errorState` field the triggering ceiling type, the configured Per_Debate_Cost_Ceiling value, and the Accumulated_Debate_Cost value measured at the time the ceiling was exceeded.
6. WHERE no Per_Debate_Cost_Ceiling is configured in the Run_Config, THE Cost_Governor SHALL allow the debate to continue without evaluating or applying any per-debate cost ceiling.

### Requirement 2: Per-Run Cost Ceiling Enforcement

**User Story:** As a benchmark operator, I want a benchmark run to stop launching further debates and mark in-progress debates as evaluation-failed when the run's accumulated real cost exceeds a configured ceiling, so that an entire run cannot exceed its budget.

#### Acceptance Criteria

1. WHEN a Provider_Call_Record is recorded for a benchmark run, THE Cost_Governor SHALL compute the Accumulated_Run_Cost as the sum of Reported_Cost across all Provider_Call_Records for that benchmark run.
2. WHERE a Per_Run_Cost_Ceiling is configured, WHEN a Provider_Call_Record is recorded for a benchmark run, IF the resulting Accumulated_Run_Cost is strictly greater than the Per_Run_Cost_Ceiling, THEN THE Cost_Governor SHALL set every debate of that run whose status is `running` or `pending` to `evaluation_failed` and SHALL leave every debate whose status is neither `running` nor `pending` unchanged.
3. WHERE a Per_Run_Cost_Ceiling is configured, WHEN a Provider_Call_Record is recorded for a benchmark run, IF the resulting Accumulated_Run_Cost is strictly greater than the Per_Run_Cost_Ceiling, THEN THE Cost_Governor SHALL stop starting additional debates for that benchmark run for the remainder of the run.
4. WHEN the Cost_Governor sets debates to `evaluation_failed` because the Per_Run_Cost_Ceiling was exceeded, THE Cost_Governor SHALL record the triggering ceiling type, the configured ceiling value, and the Accumulated_Run_Cost in each affected debate's `errorState` field.
5. WHERE no Per_Run_Cost_Ceiling is configured, THE Cost_Governor SHALL continue launching debates for the benchmark run without applying a per-run cost ceiling.

### Requirement 3: Configurable Cost Ceilings

**User Story:** As a benchmark operator, I want to configure cost ceilings per run, so that I can set budgets appropriate to each experiment.

#### Acceptance Criteria

1. WHEN a benchmark run is initialized, THE Cost_Governor SHALL read the Per_Debate_Cost_Ceiling and the Per_Run_Cost_Ceiling from the Run_Config of that benchmark run before any debate in the run begins.
2. WHERE a cost ceiling is absent from the Run_Config, THE Cost_Governor SHALL treat that ceiling as unconfigured and SHALL NOT enforce any spending limit for that ceiling's scope (Per_Debate_Cost_Ceiling governs per-debate spend, Per_Run_Cost_Ceiling governs total run spend).
3. IF a configured cost ceiling value is not a finite number greater than or equal to 0.00 and less than or equal to 1,000,000.00, THEN THE Cost_Governor SHALL reject the Run_Config before the benchmark run starts, SHALL return a validation error identifying which ceiling field is invalid and the reason for rejection, and SHALL leave no benchmark run started.
4. IF an invalid cost ceiling value reaches cost evaluation without having been rejected during Run_Config validation, THEN THE Cost_Governor SHALL fail the benchmark run before dispatching any further LLM call, and SHALL record a failure reason indicating the ceiling value was undefined or out of range.

### Requirement 4: Graceful Handling of Zero and Missing Reported Cost

**User Story:** As a researcher using BYOK-routed and Azure-deployed models, I want calls that report `$0` cost to be handled as valid, so that expected zero-cost calls are not treated as defects and do not corrupt cost accounting.

#### Acceptance Criteria

1. WHEN a Provider_Call_Record has a Reported_Cost equal to numeric `0`, THE Cost_Governor SHALL add a contribution of exactly `0` for that record to the aggregated cost and SHALL complete the aggregation without raising an error or discarding the record.
2. WHEN a Provider_Call_Record has a `null` or absent Reported_Cost, THE Cost_Governor SHALL add a contribution of exactly `0` for that record to the aggregated cost, identical to the handling of an explicit numeric `0`.
3. WHILE every Provider_Call_Record for a debate or run reports a Reported_Cost of `0`, `null`, or absent, THE Cost_Governor SHALL compute the accumulated cost as exactly `0` and SHALL NOT trip any cost ceiling.
4. WHEN a debate or run contains a mix of Provider_Call_Records where some report `0`/`null`/absent and others report a Reported_Cost greater than `0`, THE Cost_Governor SHALL compute the accumulated cost as the sum of only the positive Reported_Cost values, with each `0`/`null`/absent record contributing exactly `0`.
5. IF a Provider_Call_Record has a Reported_Cost that is negative or non-numeric, THEN THE Cost_Governor SHALL treat that record as a `0` contribution, SHALL exclude its invalid value from the accumulated cost, and SHALL record an indication that the Reported_Cost was invalid without aborting the aggregation.

### Requirement 5: Preservation and Exclusion of Cost-Tripped Debates

**User Story:** As an alignment researcher, I want cost-tripped debates preserved and diagnosable but excluded from aggregate metrics, so that failures remain inspectable without polluting research results.

#### Acceptance Criteria

1. WHEN the Cost_Governor sets a debate's status to `evaluation_failed`, THE System SHALL retain that debate's existing turns, Provider_Call_Records, and metadata without deleting or modifying their recorded values.
2. WHEN a debate's status transitions to `evaluation_failed` from any status other than `evaluation_failed`, THE System SHALL increment the `evaluationFailedDebates` counter on the associated benchmark run by exactly 1.
3. IF the Cost_Governor sets a debate to `evaluation_failed` whose status is already `evaluation_failed`, THEN THE System SHALL leave the `evaluationFailedDebates` counter unchanged.
4. WHILE a debate has status `evaluation_failed`, THE System SHALL exclude that debate from all aggregate research metrics computed across debates, including aggregate judge win/loss tallies, crowd vote aggregates, and model rating computations.
5. WHERE a metrics request explicitly opts in to include evaluation-failed debates, THE System SHALL include debates with status `evaluation_failed` in the computed aggregate research metrics.
6. WHEN an individual debate with status `evaluation_failed` is requested for inspection or export, THE System SHALL return that debate's retained turns, Provider_Call_Records, metadata, and `errorState`.

### Requirement 6: Daily Spending Cap Reflects Real Accumulated Spend

**User Story:** As a benchmark operator, I want the daily spending cap to reflect actual accumulated spend, so that the cap actually prevents new debates once the day's budget is reached.

#### Acceptance Criteria

1. WHEN the Cost_Guard evaluates a new debate request, THE Cost_Guard SHALL compute Current_Day_Spend, in USD, as the sum of Reported_Cost across all Provider_Call_Records created within the current day window, where the current day window is 00:00:00.000 to 23:59:59.999 UTC of the current UTC calendar date.
2. WHEN the Cost_Guard evaluates a new debate request, IF the sum of Current_Day_Spend and the estimated cost of the requested debate is strictly greater than the Daily_Spending_Cap, THEN THE Cost_Guard SHALL deny the debate request with an HTTP 429 response.
3. WHEN the Cost_Guard denies a debate request, THE Cost_Guard SHALL NOT initiate any Provider_Call for that request, and SHALL include Current_Day_Spend, the Daily_Spending_Cap, and the estimated cost (each in USD) in the response body.
4. WHEN the Cost_Guard evaluates a new debate request, IF the sum of Current_Day_Spend and the estimated cost of the requested debate is less than or equal to the Daily_Spending_Cap, THEN THE Cost_Guard SHALL allow the debate request to proceed.
5. WHEN computing Current_Day_Spend, IF a Provider_Call_Record within the current day window has a `0` or `null` Reported_Cost, THEN THE Cost_Guard SHALL treat that record as a `0` contribution to Current_Day_Spend.
6. IF the Cost_Guard cannot retrieve Provider_Call_Records to compute Current_Day_Spend, THEN THE Cost_Guard SHALL deny the debate request and SHALL return an error indication rather than allowing the request by default.

### Requirement 7: Removal of Legacy Gamification Schema

**User Story:** As a maintainer, I want the legacy gamification tables and betting columns removed from the active schema, so that abandoned prediction-market, DebatePoints, and superforecaster features cannot be accidentally read or revived.

#### Acceptance Criteria

1. WHEN the active database schema is inspected, THE System SHALL ensure the `userProfiles` table does not exist in the active schema.
2. WHEN the active database schema is inspected, THE System SHALL ensure the betting columns `wagerAmount`, `oddsAtBet`, and `payoutAmount` do not exist on the `userVotes` table, while preserving all non-betting columns on that table.
3. WHEN the active database schema is inspected, THE System SHALL ensure no schema relation resolves to the removed `userProfiles` table.
4. WHEN the removal migration is applied to a database that still contains the `userProfiles` table and the `userVotes` betting columns, THE System SHALL remove the `userProfiles` table and those betting columns.
5. IF the removal migration fails during application, THEN THE System SHALL roll back the migration, leave the existing schema and data intact, and return an error.
6. WHEN the removal migration is applied to a database in which the `userProfiles` table and betting columns are already absent, THE System SHALL complete successfully without changing the schema.
7. WHERE removed gamification structures must be retained for historical reference, THE System SHALL relocate them to an explicitly archived schema that is unreachable from the active schema rather than leaving them in the active schema.

### Requirement 8: Retention of Plain Crowd Voting Data

**User Story:** As a researcher, I want plain crowd-voting data preserved, so that non-betting vote signal remains available after gamification is removed.

#### Acceptance Criteria

1. WHEN a schema migration that removes gamification features is applied, THE System SHALL preserve the `vote`, `confidence`, and `reasoning` columns on the `userVotes` table with their pre-migration data types and existing row values unchanged.
2. WHEN a schema migration that removes gamification features is applied, THE System SHALL preserve the debate-association, identity, and abuse-prevention columns (`debateId`, `userId`, `sessionId`, `ipAddress`, `wasCorrect`, `createdAt`) on the `userVotes` table with their pre-migration data types and existing row values unchanged.
3. WHEN a schema migration that removes gamification features is applied, THE System SHALL preserve the crowd vote tally columns (`crowdVotesProCount`, `crowdVotesConCount`, `crowdVotesTieCount`, `crowdWinner`) on the `debates` table with their pre-migration data types and existing row values unchanged.
4. IF a schema migration attempts to drop, rename, or change the data type of any retained column listed in criteria 1 through 3, THEN THE System SHALL reject the migration, leave the existing schema and data unchanged, and return an error indicating which protected column was affected.
5. WHEN a gamification-removal migration completes, THE System SHALL preserve 100% of the pre-migration row counts of the `userVotes` and `debates` tables, with zero rows deleted as a side effect of removing gamification fields.

### Requirement 9: Mark Archived Marketplace Paper as Superseded

**User Story:** As a contributor, I want the archived "marketplace of truth" paper clearly marked as superseded, so that its stale design idea stops resurfacing as a contradiction against the current research-workbench direction.

#### Acceptance Criteria

1. WHEN the superseded notice is applied to the Archived_Marketplace_Paper, THE System SHALL place the notice as the first content block, above any original heading or body content, identifying the document as superseded by the current research-workbench direction.
2. THE superseded notice SHALL reference `docs/REVIVAL_ROADMAP.md` and identify it as the current source of truth.
3. WHEN the superseded notice is applied, THE System SHALL preserve the original content of the Archived_Marketplace_Paper byte-for-byte below the notice, without modifying it.
4. IF the Archived_Marketplace_Paper already contains the superseded notice, THEN THE System SHALL NOT add a duplicate notice.
5. IF the Archived_Marketplace_Paper is missing or unreadable, THEN THE System SHALL make no partial changes and SHALL return an error indication.
