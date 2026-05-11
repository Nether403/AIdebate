import 'dotenv/config'
import { createDebateEngine } from '@/lib/debate/engine'
import { DebateConfigSchema } from '@/lib/debate/config'
import { executeDebate } from '@/lib/debate/executor'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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
    console.error('Usage: npm run debate:run -- --config <path-to-config.json>')
    process.exit(1)
  }

  const absoluteConfigPath = resolve(process.cwd(), configPath)
  const rawConfig = await readFile(absoluteConfigPath, 'utf8')
  const config = DebateConfigSchema.parse(JSON.parse(rawConfig))
  const engine = createDebateEngine()

  console.log(`[Debate] Initializing from ${absoluteConfigPath}`)
  const session = await engine.initializeDebate(config)

  console.log(`[Debate] Starting ${session.id}`)
  await engine.startDebate(session.id)
  await executeDebate(session.id)

  console.log('[Debate] Completed')
  console.log(JSON.stringify({ debateId: session.id }, null, 2))
}

main().catch(error => {
  console.error('[Debate] Failed')
  console.error(error)
  process.exit(1)
})
