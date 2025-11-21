import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, debateTurns, factChecks, models, topics, personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { debateId: string } }
) {
  try {
    const { debateId } = params

    // Fetch debate with all related data
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        proPersona: true,
        conPersona: true,
        turns: {
          orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
          with: {
            factChecks: true,
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(debate)
  } catch (error) {
    console.error('Error fetching debate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
