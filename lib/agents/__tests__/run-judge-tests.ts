/**
 * Test Runner for Judge Agent Tests
 * Uses Node.js built-in test runner
 */

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';

async function runTests() {
  console.log('Running Judge Agent Tests...\n');

  const testFiles = ['lib/agents/__tests__/judge.test.ts'];

  const stream = run({
    files: testFiles,
    concurrency: false,
  });

  stream.compose(specReporter).pipe(process.stdout);

  stream.on('test:fail', () => {
    process.exitCode = 1;
  });
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
