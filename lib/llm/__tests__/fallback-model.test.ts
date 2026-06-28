import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getOpenRouterFallbackModel, INFRASTRUCTURE_MODELS, resolveJudgeConfig } from '@/lib/llm/model-config'

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

describe('resolveJudgeConfig', () => {
  test('falls back to the infrastructure judge when no override is given', () => {
    const base = INFRASTRUCTURE_MODELS.judge
    assert.deepEqual(resolveJudgeConfig(), { provider: base.provider, model: base.model })
    assert.deepEqual(resolveJudgeConfig({}), { provider: base.provider, model: base.model })
    assert.deepEqual(resolveJudgeConfig({ provider: null, model: null }), { provider: base.provider, model: base.model })
  })

  test('uses the explicit override when provided (judge-strength variable)', () => {
    assert.deepEqual(
      resolveJudgeConfig({ provider: 'openrouter', model: 'x-ai/grok-4.1-fast' }),
      { provider: 'openrouter', model: 'x-ai/grok-4.1-fast' }
    )
  })

  test('allows overriding only the model while keeping the default provider', () => {
    const base = INFRASTRUCTURE_MODELS.judge
    assert.deepEqual(resolveJudgeConfig({ model: 'gemini-3.5-flash' }), { provider: base.provider, model: 'gemini-3.5-flash' })
  })
})
