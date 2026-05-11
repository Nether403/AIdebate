import { z } from 'zod'

export const benchmarkDebateConfigSchema = z.object({
  proModelId: z.string().uuid('proModelId must be a UUID'),
  conModelId: z.string().uuid('conModelId must be a UUID'),
  topicId: z.string().uuid('topicId must be a UUID').optional(),
  topicSelection: z.enum(['random', 'manual']).default('random'),
  proPersonaId: z.string().uuid('proPersonaId must be a UUID').nullable().optional(),
  conPersonaId: z.string().uuid('conPersonaId must be a UUID').nullable().optional(),
  totalRounds: z.number().int().min(1).max(5).default(1),
  wordLimitPerTurn: z.number().int().min(100).max(1000).default(500),
  factCheckMode: z.enum(['off', 'standard', 'strict']).default('standard'),
})

export const benchmarkRunConfigSchema = z.object({
  name: z.string().min(1).default('benchmark-run'),
  description: z.string().optional(),
  debates: z.array(benchmarkDebateConfigSchema).min(1),
})

export type BenchmarkDebateConfig = z.infer<typeof benchmarkDebateConfigSchema>
export type BenchmarkRunConfig = z.infer<typeof benchmarkRunConfigSchema>

export function parseBenchmarkRunConfig(input: unknown): BenchmarkRunConfig {
  const result = benchmarkRunConfigSchema.safeParse(input)

  if (!result.success) {
    throw new Error(`Invalid benchmark config: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`)
  }

  return result.data
}
