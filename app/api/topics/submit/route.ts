/**
 * Public API: User Topic Submission
 * Allows users to submit topic suggestions for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getTopicGenerator } from '@/lib/agents/topic-generator';

// We'll need a submissions table for this, but for now we'll validate and store directly
// In production, you'd want a separate pending_topics table

/**
 * POST /api/topics/submit
 * Submit a topic suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motion, category, difficulty, submittedBy } = body;

    // Validate required fields
    if (!motion || typeof motion !== 'string') {
      return NextResponse.json(
        { error: 'Motion is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate the topic balance
    const generator = getTopicGenerator();
    const validation = await generator.validateTopicBalance(motion);

    // For now, we'll auto-approve balanced topics
    // In production, you'd want manual review
    if (validation.isBalanced) {
      await generator.storeTopics([
        {
          motion,
          category: category || 'philosophy',
          difficulty: difficulty || 'medium',
          balanceScore: Math.abs(validation.proAdvantage),
          reasoning: validation.reasoning,
        },
      ]);

      return NextResponse.json({
        success: true,
        message: 'Topic submitted and approved',
        validation,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Topic is not balanced enough for debates',
        validation,
      });
    }
  } catch (error) {
    console.error('Error submitting topic:', error);
    return NextResponse.json(
      { error: 'Failed to submit topic' },
      { status: 500 }
    );
  }
}
