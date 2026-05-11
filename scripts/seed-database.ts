/**
 * Database Seeding Script
 * 
 * Seeds the database with initial models, topics, and personas
 * Run with: npx tsx scripts/seed-database.ts
 */

import 'dotenv/config'
import { db } from '@/lib/db/client'
import { models, topics, personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function seedModels() {
  console.log('Seeding models...')
  
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

  for (const model of modelsData) {
    await db.insert(models).values(model).onConflictDoNothing()
  }
  
  console.log(`✓ Seeded ${modelsData.length} models`)
}

async function seedTopics() {
  console.log('Seeding topics...')
  
  const topicsData = [
    {
      motion: 'AI systems should be granted legal personhood',
      category: 'technology',
      difficulty: 'hard',
      isActive: true,
    },
    {
      motion: 'Social media does more harm than good for society',
      category: 'technology',
      difficulty: 'medium',
      isActive: true,
    },
    {
      motion: 'Universal Basic Income should be implemented globally',
      category: 'economics',
      difficulty: 'hard',
      isActive: true,
    },
    {
      motion: 'Space exploration is a waste of resources',
      category: 'science',
      difficulty: 'medium',
      isActive: true,
    },
    {
      motion: 'Remote work is better than office work',
      category: 'society',
      difficulty: 'easy',
      isActive: true,
    },
    {
      motion: 'Genetic engineering of humans should be allowed',
      category: 'ethics',
      difficulty: 'hard',
      isActive: true,
    },
    {
      motion: 'Nuclear energy is the best solution to climate change',
      category: 'environment',
      difficulty: 'medium',
      isActive: true,
    },
    {
      motion: 'Cryptocurrency will replace traditional currency',
      category: 'economics',
      difficulty: 'medium',
      isActive: true,
    },
    {
      motion: 'Artificial meat is the future of food',
      category: 'science',
      difficulty: 'easy',
      isActive: true,
    },
    {
      motion: 'Privacy is more important than security',
      category: 'ethics',
      difficulty: 'hard',
      isActive: true,
    },
  ]

  for (const topic of topicsData) {
    await db.insert(topics).values(topic).onConflictDoNothing()
  }
  
  console.log(`✓ Seeded ${topicsData.length} topics`)
}

async function seedPersonas() {
  console.log('Seeding personas...')
  
  const personasData = [
    {
      name: 'The Pragmatist',
      description: 'Focuses on practical implications and real-world outcomes',
      systemPrompt: 'You are a pragmatic debater who focuses on practical implications, real-world outcomes, and feasibility. You prioritize evidence-based arguments and concrete examples over abstract theory.',
      isActive: true,
    },
    {
      name: 'The Idealist',
      description: 'Emphasizes principles, values, and long-term vision',
      systemPrompt: 'You are an idealistic debater who emphasizes principles, values, and long-term vision. You argue from first principles and focus on what should be rather than what is.',
      isActive: true,
    },
    {
      name: 'The Skeptic',
      description: 'Questions assumptions and demands rigorous evidence',
      systemPrompt: 'You are a skeptical debater who questions assumptions, demands rigorous evidence, and points out logical fallacies. You are cautious about claims and prefer proven solutions.',
      isActive: true,
    },
    {
      name: 'The Optimist',
      description: 'Highlights opportunities and positive potential',
      systemPrompt: 'You are an optimistic debater who highlights opportunities, positive potential, and innovative solutions. You focus on what could go right and how challenges can be overcome.',
      isActive: true,
    },
    {
      name: 'The Economist',
      description: 'Analyzes cost-benefit and economic implications',
      systemPrompt: 'You are an economist debater who analyzes cost-benefit ratios, economic implications, and market dynamics. You frame arguments in terms of efficiency, incentives, and resource allocation.',
      isActive: true,
    },
  ]

  for (const persona of personasData) {
    await db.insert(personas).values(persona).onConflictDoNothing()
  }
  
  console.log(`✓ Seeded ${personasData.length} personas`)
}

async function main() {
  try {
    console.log('Starting database seeding...\n')
    
    await seedModels()
    await seedTopics()
    await seedPersonas()
    
    console.log('\n✓ Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

main()
