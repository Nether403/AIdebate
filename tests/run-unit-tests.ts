import { run } from 'node:test'
import { spec as specReporter } from 'node:test/reporters'

const testFiles = [
  'lib/llm/utils/__tests__/sanitize.test.ts',
  'lib/llm/__tests__/openai-sanitization.test.ts',
  'lib/llm/__tests__/fallback-model.test.ts',
  'lib/agents/__tests__/judge-parse-failure.test.ts',
  'lib/agents/__tests__/turn-length.test.ts',
  'lib/debate/__tests__/judge-failure.test.ts',
  'app/api/debates/[id]/export/__tests__/format.test.ts',
  'lib/benchmark/__tests__/config.test.ts',
  'lib/benchmark/__tests__/runner.test.ts',
  'lib/benchmark/__tests__/runner-gating.test.ts',
  'lib/benchmark/__tests__/snapshots.test.ts',
  'lib/benchmark/__tests__/dataset.test.ts',
  'lib/benchmark/__tests__/evaluation-failed-export.test.ts',
  'lib/benchmark/__tests__/metrics-inclusion.test.ts',
  'lib/benchmark/__tests__/divergence.test.ts',
  'lib/benchmark/__tests__/calibration.test.ts',
  'lib/db/__tests__/schema-guard.test.ts',
  'lib/topics/__tests__/topic-sets.test.ts',
  'lib/prompts/__tests__/registry.test.ts',
  'lib/cost/__tests__/aggregate.test.ts',
  'lib/cost/__tests__/ceiling-trip.test.ts',
  'lib/cost/__tests__/ceiling-validation.test.ts',
  'lib/cost/__tests__/error-state.test.ts',
  'lib/cost/__tests__/governor-run-trip.test.ts',
  'lib/cost/__tests__/governor-preventive-gate.test.ts',
  'lib/cost/__tests__/governor-trip-counter.test.ts',
  'lib/middleware/__tests__/cost-guard-decision.test.ts',
  'lib/middleware/__tests__/cost-guard-window.test.ts',
  'lib/middleware/__tests__/cost-guard-failclosed.test.ts',
  'lib/db/__tests__/migration-guard.test.ts',
  'scripts/__tests__/mark-superseded.test.ts',
  'scripts/__tests__/mark-superseded.unit.test.ts',
]

const stream = run({ files: testFiles, concurrency: true })

stream.compose(specReporter).pipe(process.stdout)

stream.on('test:fail', () => {
  process.exitCode = 1
})

stream.on('end', () => {
  process.exit(process.exitCode || 0)
})
