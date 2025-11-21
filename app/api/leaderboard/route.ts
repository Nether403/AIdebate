/**
 * GET /api/leaderboard
 * 
 * Retrieve the model leaderboard with sorting and filtering options.
 * Supports pagination and caching for performance.
 * 
 * Requirements: 8, 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { ratingEngine } from '@/lib/rating/engine'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.api)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const sortBy = searchParams.get('sortBy') || 'win_rate'
    const filterControversial = searchParams.get('filterControversial') === 'true'
    const topicCategory = searchParams.get('topicCategory')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Validate sort parameter
    const validSortOptions = ['win_rate', 'crowd_rating', 'ai_quality_rating', 'total_debates', 'controversy_index']
    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json({
        error: 'Invalid sort parameter',
        message: `sortBy must be one of: ${validSortOptions.join(', ')}`,
      }, { status: 400 })
    }
    
    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json({
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 100',
      }, { status: 400 })
    }
    
    if (offset < 0) {
      return NextResponse.json({
        error: 'Invalid offset',
        message: 'Offset must be non-negative',
      }, { status: 400 })
    }
    
    // Get leaderboard from rating engine
    const leaderboard = await ratingEngine.getLeaderboard(
      sortBy as any,
      filterControversial,
      topicCategory || undefined
    )
    
    // Apply pagination
    const total = leaderboard.length
    const paginatedResults = leaderboard.slice(offset, offset + limit)
    
    // Calculate pagination metadata
    const hasMore = offset + limit < total
    const nextOffset = hasMore ? offset + limit : null
    
    return NextResponse.json({
      success: true,
      leaderboard: paginatedResults.map((entry, index) => ({
        rank: offset + index + 1,
        modelId: entry.modelId,
        modelName: entry.modelName,
        provider: entry.provider,
        ratings: {
          crowd: {
            rating: Math.round(entry.crowdRating),
            deviation: Math.round(entry.crowdRatingDeviation),
          },
          aiQuality: {
            rating: Math.round(entry.aiQualityRating),
            deviation: Math.round(entry.aiQualityRatingDeviation),
            volatility: entry.aiQualityVolatility.toFixed(3),
          },
        },
        statistics: {
          totalDebates: entry.totalDebates,
          wins: entry.wins,
          losses: entry.losses,
          ties: entry.ties,
          winRate: (entry.winRate * 100).toFixed(1) + '%',
        },
        controversy: {
          index: Math.round(entry.controversyIndex),
          isControversial: entry.isControversial,
        },
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore,
        nextOffset,
      },
      metadata: {
        sortBy,
        filterControversial,
        generatedAt: new Date().toISOString(),
      },
    })
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Leaderboard fetch failed',
        message: error.message,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching the leaderboard',
    }, { status: 500 })
  }
}

