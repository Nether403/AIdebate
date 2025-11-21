/**
 * GET /api/prediction/odds?debateId=xxx
 * 
 * Get current betting odds for a debate
 * 
 * Requirements: 10
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentOdds, getBetPool } from '@/lib/prediction/market'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const debateId = searchParams.get('debateId')
    
    if (!debateId) {
      return NextResponse.json({
        error: 'Missing parameter',
        message: 'debateId is required',
      }, { status: 400 })
    }
    
    const [odds, pool] = await Promise.all([
      getCurrentOdds(debateId),
      getBetPool(debateId),
    ])
    
    return NextResponse.json({
      success: true,
      debateId,
      odds,
      pool,
    })
  } catch (error) {
    console.error('Error fetching odds:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch odds',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
