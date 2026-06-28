import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getOpenRouterFallbackModel } from '@/lib/llm/model-config'

describe('getOpenRouterFallbackModel', () => {
  test('maps the infra judge model to its valid OpenRouter slug', () => {
    // The direct Google model id is not a valid OpenRouter slug; the fallback
    // must resolve to the configured OpenRouter slug, not pass through unchanged.
    assert.equal(getOpenRouterFallbackModel('gemini-3-pro-preview'), 'google/gemini-3.1-pro-preview')
  })

  test('passes through models that are already OpenRouter slugs', () => {
    assert.equal(getOpenRouterFallbackModel('z-ai/glm-4.6'), 'z-ai/glm-4.6')
    assert.equal(getOpenRouterFallbackModel('openai/gpt-5.1-chat'), 'openai/gpt-5.1-chat')
  })
})
