/**
 * Topic Generator Agent
 * Generates balanced debate topics using LLM and validates side-balance
 */

import { getLLMClient } from '@/lib/llm/client';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, lt, and } from 'drizzle-orm';
import type { LLMConfig } from '@/types/llm';
import type { TopicCategory, TopicDifficulty } from '@/types';

export interface GeneratedTopic {
  motion: string;
  category: TopicCategory;
  difficulty: TopicDifficulty;
  balanceScore: number; // 0.0 to 1.0, where 0.5 is perfectly balanced
  reasoning: string;
}

export interface TopicGenerationConfig {
  count: number;
  categories?: TopicCategory[];
  difficulties?: TopicDifficulty[];
  llmConfig?: LLMConfig;
}

export interface BalanceValidationResult {
  isBalanced: boolean;
  proAdvantage: number; // -1.0 to 1.0, negative means con advantage
  reasoning: string;
  confidence: number; // 0.0 to 1.0
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.9, // Higher temperature for creative topic generation
  maxTokens: 2000,
};

const BALANCE_THRESHOLD = 0.6; // Topics must be between 40-60% advantage for either side

export class TopicGeneratorAgent {
  private llmClient = getLLMClient();

  /**
   * Generate new debate topics
   */
  async generateTopics(config: TopicGenerationConfig): Promise<GeneratedTopic[]> {
    const llmConfig = config.llmConfig || DEFAULT_LLM_CONFIG;
    const categories = config.categories || this.getAllCategories();
    const difficulties = config.difficulties || ['easy', 'medium', 'hard'];

    const systemPrompt = this.buildGenerationSystemPrompt();
    const userPrompt = this.buildGenerationUserPrompt(config.count, categories, difficulties);

    try {
      const response = await this.llmClient.generate(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        llmConfig
      );

      const parsedTopics = this.parseGeneratedTopics(response.content);
      
      // Validate balance for each topic
      const validatedTopics: GeneratedTopic[] = [];
      for (const topic of parsedTopics) {
        const validation = await this.validateTopicBalance(topic.motion, llmConfig);
        
        if (validation.isBalanced) {
          validatedTopics.push({
            ...topic,
            balanceScore: Math.abs(validation.proAdvantage),
            reasoning: validation.reasoning,
          });
        }
      }

      return validatedTopics;
    } catch (error) {
      console.error('Error generating topics:', error);
      throw new Error(`Failed to generate topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if a topic is side-balanced
   */
  async validateTopicBalance(
    motion: string,
    llmConfig?: LLMConfig
  ): Promise<BalanceValidationResult> {
    const config = llmConfig || DEFAULT_LLM_CONFIG;
    const systemPrompt = this.buildBalanceValidationSystemPrompt();
    const userPrompt = this.buildBalanceValidationUserPrompt(motion);

    try {
      const response = await this.llmClient.generate(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { ...config, temperature: 0.3 } // Lower temperature for analytical task
      );

      return this.parseBalanceValidation(response.content);
    } catch (error) {
      console.error('Error validating topic balance:', error);
      // Default to unbalanced if validation fails
      return {
        isBalanced: false,
        proAdvantage: 1.0,
        reasoning: 'Failed to validate balance',
        confidence: 0.0,
      };
    }
  }

  /**
   * Store generated topics in database
   */
  async storeTopics(generatedTopics: GeneratedTopic[]): Promise<void> {
    try {
      await db.insert(topics).values(
        generatedTopics.map((topic) => ({
          motion: topic.motion,
          category: topic.category,
          difficulty: topic.difficulty,
          isActive: true,
          usageCount: 0,
        }))
      );
    } catch (error) {
      console.error('Error storing topics:', error);
      throw new Error(`Failed to store topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if topic pool needs replenishment
   */
  async checkPoolStatus(): Promise<{
    needsReplenishment: boolean;
    activeCount: number;
    targetCount: number;
  }> {
    const TARGET_POOL_SIZE = 100;
    const REPLENISHMENT_THRESHOLD = 80;

    const activeTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.isActive, true));

    const activeCount = activeTopics.length;
    const needsReplenishment = activeCount < REPLENISHMENT_THRESHOLD;

    return {
      needsReplenishment,
      activeCount,
      targetCount: TARGET_POOL_SIZE,
    };
  }

  /**
   * Automatically replenish topic pool if needed
   */
  async replenishPoolIfNeeded(): Promise<{
    replenished: boolean;
    topicsAdded: number;
  }> {
    const status = await this.checkPoolStatus();

    if (!status.needsReplenishment) {
      return { replenished: false, topicsAdded: 0 };
    }

    const topicsToGenerate = status.targetCount - status.activeCount;
    const generatedTopics = await this.generateTopics({
      count: topicsToGenerate,
    });

    await this.storeTopics(generatedTopics);

    return {
      replenished: true,
      topicsAdded: generatedTopics.length,
    };
  }

  /**
   * Retire an unbalanced topic
   */
  async retireTopic(topicId: string, reason: string): Promise<void> {
    try {
      await db
        .update(topics)
        .set({ isActive: false })
        .where(eq(topics.id, topicId));

      console.log(`Topic ${topicId} retired: ${reason}`);
    } catch (error) {
      console.error('Error retiring topic:', error);
      throw new Error(`Failed to retire topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get topics that haven't been used recently by a model
   */
  async getAvailableTopicsForModel(
    modelId: string,
    daysSinceLastUse: number = 30
  ): Promise<string[]> {
    // This would require joining with debates table to check usage
    // For now, return all active topics
    const activeTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.isActive, true));

    return activeTopics.map((t) => t.id);
  }

  // Private helper methods

  private buildGenerationSystemPrompt(): string {
    return `You are an expert debate topic generator. Your task is to create balanced, engaging debate motions that:

1. Are side-balanced (neither Pro nor Con has an inherent advantage exceeding 60-40)
2. Are clear and unambiguous
3. Are resolvable through logical argumentation
4. Cover diverse domains and perspectives
5. Are appropriate for LLM evaluation

CRITICAL RULES:
- Avoid topics where one side has overwhelming factual or moral advantage
- Avoid topics that are purely subjective preferences
- Avoid topics that require specialized technical knowledge
- Ensure topics can be argued from both sides with valid reasoning
- Frame topics as clear propositions (e.g., "This house believes that...")

OUTPUT FORMAT:
Return a JSON array of topics with this structure:
[
  {
    "motion": "This house believes that...",
    "category": "technology|ethics|politics|science|education|economics|health|environment|culture|philosophy",
    "difficulty": "easy|medium|hard",
    "rationale": "Brief explanation of why this topic is balanced"
  }
]`;
  }

  private buildGenerationUserPrompt(
    count: number,
    categories: TopicCategory[],
    difficulties: TopicDifficulty[]
  ): string {
    return `Generate ${count} balanced debate topics with the following constraints:

Categories: ${categories.join(', ')}
Difficulty levels: ${difficulties.join(', ')}

Ensure diversity across:
- Subject matter
- Argumentative approaches (empirical, ethical, practical)
- Contemporary relevance
- Difficulty levels

Return ONLY the JSON array, no additional text.`;
  }

  private buildBalanceValidationSystemPrompt(): string {
    return `You are a debate balance validator. Your task is to assess whether a debate motion is side-balanced.

A motion is BALANCED if:
- Neither Pro nor Con has more than 60% inherent advantage
- Both sides can construct valid, evidence-based arguments
- The motion doesn't rely on subjective preferences
- The motion isn't settled by overwhelming consensus

A motion is UNBALANCED if:
- One side has overwhelming factual evidence
- One side has clear moral high ground
- The motion is a false dichotomy
- The motion requires accepting false premises

OUTPUT FORMAT:
Return a JSON object:
{
  "isBalanced": true|false,
  "proAdvantage": -1.0 to 1.0 (negative = con advantage, 0 = perfectly balanced),
  "reasoning": "Explanation of the balance assessment",
  "confidence": 0.0 to 1.0
}`;
  }

  private buildBalanceValidationUserPrompt(motion: string): string {
    return `Assess the balance of this debate motion:

"${motion}"

Consider:
1. What are the strongest arguments for Pro?
2. What are the strongest arguments for Con?
3. Does either side have inherent advantages?
4. Can both sides construct valid arguments?

Return ONLY the JSON object, no additional text.`;
  }

  private parseGeneratedTopics(response: string): Omit<GeneratedTopic, 'balanceScore' | 'reasoning'>[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed.map((item: any) => ({
        motion: item.motion,
        category: item.category as TopicCategory,
        difficulty: item.difficulty as TopicDifficulty,
      }));
    } catch (error) {
      console.error('Error parsing generated topics:', error);
      console.error('Response:', response);
      throw new Error('Failed to parse generated topics');
    }
  }

  private parseBalanceValidation(response: string): BalanceValidationResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const proAdvantage = parsed.proAdvantage || 0;
      const isBalanced = Math.abs(proAdvantage) <= (BALANCE_THRESHOLD - 0.5);

      return {
        isBalanced,
        proAdvantage,
        reasoning: parsed.reasoning || '',
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error('Error parsing balance validation:', error);
      console.error('Response:', response);
      return {
        isBalanced: false,
        proAdvantage: 1.0,
        reasoning: 'Failed to parse validation response',
        confidence: 0.0,
      };
    }
  }

  private getAllCategories(): TopicCategory[] {
    return [
      'technology',
      'ethics',
      'politics',
      'science',
      'education',
      'economics',
      'health',
      'environment',
      'culture',
      'philosophy',
    ];
  }
}

// Singleton instance
let topicGeneratorInstance: TopicGeneratorAgent | null = null;

/**
 * Get the singleton TopicGeneratorAgent instance
 */
export function getTopicGenerator(): TopicGeneratorAgent {
  if (!topicGeneratorInstance) {
    topicGeneratorInstance = new TopicGeneratorAgent();
  }
  return topicGeneratorInstance;
}
