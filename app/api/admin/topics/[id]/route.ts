/**
 * Admin API: Individual Topic Management
 * Endpoints for approving, retiring, and updating specific topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTopicGenerator } from '@/lib/agents/topic-generator';

/**
 * GET /api/admin/topics/[id]
 * Get a specific topic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topic = await db
      .select()
      .from(topics)
      .where(eq(topics.id, id))
      .limit(1);

    if (topic.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ topic: topic[0] });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/topics/[id]
 * Update a topic (approve, retire, or modify)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (action === 'retire') {
      const generator = getTopicGenerator();
      await generator.retireTopic(id, reason || 'Admin action');

      return NextResponse.json({
        success: true,
        message: 'Topic retired successfully',
      });
    }

    if (action === 'activate') {
      await db
        .update(topics)
        .set({ isActive: true })
        .where(eq(topics.id, id));

      return NextResponse.json({
        success: true,
        message: 'Topic activated successfully',
      });
    }

    // Update other fields
    const updateData: any = {};
    if (body.motion) updateData.motion = body.motion;
    if (body.category) updateData.category = body.category;
    if (body.difficulty) updateData.difficulty = body.difficulty;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(topics)
        .set(updateData)
        .where(eq(topics.id, id));

      return NextResponse.json({
        success: true,
        message: 'Topic updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'No valid action or update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/topics/[id]
 * Permanently delete a topic
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(topics).where(eq(topics.id, id));

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
