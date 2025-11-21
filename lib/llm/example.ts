/**
 * LLM Client Usage Examples
 * Run with: tsx lib/llm/example.ts
 */

import { getLLMClient, chat, chatStream } from './client';
import { streamWithRCRPhases, extractRCRPhases } from './streaming';
import type { LLMMessage, LLMConfig } from '@/types/llm';

async function example1_basicChat() {
  console.log('\n=== Example 1: Basic Chat ===\n');

  const response = await chat(
    'What is the capital of France?',
    {
      provider: 'openai',
      model: 'gpt-5.1', // Latest frontier model
      temperature: 0.7,
    },
    'You are a helpful geography assistant.'
  );

  console.log('Response:', response);
}

async function example2_detailedResponse() {
  console.log('\n=== Example 2: Detailed Response with Metadata ===\n');

  const client = getLLMClient();
  
  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in one sentence.' }
  ];

  const config: LLMConfig = {
    provider: 'google',
    model: 'gemini-3.0-pro', // Latest frontier model
    temperature: 0.7,
  };

  const response = await client.generate(messages, config);

  console.log('Content:', response.content);
  console.log('Model:', response.model);
  console.log('Provider:', response.provider);
  console.log('Tokens:', response.tokensUsed);
  console.log('Cost: $' + response.cost.toFixed(6));
  console.log('Latency:', response.latencyMs + 'ms');
}

async function example3_streaming() {
  console.log('\n=== Example 3: Streaming Response ===\n');

  process.stdout.write('Response: ');

  for await (const chunk of chatStream(
    'Write a haiku about coding.',
    {
      provider: 'openai',
      model: 'gpt-5.1-instant', // Latest frontier model (fast mode)
    }
  )) {
    process.stdout.write(chunk);
  }

  console.log('\n');
}

async function example4_rcrPhases() {
  console.log('\n=== Example 4: RCR Phase Extraction ===\n');

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a debate assistant. Use the RCR format:
<reflection>Analyze the topic</reflection>
<critique>Identify key points</critique>
<speech>Your main argument</speech>`
    },
    {
      role: 'user',
      content: 'Should AI be regulated?'
    }
  ];

  const config: LLMConfig = {
    provider: 'openai',
    model: 'gpt-5.1-thinking', // Latest frontier model (reasoning mode)
    temperature: 0.7,
  };

  let fullContent = '';

  for await (const event of streamWithRCRPhases(messages, config)) {
    if (event.type === 'phase') {
      console.log(`\n[${event.phase?.toUpperCase()}]`);
      console.log(event.content);
    } else if (event.type === 'content') {
      fullContent += event.content;
    } else if (event.type === 'complete') {
      console.log('\n[COMPLETE]');
      console.log('Tokens:', event.tokensUsed);
    }
  }
}

async function example5_multiProvider() {
  console.log('\n=== Example 5: Multi-Provider Comparison ===\n');

  const client = getLLMClient();
  const prompt = 'What is 2+2?';

  const providers: Array<{ provider: 'openai' | 'google', model: string }> = [
    { provider: 'openai', model: 'gpt-5.1' }, // Latest frontier
    { provider: 'google', model: 'gemini-3.0-pro' }, // Latest frontier
  ];

  for (const { provider, model } of providers) {
    if (!client.isProviderAvailable(provider)) {
      console.log(`${provider} not available (API key not set)`);
      continue;
    }

    const response = await client.generate(
      [{ role: 'user', content: prompt }],
      { provider, model }
    );

    console.log(`\n${provider} (${model}):`);
    console.log('Response:', response.content);
    console.log('Cost: $' + response.cost.toFixed(6));
    console.log('Latency:', response.latencyMs + 'ms');
  }
}

async function example6_errorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const client = getLLMClient();

  // Example 1: Unavailable provider
  try {
    await client.generate(
      [{ role: 'user', content: 'Hello' }],
      { provider: 'anthropic', model: 'claude-4.5-sonnet' } // Latest frontier
    );
  } catch (error) {
    console.log('Error (expected):', (error as Error).message);
  }

  // Example 2: Check provider availability first
  if (client.isProviderAvailable('openai')) {
    console.log('\nOpenAI is available!');
    const response = await client.generate(
      [{ role: 'user', content: 'Hello' }],
      { provider: 'openai', model: 'gpt-5.1' } // Latest frontier
    );
    console.log('Response:', response.content);
  }
}

async function example7_costTracking() {
  console.log('\n=== Example 7: Cost Tracking ===\n');

  const client = getLLMClient();
  let totalCost = 0;

  const prompts = [
    'What is AI?',
    'Explain machine learning.',
    'What is deep learning?',
  ];

  for (const prompt of prompts) {
    const response = await client.generate(
      [{ role: 'user', content: prompt }],
      { provider: 'openai', model: 'gpt-5.1' } // Latest frontier
    );

    totalCost += response.cost;
    console.log(`Prompt: "${prompt}"`);
    console.log(`Cost: $${response.cost.toFixed(6)}`);
    console.log(`Tokens: ${response.tokensUsed.total}\n`);
  }

  console.log(`Total cost: $${totalCost.toFixed(6)}`);
}

// Run examples
async function main() {
  console.log('LLM Client Examples');
  console.log('===================');

  const client = getLLMClient();
  console.log('\nAvailable providers:', client.getAvailableProviders().join(', '));

  try {
    // Uncomment the examples you want to run
    await example1_basicChat();
    await example2_detailedResponse();
    await example3_streaming();
    // await example4_rcrPhases(); // Requires specific prompt format
    await example5_multiProvider();
    await example6_errorHandling();
    await example7_costTracking();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
