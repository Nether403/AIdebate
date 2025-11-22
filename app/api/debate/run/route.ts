/**
 * POST /api/debate/run
 * 
 * Initialize and start a new debate between two models.
 * Returns the debate ID and initial state.
 * 
 * Requirements: 1, 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDebateEngine } from '@/lib/debate/engine'
import { validateDebateConfig } from '@/lib/debate/config'
import { validateRequest, debateConfigSchema } from '@/lib/middleware/validation'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { costGuardMiddleware } from '@/lib/middleware/cost-guard'
import { logCost } from '@/lib/security/cost-monitoring'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.debateCreation)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // Validate request body
    const validation = await validateRequest(request, debateConfigSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const configInput = validation.data
    
    // Validate debate configuration
    const configValidation = validateDebateConfig(configInput)
    
    if (!configValidation.valid || !configValidation.data) {
      return NextResponse.json({
        error: 'Invalid debate configuration',
        message: 'The debate configuration is invalid',
        details: configValidation.errors || [],
      }, { status: 400 })
    }
    
    // Check spending cap before creating debate
    const costGuardResponse = await costGuardMiddleware({
      rounds: configValidation.data.totalRounds || 3,
      factCheckingEnabled: configValidation.data.factCheckMode !== 'off',
      judgeModel: 'gemini-3.0-pro', // Default judge model
    })
    
    if (costGuardResponse) {
      return costGuardResponse
    }
    
    // Initialize debate
    const engine = createDebateEngine()
    const session = await engine.initializeDebate(configValidation.data)
    
    // Start the debate
    await engine.startDebate(session.id)
    
    // Return debate information
    return NextResponse.json({
      success: true,
      debate: {
        id: session.id,
        status: 'in_progress',
        topicMotion: session.state.topicMotion,
        proModelId: session.state.proModelId,
        conModelId: session.state.conModelId,
        currentRound: session.state.currentRound,
        totalRounds: session.state.totalRounds,
        startedAt: session.state.startedAt,
      },
      message: 'Debate initialized successfully. Use the streaming endpoint to watch the debate progress.',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating debate:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Debate creation failed',
        message: error.message,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the debate',
    }, { status: 500 })
  }
}

