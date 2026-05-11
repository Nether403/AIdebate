/**
 * GET /api/prediction/stats
 * 
 * Get user statistics and betting history
 * 
 * Requirements: 10
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserStats, getBettingHistory } from '@/lib/prediction/market'
import { getOrCreateSessionId } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getOrCreateSessionId()
    
    // TODO: Get user ID from Stack Auth when integrated
    const userId = null
    
    // Get or create user profile (auto-creates if doesn't exist)
    const { getOrCreateUserProfile } = await import('@/lib/prediction/market')
    await getOrCreateUserProfile(sessionId, userId)
    
    const [stats, history] = await Promise.all([
      getUserStats(sessionId),
      getBettingHistory(sessionId, 20),
    ])
    
    if (!stats) {
      // This shouldn't happen after getOrCreateUserProfile, but handle it anyway
      return NextResponse.json({
        success: true,
        stats: {
          debatePoints: 1000,
          totalVotes: 0,
          totalBetsPlaced: 0,
          totalBetsWon: 0,
          correctPredictions: 0,
          accuracy: 0,
          roi: 0,
          isSuperforecaster: false,
          totalPointsWagered: 0,
          totalPointsWon: 0,
          netProfit: 0,
        },
        history: [],
      })
    }
    
    return NextResponse.json({
      success: true,
      stats,
      history,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
