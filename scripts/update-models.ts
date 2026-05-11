/**
 * Update Models Script
 * 
 * Updates the database with the new OpenRouter model IDs
 * Run with: npx tsx scripts/update-models.ts
 */

import 'dotenv/config'
import { db } from '@/lib/db/client'
import { models } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

async function updateModels() {
  console.log('Updating models with correct OpenRouter IDs...')
  
  try {
    // First, deactivate all existing models
    await db.update(models).set({ isActive: false })
    console.log('✓ Deactivated all existing models')
    
    // Insert new models with correct IDs
    const modelsData = [
      // Tier 1: Frontier Models
      {
        name: 'Claude Sonnet 4.5',
        provider: 'openrouter',
        modelId: 'anthropic/claude-sonnet-4.5',
        isActive: true,
      },
      {
        name: 'GPT-5 Pro',
        provider: 'openrouter',
        modelId: 'openai/gpt-5-pro',
        isActive: true,
      },
      {
        name: 'GPT-5.1',
        provider: 'openrouter',
        modelId: 'openai/gpt-5.1',
        isActive: true,
      },
      {
        name: 'Gemini 3.0 Pro',
        provider: 'openrouter',
        modelId: 'google/gemini-3-pro-preview',
        isActive: true,
      },
      {
        name: 'Grok 4.1 Fast',
        provider: 'openrouter',
        modelId: 'x-ai/grok-4.1-fast',
        isActive: true,
      },
      {
        name: 'Grok 4 Fast',
        provider: 'openrouter',
        modelId: 'x-ai/grok-4-fast',
        isActive: true,
      },
      {
        name: 'DeepSeek V3.1 Terminus',
        provider: 'openrouter',
        modelId: 'deepseek/deepseek-v3.1-terminus',
        isActive: true,
      },
      
      // Tier 2: Advanced Models
      {
        name: 'Claude Haiku 4.5',
        provider: 'openrouter',
        modelId: 'anthropic/claude-haiku-4.5',
        isActive: true,
      },
      {
        name: 'GPT-5.1 Chat',
        provider: 'openrouter',
        modelId: 'openai/gpt-5.1-chat',
        isActive: true,
      },
      {
        name: 'GPT-5 Codex',
        provider: 'openrouter',
        modelId: 'openai/gpt-5-codex',
        isActive: true,
      },
      {
        name: 'Gemini 2.5 Flash',
        provider: 'openrouter',
        modelId: 'google/gemini-2.5-flash-preview-09-2025',
        isActive: true,
      },
      {
        name: 'Qwen 3 Max',
        provider: 'openrouter',
        modelId: 'qwen/qwen3-max',
        isActive: true,
      },
      {
        name: 'Qwen 3 Next 80B Thinking',
        provider: 'openrouter',
        modelId: 'qwen/qwen3-next-80b-a3b-thinking',
        isActive: true,
      },
      {
        name: 'Cogito V2.1 671B',
        provider: 'openrouter',
        modelId: 'deepcogito/cogito-v2.1-671b',
        isActive: true,
      },
      {
        name: 'Kimi K2 Thinking',
        provider: 'openrouter',
        modelId: 'moonshotai/kimi-k2-thinking',
        isActive: true,
      },
      
      // Tier 3: Capable Models
      {
        name: 'Qwen 3 Coder Plus',
        provider: 'openrouter',
        modelId: 'qwen/qwen3-coder-plus',
        isActive: true,
      },
      {
        name: 'Qwen 3 Next 80B Instruct',
        provider: 'openrouter',
        modelId: 'qwen/qwen3-next-80b-a3b-instruct',
        isActive: true,
      },
      {
        name: 'MiniMax M2',
        provider: 'openrouter',
        modelId: 'minimax/minimax-m2',
        isActive: true,
      },
      {
        name: 'GLM 4.6',
        provider: 'openrouter',
        modelId: 'z-ai/glm-4.6',
        isActive: true,
      },
      {
        name: 'Tongyi DeepResearch 30B',
        provider: 'openrouter',
        modelId: 'alibaba/tongyi-deepresearch-30b-a3b',
        isActive: true,
      },
      {
        name: 'Llama 3.3 Nemotron Super 49B',
        provider: 'openrouter',
        modelId: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        isActive: true,
      },
    ]

    let insertedCount = 0
    for (const model of modelsData) {
      try {
        await db.insert(models).values(model).onConflictDoNothing()
        insertedCount++
      } catch (error) {
        console.error(`Failed to insert model ${model.name}:`, error)
      }
    }
    
    console.log(`✓ Inserted ${insertedCount} new models`)
    console.log('\nModel update complete!')
    console.log('Refresh your browser to see the updated model list.')
    
  } catch (error) {
    console.error('Error updating models:', error)
    throw error
  }
}

// Run the update
updateModels()
  .then(() => {
    console.log('\n✅ Models updated successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed to update models:', error)
    process.exit(1)
  })
