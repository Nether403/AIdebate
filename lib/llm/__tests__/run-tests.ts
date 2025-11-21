/**
 * Test Runner for LLM Client Tests
 * Uses Node.js built-in test runner
 */

import { run } from 'node:test';
import { spec as specReporter } from 'node:test/reporters';
import { glob } from 'glob';

async function runTests() {
  console.log('Running LLM Client Tests...\n');

  const testFiles = await glob('lib/llm/__tests__/**/*.test.ts');
  
  if (testFiles.length === 0) {
    console.log('No test files found.');
    process.exit(0);
  }

  console.log(`Found ${testFiles.length} test file(s):\n`);
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  const stream = run({
    files: testFiles,
    concurrency: true,
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
