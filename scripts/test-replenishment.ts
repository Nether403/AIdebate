/**
 * Topic Pool Replenishment Test Script
 * Tests the automatic replenishment logic
 */

import { getTopicGenerator } from '../lib/agents/topic-generator';
import { db } from '../lib/db/client';
import { topics } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function testReplenishment() {
  console.log('🔄 Testing topic pool replenishment logic...\n');

  const generator = getTopicGenerator();

  try {
    // Check initial pool status
    console.log('1️⃣ Checking initial pool status...');
    const initialStatus = await generator.checkPoolStatus();
    console.log(`   Active topics: ${initialStatus.activeCount}`);
    console.log(`   Target: ${initialStatus.targetCount}`);
    console.log(`   Needs replenishment: ${initialStatus.needsReplenishment ? 'YES' : 'NO'}\n`);

    // Test replenishment
    console.log('2️⃣ Testing automatic replenishment...');
    const result = await generator.replenishPoolIfNeeded();
    
    if (result.replenished) {
      console.log(`   ✅ Pool replenished with ${result.topicsAdded} new topics\n`);
    } else {
      console.log(`   ℹ️  No replenishment needed\n`);
    }

    // Check final pool status
    console.log('3️⃣ Checking final pool status...');
    const finalStatus = await generator.checkPoolStatus();
    console.log(`   Active topics: ${finalStatus.activeCount}`);
    console.log(`   Target: ${finalStatus.targetCount}`);
    console.log(`   Needs replenishment: ${finalStatus.needsReplenishment ? 'YES' : 'NO'}\n`);

    // Test retirement and re-check
    console.log('4️⃣ Testing retirement and re-check...');
    const activeTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.isActive, true))
      .limit(25);

    if (activeTopics.length >= 25) {
      console.log(`   Retiring 25 topics to trigger replenishment...`);
      
      for (const topic of activeTopics) {
        await generator.retireTopic(topic.id, 'Test retirement');
      }

      console.log(`   ✅ Retired 25 topics\n`);

      console.log('5️⃣ Checking if replenishment is triggered...');
      const afterRetirementStatus = await generator.checkPoolStatus();
      console.log(`   Active topics: ${afterRetirementStatus.activeCount}`);
      console.log(`   Needs replenishment: ${afterRetirementStatus.needsReplenishment ? 'YES' : 'NO'}\n`);

      if (afterRetirementStatus.needsReplenishment) {
        console.log('6️⃣ Running replenishment...');
        const replenishResult = await generator.replenishPoolIfNeeded();
        console.log(`   ✅ Added ${replenishResult.topicsAdded} new topics\n`);

        const finalCheck = await generator.checkPoolStatus();
        console.log('7️⃣ Final status:');
        console.log(`   Active topics: ${finalCheck.activeCount}`);
        console.log(`   Needs replenishment: ${finalCheck.needsReplenishment ? 'YES' : 'NO'}\n`);
      }
    } else {
      console.log(`   ⚠️  Not enough active topics to test retirement (found ${activeTopics.length})\n`);
    }

    console.log('✅ Replenishment test complete!');

  } catch (error) {
    console.error('❌ Error during replenishment test:', error);
    process.exit(1);
  }
}

// Run the test
testReplenishment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
