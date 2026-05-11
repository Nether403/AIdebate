import 'dotenv/config'
import { db } from '@/lib/db/client'
import { models } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('Fixing Gemini model name...')
  
  // Update all models with gemini-3.0-pro-preview to gemini-3-pro-preview
  const result = await db.update(models)
    .set({ 
      modelId: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro Preview'
    })
    .where(eq(models.modelId, 'gemini-3.0-pro-preview'))
  
  console.log('✓ Updated Gemini model to gemini-3-pro-preview')
  process.exit(0)
}

main()
