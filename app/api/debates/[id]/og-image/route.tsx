import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'

/**
 * GET /api/debates/[id]/og-image
 * Generate Open Graph image for debate sharing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params

    // Fetch debate data
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
      },
    })

    if (!debate) {
      return new Response('Debate not found', { status: 404 })
    }

    const totalVotes = debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
            padding: '40px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#60a5fa',
                marginRight: '15px',
              }}
            >
              ⚔️
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#f1f5f9',
              }}
            >
              AI Debate Arena
            </div>
          </div>

          {/* Topic */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#f1f5f9',
              textAlign: 'center',
              marginBottom: '40px',
              maxWidth: '900px',
              lineHeight: 1.2,
            }}
          >
            {debate.topic.motion}
          </div>

          {/* Participants */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '800px',
              marginBottom: '30px',
            }}
          >
            {/* Pro Model */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  color: '#94a3b8',
                  marginBottom: '10px',
                }}
              >
                PRO
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#10b981',
                }}
              >
                {debate.proModel.name}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#64748b',
                }}
              >
                {debate.proModel.provider}
              </div>
            </div>

            {/* VS */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#60a5fa',
                margin: '0 40px',
              }}
            >
              VS
            </div>

            {/* Con Model */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  color: '#94a3b8',
                  marginBottom: '10px',
                }}
              >
                CON
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#ef4444',
                }}
              >
                {debate.conModel.name}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#64748b',
                }}
              >
                {debate.conModel.provider}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#f1f5f9',
                }}
              >
                {totalVotes}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#94a3b8',
                }}
              >
                Votes
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#f1f5f9',
                }}
              >
                {debate.totalRounds}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#94a3b8',
                }}
              >
                Rounds
              </div>
            </div>

            {debate.winner && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: debate.winner === 'pro' ? '#10b981' : debate.winner === 'con' ? '#ef4444' : '#60a5fa',
                  }}
                >
                  {debate.winner.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    color: '#94a3b8',
                  }}
                >
                  Winner
                </div>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div
            style={{
              marginTop: '30px',
              padding: '8px 20px',
              backgroundColor: '#1e293b',
              borderRadius: '20px',
              fontSize: '18px',
              color: '#60a5fa',
            }}
          >
            {debate.topic.category.toUpperCase()}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
