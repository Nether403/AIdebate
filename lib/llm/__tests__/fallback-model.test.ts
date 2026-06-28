import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getOpenRouterFallbackModel, INFRASTRUCTURE_MODELS } from '@/lib/llm/model-config'

describe('getOpenRouterFallbackModel', () => {
  test('maps the infra judge model to its configured OpenRouter slug', () => {
    // The direct Google model id is not a valid OpenRouter slug; the fallback
    // must resolve to the judge assignment's declared fallbackModel.
    const judge = INFRASTRUCTURE_MODELS.judge
    assert.equal(getOpenRouterFallbackModel(judge.model), judge.fallbackModel)
    assert.match(judge.fallbackModel!, /^google\//)
  })

  test('passes through models that are already OpenRouter slugs', () => {
    assert.equal(getOpenRouterFallbackModel('z-ai/glm-4.6'), 'z-ai/glm-4.6')
    assert.equal(getOpenRouterFallbackModel('openai/gpt-5.1-chat'), 'openai/gpt-5.1-chat')
  })
})
