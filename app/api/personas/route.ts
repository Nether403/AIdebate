import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { personas } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  try {
    const allPersonas = await db
      .select()
      .from(personas)
      .where(eq(personas.isActive, true))
      .orderBy(asc(personas.name))

    return NextResponse.json(allPersonas)
  } catch (error) {
    console.error('Error fetching personas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
