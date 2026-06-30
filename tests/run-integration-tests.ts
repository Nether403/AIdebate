import { run } from 'node:test'
import { spec as specReporter } from 'node:test/reporters'

// Integration tests run against a real Postgres/Neon connection. They are
// self-guarding: each suite SKIPS cleanly (no failure, exit 0) unless a
// disposable test database is explicitly designated via
// INTEGRATION_TEST_DATABASE_URL / TEST_DATABASE_URL, or ALLOW_INTEGRATION_DB_TESTS=1
// alongside a throwaway DATABASE_URL. Production databases are never touched.
const testFiles = [
  'tests/integration/migration-0005.integration.test.ts',
]

const stream = run({ files: testFiles, concurrency: false })

stream.compose(specReporter).pipe(process.stdout)

stream.on('test:fail', () => {
  process.exitCode = 1
})

stream.on('end', () => {
  process.exit(process.exitCode || 0)
})
