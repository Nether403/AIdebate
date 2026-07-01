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
  'lib/design-system/__tests__/showcase-entries.test.ts',
  'lib/design-system/__tests__/cta-nav-targets.test.ts',
  'lib/design-system/__tests__/showcase-cta-integrity.test.ts',
  'lib/design-system/__tests__/nav-allowlist.test.ts',
  'lib/design-system/__tests__/nav-source-destinations.test.ts',
  'lib/design-system/__tests__/image-alt.test.ts',
  'components/layout/__tests__/theme-provider.test.ts',
  'components/layout/__tests__/app-shell-responsive.test.ts',
  'components/layout/__tests__/ambient-glow-static.test.ts',
  'app/showcase/__tests__/demo-shell-conformance.test.ts',
  'app/showcase/__tests__/eval-report-honesty.test.ts',
  'components/app/__tests__/css-bar.test.ts',
  'components/app/__tests__/severity-encoding.test.ts',
  '__tests__/middleware-redirect.test.ts',
  'app/__tests__/landing-structure.test.ts',
  'app/__tests__/palette-contrast.test.ts',
  'app/__tests__/accent-discipline.test.ts',
  'app/__tests__/reduced-motion.test.ts',
]

const stream = run({ files: testFiles, concurrency: true })

stream.compose(specReporter).pipe(process.stdout)

stream.on('test:fail', () => {
  process.exitCode = 1
})

stream.on('end', () => {
  process.exit(process.exitCode || 0)
})
