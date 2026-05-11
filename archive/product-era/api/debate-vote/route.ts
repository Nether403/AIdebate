/**
 * POST /api/debate/vote
 * 
 * Submit a vote for a completed debate.
 * Supports both anonymous (session-based) and authenticated voting.
 * Prevents duplicate votes from the same session.
 * 
 * Requirements: 7, 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, userVotes, models, userProfiles } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { getOrCreateSessionId } from '@/lib/auth/session'
import { validateRequest, voteSchema } from '@/lib/middleware/validation'
import { rateLimitMiddleware, RATE_LIMITS, getClientIp } from '@/lib/middleware/rate-limit'
import { placeBet, getCurrentOdds, getOrCreateUserProfile } from '@/lib/prediction/market'
import { generateFingerprint, isSuspiciousFingerprint } from '@/lib/security/fingerprint'
import { isSessionFlagged } from '@/lib/security/abuse-detection'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.voting)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // Generate session fingerprint
    const fingerprint = generateFingerprint(request)
    const fingerprintCheck = isSuspiciousFingerprint(fingerprint)
    
    if (fingerprintCheck.suspicious) {
      console.warn('Suspicious fingerprint detected:', {
        sessionId: await getOrCreateSessionId(),
        reasons: fingerprintCheck.reasons,
      })
    }
    
    // Validate request body
    const validation = await validateRequest(request, voteSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const { debateId, vote, confidence, reasoning, wagerAmount } = validation.data
    
    // Get session ID
    const sessionId = await getOrCreateSessionId()
    
    // Check if session is flagged
    const isFlagged = await isSessionFlagged(sessionId)
    if (isFlagged) {
      return NextResponse.json({
        error: 'Session flagged',
        message: 'This session has been flagged for suspicious activity. Please contact support.',
      }, { status: 403 })
    }
    
    // TODO: Get user ID from Stack Auth when integrated
    const userId = null
    
    // Get client IP for abuse prevention
    const ipAddress = getClientIp(request)
    
    // Get or create user profile
    const userProfile = await getOrCreateUserProfile(sessionId, userId)
    
    // Check if debate exists and is completed
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        proModel: true,
        conModel: true,
      },
    })
    
    if (!debate) {
      return NextResponse.json({
        error: 'Debate not found',
        message: `No debate found with ID ${debateId}`,
      }, { status: 404 })
    }
    
    if (debate.status !== 'completed') {
      return NextResponse.json({
        error: 'Debate not completed',
        message: 'You can only vote on completed debates',
      }, { status: 400 })
    }
    
    // Check for duplicate vote from this session
    const existingVote = await db.query.userVotes.findFirst({
      where: and(
        eq(userVotes.debateId, debateId),
        eq(userVotes.sessionId, sessionId)
      ),
    })
    
    if (existingVote) {
      return NextResponse.json({
        error: 'Duplicate vote',
        message: 'You have already voted on this debate',
        existingVote: {
          vote: existingVote.vote,
          createdAt: existingVote.createdAt,
        },
      }, { status: 409 })
    }
    
    // Handle betting if wager amount provided
    let betResult = null
    let oddsAtBet = null
    
    if (wagerAmount && wagerAmount > 0) {
      betResult = await placeBet(debateId, sessionId, vote, wagerAmount, userId)
      
      if (!betResult.success) {
        return NextResponse.json({
          error: 'Bet failed',
          message: betResult.message,
          currentBalance: betResult.newBalance,
        }, { status: 400 })
      }
      
      oddsAtBet = vote === 'pro' ? betResult.odds.pro : vote === 'con' ? betResult.odds.con : betResult.odds.tie
    }
    
    // Get current odds for display
    const currentOdds = await getCurrentOdds(debateId)
    
    // Insert vote
    const [newVote] = await db.insert(userVotes).values({
      debateId,
      userId,
      sessionId,
      vote,
      confidence,
      reasoning,
      wagerAmount: wagerAmount || 0,
      oddsAtBet,
      ipAddress,
    }).returning()
    
    // Update user profile vote count
    await db.update(userProfiles)
      .set({
        totalVotes: sql`${userProfiles.totalVotes} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userProfile.id))
    
    // Update debate vote counts
    if (vote === 'pro') {
      await db.update(debates)
        .set({ crowdVotesProCount: sql`${debates.crowdVotesProCount} + 1` })
        .where(eq(debates.id, debateId))
    } else if (vote === 'con') {
      await db.update(debates)
        .set({ crowdVotesConCount: sql`${debates.crowdVotesConCount} + 1` })
        .where(eq(debates.id, debateId))
    } else {
      await db.update(debates)
        .set({ crowdVotesTieCount: sql`${debates.crowdVotesTieCount} + 1` })
        .where(eq(debates.id, debateId))
    }
    
    // Determine crowd winner based on vote counts
    const updatedDebate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
    })
    
    if (updatedDebate) {
      const totalVotes = updatedDebate.crowdVotesProCount + 
                        updatedDebate.crowdVotesConCount + 
                        updatedDebate.crowdVotesTieCount
      
      let crowdWinner: string | null = null
      
      if (totalVotes >= 10) { // Minimum votes threshold
        if (updatedDebate.crowdVotesProCount > updatedDebate.crowdVotesConCount && 
            updatedDebate.crowdVotesProCount > updatedDebate.crowdVotesTieCount) {
          crowdWinner = 'pro'
        } else if (updatedDebate.crowdVotesConCount > updatedDebate.crowdVotesProCount && 
                   updatedDebate.crowdVotesConCount > updatedDebate.crowdVotesTieCount) {
          crowdWinner = 'con'
        } else {
          crowdWinner = 'tie'
        }
        
        await db.update(debates)
          .set({ crowdWinner })
          .where(eq(debates.id, debateId))
      }
    }
    
    // Return success with model identities revealed
    return NextResponse.json({
      success: true,
      vote: {
        id: newVote.id,
        vote: newVote.vote,
        wagerAmount: newVote.wagerAmount,
        oddsAtBet: newVote.oddsAtBet,
        createdAt: newVote.createdAt,
      },
      modelIdentities: {
        pro: {
          id: debate.proModel.id,
          name: debate.proModel.name,
          provider: debate.proModel.provider,
        },
        con: {
          id: debate.conModel.id,
          name: debate.conModel.name,
          provider: debate.conModel.provider,
        },
      },
      voteCount: {
        pro: updatedDebate?.crowdVotesProCount || 0,
        con: updatedDebate?.crowdVotesConCount || 0,
        tie: updatedDebate?.crowdVotesTieCount || 0,
      },
      currentOdds,
      userBalance: betResult?.newBalance || userProfile.debatePoints,
      message: betResult ? betResult.message : 'Vote recorded successfully',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error recording vote:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Vote submission failed',
        message: error.message,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while recording your vote',
    }, { status: 500 })
  }
}

