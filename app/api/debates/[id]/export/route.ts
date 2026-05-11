import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { formatDebateExport } from './format'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debates/[id]/export
 * Export complete debate transcript with all metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params

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
          with: {
            model: true,
            factChecks: true,
          },
          orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
        },
        evaluations: true,
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Format the export data
    const exportData = formatDebateExport(debate)

    // Set headers for file download
    const filename = `debate-${debateId}-${Date.now()}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting debate:', error)
    return NextResponse.json(
      { error: 'Failed to export debate' },
      { status: 500 }
    )
  }
}
