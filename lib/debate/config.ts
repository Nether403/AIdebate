import { z } from 'zod'
import type { DebateSide, FactCheckMode } from '@/types'

/**
 * Debate Configuration Schema
 * Validates all parameters for initializing a debate
 */
export const DebateConfigSchema = z.object({
  // Model selection
  proModelId: z.string().uuid('Pro model ID must be a valid UUID'),
  conModelId: z.string().uuid('Con model ID must be a valid UUID'),
  
  // Persona assignment (optional)
  proPersonaId: z.string().uuid('Pro persona ID must be a valid UUID').optional().nullable(),
  conPersonaId: z.string().uuid('Con persona ID must be a valid UUID').optional().nullable(),
  
  // Topic selection
  topicId: z.string().uuid('Topic ID must be a valid UUID').optional(),
  topicSelection: z.enum(['random', 'manual']).default('random'),
  
  // Debate parameters
  totalRounds: z.number().int().min(1).max(10).default(3),
  wordLimitPerTurn: z.number().int().min(100).max(1000).default(500),
  
  // Fact-checking configuration
  factCheckMode: z.enum(['standard', 'strict', 'off']).default('standard'),
  
  // Position assignment (optional - will be randomized if not specified)
  forceProModel: z.string().uuid().optional(),
})

export type DebateConfig = z.infer<typeof DebateConfigSchema>

/**
 * Debate Configuration Builder
 * Provides a fluent interface for constructing debate configurations
 */
export class DebateConfigBuilder {
  private config: Partial<DebateConfig> = {
    totalRounds: 3,
    wordLimitPerTurn: 500,
    factCheckMode: 'standard',
    topicSelection: 'random',
  }

  /**
   * Set the models for the debate
   */
  withModels(modelAId: string, modelBId: string): this {
    // Randomly assign pro/con positions to prevent positional bias
    const assignPro = Math.random() < 0.5
    this.config.proModelId = assignPro ? modelAId : modelBId
    this.config.conModelId = assignPro ? modelBId : modelAId
    return this
  }

  /**
   * Force a specific model to the pro position
   */
  withProModel(modelId: string): this {
    this.config.proModelId = modelId
    this.config.forceProModel = modelId
    return this
  }

  /**
   * Force a specific model to the con position
   */
  withConModel(modelId: string): this {
    this.config.conModelId = modelId
    return this
  }

  /**
   * Assign personas to debaters
   */
  withPersonas(proPersonaId: string | null, conPersonaId: string | null): this {
    this.config.proPersonaId = proPersonaId
    this.config.conPersonaId = conPersonaId
    return this
  }

  /**
   * Set a specific topic by ID
   */
  withTopic(topicId: string): this {
    this.config.topicId = topicId
    this.config.topicSelection = 'manual'
    return this
  }

  /**
   * Use random topic selection
   */
  withRandomTopic(): this {
    this.config.topicSelection = 'random'
    this.config.topicId = undefined
    return this
  }

  /**
   * Set the number of debate rounds
   */
  withRounds(rounds: number): this {
    this.config.totalRounds = rounds
    return this
  }

  /**
   * Set the word limit per turn
   */
  withWordLimit(limit: number): this {
    this.config.wordLimitPerTurn = limit
    return this
  }

  /**
   * Set the fact-checking mode
   */
  withFactCheckMode(mode: FactCheckMode): this {
    this.config.factCheckMode = mode
    return this
  }

  /**
   * Build and validate the configuration
   */
  build(): DebateConfig {
    const result = DebateConfigSchema.safeParse(this.config)
    
    if (!result.success) {
      throw new Error(`Invalid debate configuration: ${result.error.message}`)
    }
    
    return result.data
  }

  /**
   * Validate the current configuration without building
   */
  validate(): { valid: boolean; errors?: string[] } {
    const result = DebateConfigSchema.safeParse(this.config)
    
    if (result.success) {
      return { valid: true }
    }
    
    return {
      valid: false,
      errors: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
    }
  }
}

/**
 * Helper function to create a new debate configuration builder
 */
export function createDebateConfig(): DebateConfigBuilder {
  return new DebateConfigBuilder()
}

/**
 * Helper function to validate a debate configuration object
 */
export function validateDebateConfig(config: unknown): {
  valid: boolean
  data?: DebateConfig
  errors?: string[]
} {
  const result = DebateConfigSchema.safeParse(config)
  
  if (result.success) {
    return { valid: true, data: result.data }
  }
  
  return {
    valid: false,
    errors: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
  }
}
