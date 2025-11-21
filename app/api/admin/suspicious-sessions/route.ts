/**
 * GET /api/admin/suspicious-sessions
 * POST /api/admin/suspicious-sessions (flag a session)
 * 
 * Manage suspicious voting patterns and flagged sessions
 * 
 * Requirements: 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSuspiciousSessions, flagSession, analyzeVotingPattern } from '@/lib/security/abuse-detection'
import { z } from 'zod'

const flagSessionSchema = z.object({
  sessionId: z.string(),
  reason: z.string().min(10),
  flaggedBy: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await stackServerApp.getUser()
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '50')
    const sessionId = searchParams.get('sessionId')
    
    // If specific session requested, analyze just that one
    if (sessionId) {
      const pattern = await analyzeVotingPattern(sessionId)
      return NextResponse.json({ pattern })
    }
    
    // Otherwise get all suspicious sessions
    const suspiciousSessions = await getSuspiciousSessions(threshold)
    
    return NextResponse.json({
      sessions: suspiciousSessions,
      count: suspiciousSessions.length,
      threshold,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching suspicious sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suspicious sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await stackServerApp.getUser()
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const body = await request.json()
    const validation = flagSessionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { sessionId, reason, flaggedBy } = validation.data
    
    await flagSession(sessionId, reason, flaggedBy)
    
    return NextResponse.json({
      success: true,
      message: `Session ${sessionId} has been flagged`,
      sessionId,
      reason,
      flaggedBy,
      flaggedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error flagging session:', error)
    return NextResponse.json(
      { error: 'Failed to flag session' },
      { status: 500 }
    )
  }
}
