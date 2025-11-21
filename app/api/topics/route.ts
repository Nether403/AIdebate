import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { topics } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const allTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.isActive, true))
      .orderBy(asc(topics.category), asc(topics.motion))

    return NextResponse.json(allTopics)
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
