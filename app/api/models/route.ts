import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { models } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allModels = await db
      .select()
      .from(models)
      .where(eq(models.isActive, true))
      .orderBy(desc(models.crowdRating))

    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
