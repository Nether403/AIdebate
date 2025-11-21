/**
 * Admin API: Topic Management
 * Endpoints for reviewing, approving, and retiring topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getTopicGenerator } from '@/lib/agents/topic-generator';

/**
 * GET /api/admin/topics
 * List all topics with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'active', 'inactive', 'all'
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    let query = db.select().from(topics);

    // Apply filters
    const conditions = [];
    if (status === 'active') {
      conditions.push(eq(topics.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(topics.isActive, false));
    }

    // Note: category and difficulty filters would need additional where clauses
    // For simplicity, we'll fetch all and filter in memory for now

    const allTopics = await query.orderBy(desc(topics.createdAt));

    // Filter by category and difficulty if specified
    let filteredTopics = allTopics;
    if (category) {
      filteredTopics = filteredTopics.filter((t) => t.category === category);
    }
    if (difficulty) {
      filteredTopics = filteredTopics.filter((t) => t.difficulty === difficulty);
    }

    return NextResponse.json({
      topics: filteredTopics,
      total: filteredTopics.length,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/topics
 * Generate new topics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 10, categories, difficulties } = body;

    const generator = getTopicGenerator();
    const generatedTopics = await generator.generateTopics({
      count,
      categories,
      difficulties,
    });

    // Store topics in database
    await generator.storeTopics(generatedTopics);

    return NextResponse.json({
      success: true,
      topicsGenerated: generatedTopics.length,
      topics: generatedTopics,
    });
  } catch (error) {
    console.error('Error generating topics:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics' },
      { status: 500 }
    );
  }
}
