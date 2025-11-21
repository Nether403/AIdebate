import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables before importing db client
dotenv.config({ path: resolve(process.cwd(), '.env') })

import { db } from './client'
import { models, topics, personas } from './schema'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Seed models
    console.log('📦 Seeding models...')
    const modelData = [
      // Latest Frontier Models (Late 2025)
      // OpenAI models
      { name: 'GPT-5.1', provider: 'openai', modelId: 'gpt-5.1', isActive: true },
      { name: 'GPT-5.1 Instant', provider: 'openai', modelId: 'gpt-5.1-instant', isActive: true },
      { name: 'GPT-5.1 Thinking', provider: 'openai', modelId: 'gpt-5.1-thinking', isActive: true },
      { name: 'GPT-4o-mini', provider: 'openai', modelId: 'gpt-4o-mini', isActive: true },
      
      // Anthropic models
      { name: 'Claude 4.5 Sonnet', provider: 'anthropic', modelId: 'claude-sonnet-4-5-20250929', isActive: true },
      { name: 'Claude 4.5 Sonnet (Alias)', provider: 'anthropic', modelId: 'claude-4.5-sonnet', isActive: true },
      
      // Google models
      { name: 'Gemini 3.0 Pro', provider: 'google', modelId: 'gemini-3.0-pro', isActive: true },
      { name: 'Gemini 3 Pro (Alias)', provider: 'google', modelId: 'gemini-3-pro', isActive: true },
      { name: 'Gemini 2.5 Flash', provider: 'google', modelId: 'gemini-2.5-flash', isActive: true },
      
      // xAI models
      { name: 'Grok 4.1', provider: 'xai', modelId: 'grok-4.1', isActive: true },
      { name: 'Grok 4.1 Fast', provider: 'xai', modelId: 'grok-4.1-fast', isActive: true },
      
      // Legacy/Baseline models (for comparison)
      { name: 'GPT-4', provider: 'openai', modelId: 'gpt-4', isActive: false },
      { name: 'GPT-4o', provider: 'openai', modelId: 'gpt-4o', isActive: false },
      { name: 'Claude 3.5 Sonnet', provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', isActive: false },
      { name: 'Gemini 1.5 Pro', provider: 'google', modelId: 'gemini-1.5-pro', isActive: false },
      { name: 'Grok Beta', provider: 'xai', modelId: 'grok-beta', isActive: false },
    ]

    await db.insert(models).values(modelData)
    console.log(`✅ Seeded ${modelData.length} models`)

    // Seed personas
    console.log('🎭 Seeding personas...')
    const personaData = [
      {
        name: 'Socratic Philosopher',
        description: 'Questions assumptions and seeks truth through dialectic',
        systemPrompt: 'You are a Socratic philosopher who questions assumptions, seeks clarity through probing questions, and values logical consistency above all. Your arguments are built on careful reasoning and you expose contradictions in opposing views.',
      },
      {
        name: 'Pragmatic Engineer',
        description: 'Focuses on practical solutions and real-world implementation',
        systemPrompt: 'You are a pragmatic engineer who values practical solutions, real-world constraints, and measurable outcomes. You focus on what works in practice rather than theoretical ideals.',
      },
      {
        name: 'Ethical Consequentialist',
        description: 'Evaluates actions based on their outcomes and consequences',
        systemPrompt: 'You are an ethical consequentialist who judges the morality of actions by their outcomes. You focus on maximizing overall well-being and minimizing harm, using data and evidence to support your positions.',
      },
      {
        name: 'Historical Scholar',
        description: 'Draws on historical precedents and patterns',
        systemPrompt: 'You are a historical scholar who draws on past events, patterns, and precedents to inform present debates. You believe history provides crucial lessons and context for understanding current issues.',
      },
      {
        name: 'Scientific Skeptic',
        description: 'Demands empirical evidence and rigorous methodology',
        systemPrompt: 'You are a scientific skeptic who demands empirical evidence, rigorous methodology, and reproducible results. You question claims that lack scientific backing and value peer-reviewed research.',
      },
      {
        name: 'Libertarian Advocate',
        description: 'Champions individual freedom and minimal government intervention',
        systemPrompt: 'You are a libertarian advocate who champions individual freedom, voluntary cooperation, and minimal government intervention. You believe in personal responsibility and free markets.',
      },
      {
        name: 'Social Justice Activist',
        description: 'Focuses on equity, systemic issues, and marginalized voices',
        systemPrompt: 'You are a social justice activist who focuses on equity, systemic oppression, and amplifying marginalized voices. You analyze power structures and advocate for transformative change.',
      },
      {
        name: 'Economic Rationalist',
        description: 'Applies economic principles and cost-benefit analysis',
        systemPrompt: 'You are an economic rationalist who applies economic principles, cost-benefit analysis, and market dynamics to debates. You focus on incentives, efficiency, and resource allocation.',
      },
      {
        name: 'Futurist Visionary',
        description: 'Focuses on long-term trends and emerging technologies',
        systemPrompt: 'You are a futurist visionary who focuses on long-term trends, emerging technologies, and transformative possibilities. You think in terms of decades and paradigm shifts.',
      },
      {
        name: 'Constitutional Originalist',
        description: 'Interprets principles based on original intent and foundational documents',
        systemPrompt: 'You are a constitutional originalist who interprets principles based on original intent, foundational documents, and established precedent. You value stability and consistency in interpretation.',
      },
    ]

    await db.insert(personas).values(personaData)
    console.log(`✅ Seeded ${personaData.length} personas`)

    // Seed topics
    console.log('💬 Seeding topics...')
    const topicData = [
      // Technology topics
      { motion: 'AI systems should be open-source by default', category: 'technology', difficulty: 'medium' },
      { motion: 'Social media platforms should be regulated as public utilities', category: 'technology', difficulty: 'hard' },
      { motion: 'Cryptocurrency will replace traditional banking within 20 years', category: 'technology', difficulty: 'medium' },
      { motion: 'Autonomous vehicles should be prioritized over public transportation', category: 'technology', difficulty: 'medium' },
      { motion: 'Genetic engineering of humans should be permitted for enhancement', category: 'technology', difficulty: 'hard' },
      { motion: 'Quantum computing will solve climate change', category: 'technology', difficulty: 'hard' },
      { motion: 'Brain-computer interfaces should be available to the general public', category: 'technology', difficulty: 'medium' },
      { motion: 'The metaverse will replace physical workplaces', category: 'technology', difficulty: 'easy' },
      { motion: 'Facial recognition technology should be banned in public spaces', category: 'technology', difficulty: 'medium' },
      { motion: 'Nuclear fusion will solve the energy crisis within 30 years', category: 'technology', difficulty: 'hard' },

      // Ethics topics
      { motion: 'Universal Basic Income is necessary in an AI-driven economy', category: 'ethics', difficulty: 'hard' },
      { motion: 'Animals should have legal personhood rights', category: 'ethics', difficulty: 'medium' },
      { motion: 'Euthanasia should be a fundamental human right', category: 'ethics', difficulty: 'hard' },
      { motion: 'Billionaires should not exist', category: 'ethics', difficulty: 'medium' },
      { motion: 'Eating meat is morally indefensible', category: 'ethics', difficulty: 'medium' },
      { motion: 'Parents should be licensed before having children', category: 'ethics', difficulty: 'hard' },
      { motion: 'Lying is sometimes morally required', category: 'ethics', difficulty: 'medium' },
      { motion: 'Future generations have rights that we must respect', category: 'ethics', difficulty: 'hard' },
      { motion: 'Artificial general intelligence deserves moral consideration', category: 'ethics', difficulty: 'hard' },
      { motion: 'Whistleblowing is always morally justified', category: 'ethics', difficulty: 'medium' },

      // Politics topics
      { motion: 'Democracy is the best form of government', category: 'politics', difficulty: 'hard' },
      { motion: 'Voting should be mandatory', category: 'politics', difficulty: 'easy' },
      { motion: 'Term limits should apply to all elected officials', category: 'politics', difficulty: 'medium' },
      { motion: 'The United Nations should have enforcement powers', category: 'politics', difficulty: 'hard' },
      { motion: 'Political parties do more harm than good', category: 'politics', difficulty: 'medium' },
      { motion: 'Lobbying should be illegal', category: 'politics', difficulty: 'medium' },
      { motion: 'Direct democracy through technology is now feasible', category: 'politics', difficulty: 'hard' },
      { motion: 'National borders will become obsolete', category: 'politics', difficulty: 'hard' },
      { motion: 'Capitalism is incompatible with democracy', category: 'politics', difficulty: 'hard' },
      { motion: 'Surveillance is necessary for national security', category: 'politics', difficulty: 'medium' },

      // Science topics
      { motion: 'Space colonization should be a priority over Earth problems', category: 'science', difficulty: 'medium' },
      { motion: 'The scientific method is the only path to truth', category: 'science', difficulty: 'hard' },
      { motion: 'Climate change requires geoengineering solutions', category: 'science', difficulty: 'hard' },
      { motion: 'Consciousness can be explained by neuroscience alone', category: 'science', difficulty: 'hard' },
      { motion: 'The universe is a simulation', category: 'science', difficulty: 'hard' },
      { motion: 'Time travel is theoretically possible', category: 'science', difficulty: 'medium' },
      { motion: 'Artificial life will be created within 50 years', category: 'science', difficulty: 'medium' },
      { motion: 'The placebo effect proves mind-body dualism', category: 'science', difficulty: 'hard' },
      { motion: 'We should attempt to contact extraterrestrial intelligence', category: 'science', difficulty: 'medium' },
      { motion: 'Evolution is still actively shaping human biology', category: 'science', difficulty: 'medium' },

      // Education topics
      { motion: 'Traditional universities will become obsolete', category: 'education', difficulty: 'medium' },
      { motion: 'Standardized testing should be abolished', category: 'education', difficulty: 'medium' },
      { motion: 'Education should be completely free at all levels', category: 'education', difficulty: 'medium' },
      { motion: 'AI tutors will replace human teachers', category: 'education', difficulty: 'easy' },
      { motion: 'Students should choose their own curriculum', category: 'education', difficulty: 'medium' },
      { motion: 'Grades do more harm than good', category: 'education', difficulty: 'medium' },
      { motion: 'Philosophy should be mandatory in schools', category: 'education', difficulty: 'easy' },
      { motion: 'Homework should be banned', category: 'education', difficulty: 'easy' },
      { motion: 'Trade schools are more valuable than universities', category: 'education', difficulty: 'medium' },
      { motion: 'Learning should be gamified', category: 'education', difficulty: 'easy' },

      // Economics topics
      { motion: 'A four-day work week should be standard', category: 'economics', difficulty: 'easy' },
      { motion: 'Automation will create more jobs than it destroys', category: 'economics', difficulty: 'medium' },
      { motion: 'Wealth taxes are necessary for economic stability', category: 'economics', difficulty: 'hard' },
      { motion: 'Free markets always produce optimal outcomes', category: 'economics', difficulty: 'hard' },
      { motion: 'Minimum wage laws help workers', category: 'economics', difficulty: 'medium' },
      { motion: 'Intellectual property stifles innovation', category: 'economics', difficulty: 'hard' },
      { motion: 'Economic growth is incompatible with environmental sustainability', category: 'economics', difficulty: 'hard' },
      { motion: 'Central banks should be abolished', category: 'economics', difficulty: 'hard' },
      { motion: 'Globalization benefits everyone', category: 'economics', difficulty: 'medium' },
      { motion: 'Advertising is economically wasteful', category: 'economics', difficulty: 'medium' },

      // Health topics
      { motion: 'Healthcare is a human right', category: 'health', difficulty: 'medium' },
      { motion: 'Vaccination should be mandatory', category: 'health', difficulty: 'hard' },
      { motion: 'Mental health is as important as physical health', category: 'health', difficulty: 'easy' },
      { motion: 'Pharmaceutical patents should be abolished', category: 'health', difficulty: 'hard' },
      { motion: 'Alternative medicine should be covered by insurance', category: 'health', difficulty: 'medium' },
      { motion: 'Organ donation should be opt-out by default', category: 'health', difficulty: 'medium' },
      { motion: 'Sugar should be regulated like tobacco', category: 'health', difficulty: 'medium' },
      { motion: 'Genetic testing should be mandatory at birth', category: 'health', difficulty: 'hard' },
      { motion: 'Telemedicine will replace in-person doctors', category: 'health', difficulty: 'easy' },
      { motion: 'Exercise should be prescribed like medication', category: 'health', difficulty: 'easy' },

      // Environment topics
      { motion: 'Individual action cannot solve climate change', category: 'environment', difficulty: 'medium' },
      { motion: 'Nuclear energy is essential for fighting climate change', category: 'environment', difficulty: 'medium' },
      { motion: 'Degrowth is necessary for environmental sustainability', category: 'environment', difficulty: 'hard' },
      { motion: 'Carbon taxes are the best solution to emissions', category: 'environment', difficulty: 'medium' },
      { motion: 'Plastic should be banned entirely', category: 'environment', difficulty: 'easy' },
      { motion: 'Rewilding should take priority over agriculture', category: 'environment', difficulty: 'hard' },
      { motion: 'Lab-grown meat will save the planet', category: 'environment', difficulty: 'medium' },
      { motion: 'Climate change is an existential threat', category: 'environment', difficulty: 'medium' },
      { motion: 'Overpopulation is the root cause of environmental problems', category: 'environment', difficulty: 'hard' },
      { motion: 'Renewable energy can fully replace fossil fuels', category: 'environment', difficulty: 'medium' },

      // Culture topics
      { motion: 'Cancel culture is a form of accountability', category: 'culture', difficulty: 'hard' },
      { motion: 'Art created by AI has no value', category: 'culture', difficulty: 'medium' },
      { motion: 'Cultural appropriation is always harmful', category: 'culture', difficulty: 'hard' },
      { motion: 'Social media has destroyed civil discourse', category: 'culture', difficulty: 'medium' },
      { motion: 'Trigger warnings are necessary', category: 'culture', difficulty: 'medium' },
      { motion: 'Meritocracy is a myth', category: 'culture', difficulty: 'hard' },
      { motion: 'Traditional family structures are obsolete', category: 'culture', difficulty: 'hard' },
      { motion: 'Religion is incompatible with modern society', category: 'culture', difficulty: 'hard' },
      { motion: 'Nostalgia is harmful to progress', category: 'culture', difficulty: 'medium' },
      { motion: 'Influencer culture is toxic', category: 'culture', difficulty: 'easy' },

      // Philosophy topics
      { motion: 'Free will is an illusion', category: 'philosophy', difficulty: 'hard' },
      { motion: 'Objective morality exists', category: 'philosophy', difficulty: 'hard' },
      { motion: 'The meaning of life is subjective', category: 'philosophy', difficulty: 'hard' },
      { motion: 'Suffering is necessary for growth', category: 'philosophy', difficulty: 'medium' },
      { motion: 'Truth is relative', category: 'philosophy', difficulty: 'hard' },
      { motion: 'Humans are fundamentally good', category: 'philosophy', difficulty: 'medium' },
      { motion: 'Death gives life meaning', category: 'philosophy', difficulty: 'hard' },
      { motion: 'Knowledge requires certainty', category: 'philosophy', difficulty: 'hard' },
      { motion: 'The ends justify the means', category: 'philosophy', difficulty: 'medium' },
      { motion: 'Happiness is the ultimate goal', category: 'philosophy', difficulty: 'medium' },
    ]

    await db.insert(topics).values(topicData)
    console.log(`✅ Seeded ${topicData.length} topics`)

    console.log('✨ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('👋 Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
