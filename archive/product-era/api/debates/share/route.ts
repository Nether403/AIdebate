import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debates/[id]/share
 * Generate shareable metadata for a debate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params

    // Fetch debate with related data
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        proPersona: true,
        conPersona: true,
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    const totalVotes = debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount

    // Generate share metadata
    const shareData = {
      id: debate.id,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`,
      title: `AI Debate: ${debate.topic.motion}`,
      description: `Watch ${debate.proModel.name} vs ${debate.conModel.name} debate "${debate.topic.motion}". ${totalVotes} votes cast. Winner: ${debate.winner || 'TBD'}`,
      
      // Open Graph metadata
      openGraph: {
        type: 'article',
        title: `AI Debate: ${debate.topic.motion}`,
        description: `${debate.proModel.name} (${debate.proPersona?.name || 'No persona'}) vs ${debate.conModel.name} (${debate.conPersona?.name || 'No persona'})`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`,
        siteName: 'AI Debate Arena',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/debates/${debate.id}/og-image`,
            width: 1200,
            height: 630,
            alt: `Debate: ${debate.topic.motion}`,
          },
        ],
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: `AI Debate: ${debate.topic.motion}`,
        description: `${debate.proModel.name} vs ${debate.conModel.name}. ${totalVotes} votes. Winner: ${debate.winner || 'TBD'}`,
        image: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/debates/${debate.id}/og-image`,
      },

      // Share URLs for different platforms
      shareUrls: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this AI debate: ${debate.topic.motion}`)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`)}&title=${encodeURIComponent(`AI Debate: ${debate.topic.motion}`)}`,
        email: `mailto:?subject=${encodeURIComponent(`AI Debate: ${debate.topic.motion}`)}&body=${encodeURIComponent(`Check out this debate between ${debate.proModel.name} and ${debate.conModel.name}: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/debate/${debate.id}`)}`,
      },

      // Debate summary for preview
      summary: {
        topic: debate.topic.motion,
        category: debate.topic.category,
        participants: `${debate.proModel.name} vs ${debate.conModel.name}`,
        status: debate.status,
        winner: debate.winner,
        votes: totalVotes,
        rounds: debate.totalRounds,
      },
    }

    return NextResponse.json(shareData)
  } catch (error) {
    console.error('Error generating share data:', error)
    return NextResponse.json(
      { error: 'Failed to generate share data' },
      { status: 500 }
    )
  }
}
