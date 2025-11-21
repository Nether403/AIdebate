/**
 * GET /api/topics/categories
 * 
 * Retrieve all unique topic categories for filtering purposes.
 * 
 * Requirements: 12
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { topics } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.api)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Fetch distinct categories
    const categoriesData = await db
      .selectDistinct({ category: topics.category })
      .from(topics)
      .where(sql`${topics.isActive} = true`)
      .orderBy(topics.category)

    const categories = categoriesData
      .map((row) => row.category)
      .filter((cat): cat is string => cat !== null)

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    })
  } catch (error) {
    console.error('Error fetching topic categories:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
