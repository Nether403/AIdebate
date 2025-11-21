/**
 * Request Validation Middleware
 * 
 * Provides Zod-based validation for API request bodies.
 * Ensures type safety and prevents invalid data from reaching handlers.
 * 
 * Requirements: 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid request data',
            details: error.issues.map((err: z.ZodIssue) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      ),
    }
  }
}

/**
 * Common validation schemas
 */

// Debate configuration schema
export const debateConfigSchema = z.object({
  proModelId: z.string().uuid('Pro model ID must be a valid UUID'),
  conModelId: z.string().uuid('Con model ID must be a valid UUID'),
  topicId: z.string().uuid('Topic ID must be a valid UUID').optional(),
  topicSelection: z.enum(['random', 'manual']).default('random'),
  proPersonaId: z.string().uuid('Pro persona ID must be a valid UUID').optional(),
  conPersonaId: z.string().uuid('Con persona ID must be a valid UUID').optional(),
  totalRounds: z.number().int().min(1).max(5).default(3),
  wordLimitPerTurn: z.number().int().min(100).max(1000).default(500),
  factCheckMode: z.enum(['off', 'standard', 'strict']).default('standard'),
})

// Vote submission schema
export const voteSchema = z.object({
  debateId: z.string().uuid('Debate ID must be a valid UUID'),
  vote: z.enum(['pro', 'con', 'tie']),
  confidence: z.number().int().min(1).max(5).optional(),
  reasoning: z.string().max(500).optional(),
  wagerAmount: z.number().int().min(0).max(500).optional(),
})

// Judge evaluation request schema
export const judgeRequestSchema = z.object({
  debateId: z.string().uuid('Debate ID must be a valid UUID'),
  judgeModel: z.string().optional(),
})

// Leaderboard query schema
export const leaderboardQuerySchema = z.object({
  sortBy: z.enum(['win_rate', 'crowd_rating', 'ai_quality_rating', 'total_debates', 'controversy_index']).default('win_rate'),
  filterControversial: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type DebateConfigInput = z.infer<typeof debateConfigSchema>
export type VoteInput = z.infer<typeof voteSchema>
export type JudgeRequestInput = z.infer<typeof judgeRequestSchema>
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>

