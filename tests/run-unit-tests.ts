import { run } from 'node:test'
import { spec as specReporter } from 'node:test/reporters'

const testFiles = [
  'lib/llm/utils/__tests__/sanitize.test.ts',
  'lib/llm/__tests__/openai-sanitization.test.ts',
]

const stream = run({ files: testFiles, concurrency: true })

stream.compose(specReporter).pipe(process.stdout)

stream.on('test:fail', () => {
  process.exitCode = 1
})

stream.on('end', () => {
  process.exit(process.exitCode || 0)
})
