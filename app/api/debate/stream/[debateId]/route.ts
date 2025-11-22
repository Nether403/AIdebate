/**
 * GET /api/debate/stream/[debateId]
 * 
 * Stream debate progress using Server-Sent Events (SSE).
 * Provides real-time updates for each turn including RCR phases.
 * 
 * Requirements: 1, 11
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, debateTurns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events encoder
 */
function createSSEEncoder() {
  return new TextEncoder()
}

/**
 * Format SSE message
 */
function formatSSEMessage(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ debateId: string }> }
) {
  const { debateId } = await params
  
  // Verify debate exists
  const debate = await db.query.debates.findFirst({
    where: eq(debates.id, debateId),
    with: {
      topic: true,
      proModel: true,
      conModel: true,
    },
  })
  
  if (!debate) {
    return new Response(
      JSON.stringify({
        error: 'Debate not found',
        message: `No debate found with ID ${debateId}`,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  
  // Create SSE stream
  const encoder = createSSEEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial debate info
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('debate-start', {
              debateId: debate.id,
              topic: debate.topic.motion,
              proModel: {
                id: debate.proModel.id,
                name: 'Model A', // Anonymous until voting
              },
              conModel: {
                id: debate.conModel.id,
                name: 'Model B', // Anonymous until voting
              },
              totalRounds: debate.totalRounds,
              status: debate.status,
            })
          )
        )
        
        // Poll for new turns
        let lastTurnCount = 0
        let isComplete = debate.status === 'completed' || debate.status === 'failed'
        
        while (!isComplete) {
          // Get current turns
          const turns = await db.query.debateTurns.findMany({
            where: eq(debateTurns.debateId, debateId),
            orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
          })
          
          // Send new turns
          if (turns.length > lastTurnCount) {
            for (let i = lastTurnCount; i < turns.length; i++) {
              const turn = turns[i]
              
              // Send RCR phases if available
              if (turn.reflection) {
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('turn-reflection', {
                      turnId: turn.id,
                      roundNumber: turn.roundNumber,
                      side: turn.side,
                      reflection: turn.reflection,
                    })
                  )
                )
              }
              
              if (turn.critique) {
                controller.enqueue(
                  encoder.encode(
                    formatSSEMessage('turn-critique', {
                      turnId: turn.id,
                      roundNumber: turn.roundNumber,
                      side: turn.side,
                      critique: turn.critique,
                    })
                  )
                )
              }
              
              // Send final speech
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('turn-speech', {
                    turnId: turn.id,
                    roundNumber: turn.roundNumber,
                    side: turn.side,
                    speech: turn.speech,
                    wordCount: turn.wordCount,
                    factChecksPassed: turn.factChecksPassed,
                    factChecksFailed: turn.factChecksFailed,
                    wasRejected: turn.wasRejected,
                  })
                )
              )
            }
            
            lastTurnCount = turns.length
          }
          
          // Check if debate is complete
          const updatedDebate = await db.query.debates.findFirst({
            where: eq(debates.id, debateId),
          })
          
          if (updatedDebate) {
            isComplete = updatedDebate.status === 'completed' || updatedDebate.status === 'failed'
            
            if (isComplete) {
              controller.enqueue(
                encoder.encode(
                  formatSSEMessage('debate-complete', {
                    debateId: debate.id,
                    status: updatedDebate.status,
                    winner: updatedDebate.winner,
                    completedAt: updatedDebate.completedAt,
                  })
                )
              )
            }
          }
          
          // Wait before next poll (1 second)
          if (!isComplete) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        // Close the stream
        controller.close()
        
      } catch (error) {
        console.error('Error in debate stream:', error)
        controller.enqueue(
          encoder.encode(
            formatSSEMessage('error', {
              message: 'An error occurred while streaming the debate',
            })
          )
        )
        controller.close()
      }
    },
    
    cancel() {
      console.log('Stream cancelled by client')
    },
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

