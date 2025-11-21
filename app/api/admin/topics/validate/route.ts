/**
 * Admin API: Topic Balance Validation
 * Endpoint for validating if a topic is side-balanced
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopicGenerator } from '@/lib/agents/topic-generator';

/**
 * POST /api/admin/topics/validate
 * Validate if a topic motion is balanced
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motion } = body;

    if (!motion || typeof motion !== 'string') {
      return NextResponse.json(
        { error: 'Motion is required and must be a string' },
        { status: 400 }
      );
    }

    const generator = getTopicGenerator();
    const validation = await generator.validateTopicBalance(motion);

    return NextResponse.json({
      motion,
      validation,
    });
  } catch (error) {
    console.error('Error validating topic:', error);
    return NextResponse.json(
      { error: 'Failed to validate topic' },
      { status: 500 }
    );
  }
}
