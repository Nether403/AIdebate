/**
 * Manual Topic Generation Test Script
 * Generates 50 topics and outputs them for manual review
 */

import { getTopicGenerator } from '../lib/agents/topic-generator';

async function testTopicGeneration() {
  console.log('🎯 Starting topic generation test...\n');
  console.log('Generating 50 balanced debate topics...\n');

  const generator = getTopicGenerator();

  try {
    const topics = await generator.generateTopics({
      count: 50,
    });

    console.log(`✅ Successfully generated ${topics.length} topics\n`);
    console.log('=' .repeat(80));
    console.log('\n');

    // Group by category
    const byCategory: Record<string, typeof topics> = {};
    topics.forEach((topic) => {
      if (!byCategory[topic.category]) {
        byCategory[topic.category] = [];
      }
      byCategory[topic.category].push(topic);
    });

    // Display topics by category
    Object.entries(byCategory).forEach(([category, categoryTopics]) => {
      console.log(`\n📁 ${category.toUpperCase()} (${categoryTopics.length} topics)`);
      console.log('-'.repeat(80));

      categoryTopics.forEach((topic, index) => {
        console.log(`\n${index + 1}. ${topic.motion}`);
        console.log(`   Difficulty: ${topic.difficulty}`);
        console.log(`   Balance Score: ${(topic.balanceScore * 100).toFixed(1)}% (${topic.balanceScore < 0.1 ? 'Excellent' : topic.balanceScore < 0.2 ? 'Good' : 'Acceptable'})`);
        console.log(`   Reasoning: ${topic.reasoning}`);
      });
    });

    // Statistics
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 STATISTICS');
    console.log('='.repeat(80));

    console.log(`\nTotal Topics: ${topics.length}`);
    
    console.log('\nBy Category:');
    Object.entries(byCategory).forEach(([category, categoryTopics]) => {
      console.log(`  ${category}: ${categoryTopics.length}`);
    });

    const byDifficulty: Record<string, number> = {};
    topics.forEach((topic) => {
      byDifficulty[topic.difficulty] = (byDifficulty[topic.difficulty] || 0) + 1;
    });

    console.log('\nBy Difficulty:');
    Object.entries(byDifficulty).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}`);
    });

    const avgBalance = topics.reduce((sum, t) => sum + t.balanceScore, 0) / topics.length;
    console.log(`\nAverage Balance Score: ${(avgBalance * 100).toFixed(1)}%`);

    const excellentBalance = topics.filter((t) => t.balanceScore < 0.1).length;
    const goodBalance = topics.filter((t) => t.balanceScore >= 0.1 && t.balanceScore < 0.2).length;
    const acceptableBalance = topics.filter((t) => t.balanceScore >= 0.2).length;

    console.log('\nBalance Distribution:');
    console.log(`  Excellent (<10%): ${excellentBalance} (${((excellentBalance / topics.length) * 100).toFixed(1)}%)`);
    console.log(`  Good (10-20%): ${goodBalance} (${((goodBalance / topics.length) * 100).toFixed(1)}%)`);
    console.log(`  Acceptable (>20%): ${acceptableBalance} (${((acceptableBalance / topics.length) * 100).toFixed(1)}%)`);

    console.log('\n✅ Topic generation test complete!');
    console.log('\n💡 Review the topics above for:');
    console.log('   - Clarity and specificity');
    console.log('   - Side balance (can both sides argue effectively?)');
    console.log('   - Diversity across categories and difficulties');
    console.log('   - Appropriate categorization');

  } catch (error) {
    console.error('❌ Error during topic generation:', error);
    process.exit(1);
  }
}

// Run the test
testTopicGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
