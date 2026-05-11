import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseBenchmarkRunConfig } from '@/lib/benchmark/config'
import { runBenchmark } from '@/lib/benchmark/runner'

function getConfigPath(argv: string[]): string | null {
  const explicitIndex = argv.findIndex(arg => arg === '--config')
  if (explicitIndex >= 0) {
    return argv[explicitIndex + 1] || null
  }

  return argv[2] || null
}

async function main() {
  const configPath = getConfigPath(process.argv)

  if (!configPath) {
    console.error('Usage: npm run benchmark:run -- --config <path-to-config.json>')
    process.exit(1)
  }

  const absoluteConfigPath = resolve(process.cwd(), configPath)
  const rawConfig = await readFile(absoluteConfigPath, 'utf8')
  const config = parseBenchmarkRunConfig(JSON.parse(rawConfig))

  console.log(`[Benchmark] Starting benchmark run: ${config.name}`)
  console.log(`[Benchmark] Config: ${absoluteConfigPath}`)
  console.log(`[Benchmark] Debate count: ${config.debates.length}`)

  const result = await runBenchmark(config)

  console.log('[Benchmark] Completed')
  console.log(JSON.stringify(result, null, 2))
}

main().catch(error => {
  console.error('[Benchmark] Failed')
  console.error(error)
  process.exit(1)
})
