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
  'lib/benchmark/__tests__/snapshots.test.ts',
  'lib/benchmark/__tests__/dataset.test.ts',
]

const stream = run({ files: testFiles, concurrency: true })

stream.compose(specReporter).pipe(process.stdout)

stream.on('test:fail', () => {
  process.exitCode = 1
})

stream.on('end', () => {
  process.exit(process.exitCode || 0)
})
