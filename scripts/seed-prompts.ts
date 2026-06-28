import 'dotenv/config'
import { seedPromptTemplates } from '@/lib/prompts/registry'

/**
 * Register the prompt template registry into the prompt_templates table.
 * Idempotent: existing (templateId, version) rows are left untouched.
 *
 * Usage: npm run prompts:seed
 */
async function main() {
  const count = await seedPromptTemplates()
  console.log(`[Prompts] Registered ${count} prompt templates (existing versions left untouched)`)
  process.exit(0)
}

main().catch(error => {
  console.error('[Prompts] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
