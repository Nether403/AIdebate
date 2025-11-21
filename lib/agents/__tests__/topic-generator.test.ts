/**
 * Topic Generator Agent Tests
 * Tests for topic generation quality, balance validation, and categorization
 * 
 * Run with: npm run test:topics:unit
 */

import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { TopicGeneratorAgent } from '../topic-generator';
import type { GeneratedTopic } from '../topic-generator';

// Simple test runner
async function runTests() {
  console.log('🧪 Running Topic Generator Agent Tests\n');
  
  const agent = new TopicGeneratorAgent();
  let passed = 0;
  let failed = 0;

  // Test 1: Generate topics with valid structure
  try {
    console.log('Test 1: Generate topics with valid structure...');
    const topics = await agent.generateTopics({
      count: 5,
      categories: ['technology', 'ethics'],
      difficulties: ['easy', 'medium'],
    });

    if (!topics || !Array.isArray(topics)) {
      throw new Error('Topics should be an array');
    }
    if (topics.length === 0) {
      throw new Error('Should generate at least one topic');
    }
    if (topics.length > 5) {
      throw new Error('Should not generate more than requested');
    }

    topics.forEach((topic, index) => {
      if (!topic.motion || typeof topic.motion !== 'string') {
        throw new Error(`Topic ${index} missing valid motion`);
      }
      if (topic.motion.length <= 10) {
        throw new Error(`Topic ${index} motion too short`);
      }
      if (!['technology', 'ethics'].includes(topic.category)) {
        throw new Error(`Topic ${index} has invalid category: ${topic.category}`);
      }
      if (!['easy', 'medium'].includes(topic.difficulty)) {
        throw new Error(`Topic ${index} has invalid difficulty: ${topic.difficulty}`);
      }
      if (topic.balanceScore < 0 || topic.balanceScore > 1) {
        throw new Error(`Topic ${index} has invalid balance score: ${topic.balanceScore}`);
      }
    });

    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    failed++;
  }

  // Test 2: Validate balanced topic
  try {
    console.log('Test 2: Validate a balanced topic...');
    const motion = 'This house believes that remote work is better than office work';
    const validation = await agent.validateTopicBalance(motion);

    if (typeof validation.isBalanced !== 'boolean') {
      throw new Error('isBalanced should be boolean');
    }
    if (validation.proAdvantage < -1 || validation.proAdvantage > 1) {
      throw new Error('proAdvantage should be between -1 and 1');
    }
    if (validation.confidence < 0 || validation.confidence > 1) {
      throw new Error('confidence should be between 0 and 1');
    }
    if (!validation.reasoning || validation.reasoning.length < 10) {
      throw new Error('reasoning should be provided');
    }

    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    failed++;
  }

  // Test 3: Detect unbalanced topics
  try {
    console.log('Test 3: Detect unbalanced topics...');
    const unbalancedMotion = 'This house believes that 2+2=5';
    const validation = await agent.validateTopicBalance(unbalancedMotion);

    if (validation.isBalanced) {
      throw new Error('Should detect obviously unbalanced topic');
    }
    if (Math.abs(validation.proAdvantage) <= 0.5) {
      throw new Error('Should show strong advantage for one side');
    }

    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    failed++;
  }

  // Test 4: Check pool status
  try {
    console.log('Test 4: Check pool status...');
    const status = await agent.checkPoolStatus();

    if (typeof status.needsReplenishment !== 'boolean') {
      throw new Error('needsReplenishment should be boolean');
    }
    if (typeof status.activeCount !== 'number' || status.activeCount < 0) {
      throw new Error('activeCount should be non-negative number');
    }
    if (status.targetCount !== 100) {
      throw new Error('targetCount should be 100');
    }

    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    failed++;
  }

  // Test 5: Generate diverse topics
  try {
    console.log('Test 5: Generate diverse topics across categories...');
    const topics = await agent.generateTopics({
      count: 10,
      categories: ['technology', 'ethics', 'science'],
    });

    const categories = new Set(topics.map((t) => t.category));
    if (categories.size <= 1) {
      throw new Error('Should generate topics across multiple categories');
    }

    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    failed++;
  }

  // Summary
  console.log('='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
      const topics = await agent.generateTopics({
        count: 5,
        categories: ['technology', 'ethics'],
        difficulties: ['easy', 'medium'],
      });

      expect(topics).toBeDefined();
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBeGreaterThan(0);
      expect(topics.length).toBeLessThanOrEqual(5);

      topics.forEach((topic) => {
        expect(topic).toHaveProperty('motion');
        expect(topic).toHaveProperty('category');
        expect(topic).toHaveProperty('difficulty');
        expect(topic).toHaveProperty('balanceScore');
        expect(topic).toHaveProperty('reasoning');

        expect(typeof topic.motion).toBe('string');
        expect(topic.motion.length).toBeGreaterThan(10);
        expect(['technology', 'ethics']).toContain(topic.category);
        expect(['easy', 'medium']).toContain(topic.difficulty);
        expect(topic.balanceScore).toBeGreaterThanOrEqual(0);
        expect(topic.balanceScore).toBeLessThanOrEqual(1);
      });
    }, 60000); // 60 second timeout for LLM calls

    it('should generate diverse topics across categories', async () => {
      const topics = await agent.generateTopics({
        count: 10,
        categories: ['technology', 'ethics', 'science'],
      });

      const categories = new Set(topics.map((t) => t.category));
      expect(categories.size).toBeGreaterThan(1);
    }, 60000);

    it('should generate topics with different difficulty levels', async () => {
      const topics = await agent.generateTopics({
        count: 10,
        difficulties: ['easy', 'medium', 'hard'],
      });

      const difficulties = new Set(topics.map((t) => t.difficulty));
      expect(difficulties.size).toBeGreaterThan(1);
    }, 60000);
  });

  describe('Balance Validation', () => {
    it('should validate a balanced topic', async () => {
      const motion = 'This house believes that remote work is better than office work';
      const validation = await agent.validateTopicBalance(motion);

      expect(validation).toHaveProperty('isBalanced');
      expect(validation).toHaveProperty('proAdvantage');
      expect(validation).toHaveProperty('reasoning');
      expect(validation).toHaveProperty('confidence');

      expect(typeof validation.isBalanced).toBe('boolean');
      expect(validation.proAdvantage).toBeGreaterThanOrEqual(-1);
      expect(validation.proAdvantage).toBeLessThanOrEqual(1);
      expect(validation.confidence).toBeGreaterThanOrEqual(0);
      expect(validation.confidence).toBeLessThanOrEqual(1);
    }, 30000);

    it('should detect unbalanced topics', async () => {
      const unbalancedMotion = 'This house believes that 2+2=5';
      const validation = await agent.validateTopicBalance(unbalancedMotion);

      expect(validation.isBalanced).toBe(false);
      expect(Math.abs(validation.proAdvantage)).toBeGreaterThan(0.5);
    }, 30000);

    it('should validate multiple topics consistently', async () => {
      const motions = [
        'This house believes that AI will benefit humanity',
        'This house believes that social media does more harm than good',
        'This house believes that space exploration is worth the cost',
      ];

      const validations = await Promise.all(
        motions.map((motion) => agent.validateTopicBalance(motion))
      );

      validations.forEach((validation) => {
        expect(validation).toHaveProperty('isBalanced');
        expect(validation).toHaveProperty('proAdvantage');
        expect(validation.reasoning.length).toBeGreaterThan(20);
      });
    }, 90000);
  });

  describe('Topic Pool Management', () => {
    it('should check pool status', async () => {
      const status = await agent.checkPoolStatus();

      expect(status).toHaveProperty('needsReplenishment');
      expect(status).toHaveProperty('activeCount');
      expect(status).toHaveProperty('targetCount');

      expect(typeof status.needsReplenishment).toBe('boolean');
      expect(status.activeCount).toBeGreaterThanOrEqual(0);
      expect(status.targetCount).toBe(100);
    });
  });

  describe('Topic Categorization', () => {
    it('should categorize topics correctly', async () => {
      const topics = await agent.generateTopics({
        count: 5,
        categories: ['technology'],
      });

      topics.forEach((topic) => {
        expect(topic.category).toBe('technology');
        // Technology topics should mention tech-related terms
        const lowerMotion = topic.motion.toLowerCase();
        const hasTechTerms =
          lowerMotion.includes('technology') ||
          lowerMotion.includes('ai') ||
          lowerMotion.includes('digital') ||
          lowerMotion.includes('internet') ||
          lowerMotion.includes('software') ||
          lowerMotion.includes('computer') ||
          lowerMotion.includes('data') ||
          lowerMotion.includes('cyber');
        
        // Not all tech topics will have these exact terms, so we'll just log
        if (!hasTechTerms) {
          console.log('Tech topic without obvious tech terms:', topic.motion);
        }
      });
    }, 60000);
  });
});
