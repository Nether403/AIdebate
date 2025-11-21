import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createDebateConfig, validateDebateConfig, DebateConfigBuilder } from '../config'

describe('DebateConfigBuilder', () => {
  const mockModelAId = '123e4567-e89b-12d3-a456-426614174000'
  const mockModelBId = '123e4567-e89b-12d3-a456-426614174001'
  const mockTopicId = '123e4567-e89b-12d3-a456-426614174002'
  const mockPersonaId = '123e4567-e89b-12d3-a456-426614174003'

  describe('withModels', () => {
    it('should randomly assign pro/con positions', () => {
      const config1 = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .build()

      assert.ok([mockModelAId, mockModelBId].includes(config1.proModelId))
      assert.ok([mockModelAId, mockModelBId].includes(config1.conModelId))
      assert.notStrictEqual(config1.proModelId, config1.conModelId)
    })
  })

  describe('withProModel and withConModel', () => {
    it('should force specific model positions', () => {
      const config = createDebateConfig()
        .withProModel(mockModelAId)
        .withConModel(mockModelBId)
        .withTopic(mockTopicId)
        .build()

      assert.strictEqual(config.proModelId, mockModelAId)
      assert.strictEqual(config.conModelId, mockModelBId)
    })
  })

  describe('withPersonas', () => {
    it('should assign personas to both sides', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withPersonas(mockPersonaId, mockPersonaId)
        .withTopic(mockTopicId)
        .build()

      assert.strictEqual(config.proPersonaId, mockPersonaId)
      assert.strictEqual(config.conPersonaId, mockPersonaId)
    })

    it('should allow null personas', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withPersonas(null, null)
        .withTopic(mockTopicId)
        .build()

      assert.strictEqual(config.proPersonaId, null)
      assert.strictEqual(config.conPersonaId, null)
    })
  })

  describe('withTopic', () => {
    it('should set manual topic selection', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .build()

      assert.strictEqual(config.topicId, mockTopicId)
      assert.strictEqual(config.topicSelection, 'manual')
    })
  })

  describe('withRandomTopic', () => {
    it('should set random topic selection', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withRandomTopic()
        .build()

      assert.strictEqual(config.topicSelection, 'random')
      assert.strictEqual(config.topicId, undefined)
    })
  })

  describe('withRounds', () => {
    it('should set custom round count', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .withRounds(5)
        .build()

      assert.strictEqual(config.totalRounds, 5)
    })

    it('should use default rounds if not specified', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .build()

      assert.strictEqual(config.totalRounds, 3)
    })
  })

  describe('withWordLimit', () => {
    it('should set custom word limit', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .withWordLimit(300)
        .build()

      assert.strictEqual(config.wordLimitPerTurn, 300)
    })
  })

  describe('withFactCheckMode', () => {
    it('should set fact-check mode', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .withFactCheckMode('strict')
        .build()

      assert.strictEqual(config.factCheckMode, 'strict')
    })
  })

  describe('validate', () => {
    it('should return valid for complete configuration', () => {
      const builder = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)

      const result = builder.validate()
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors, undefined)
    })

    it('should return errors for incomplete configuration', () => {
      const builder = new DebateConfigBuilder()

      const result = builder.validate()
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors)
      assert.ok(result.errors!.length > 0)
    })
  })

  describe('build', () => {
    it('should throw error for invalid configuration', () => {
      const builder = new DebateConfigBuilder()

      assert.throws(() => builder.build(), /Invalid debate configuration/)
    })

    it('should return valid config for complete configuration', () => {
      const config = createDebateConfig()
        .withModels(mockModelAId, mockModelBId)
        .withTopic(mockTopicId)
        .build()

      assert.ok(config)
      assert.ok(config.proModelId)
      assert.ok(config.conModelId)
    })
  })
})

describe('validateDebateConfig', () => {
  const mockModelAId = '123e4567-e89b-12d3-a456-426614174000'
  const mockModelBId = '123e4567-e89b-12d3-a456-426614174001'
  const mockTopicId = '123e4567-e89b-12d3-a456-426614174002'

  it('should validate a valid configuration', () => {
    const config = {
      proModelId: mockModelAId,
      conModelId: mockModelBId,
      topicId: mockTopicId,
      topicSelection: 'manual',
      totalRounds: 3,
      wordLimitPerTurn: 500,
      factCheckMode: 'standard',
    }

    const result = validateDebateConfig(config)
    assert.strictEqual(result.valid, true)
    assert.ok(result.data)
  })

  it('should reject invalid UUIDs', () => {
    const config = {
      proModelId: 'not-a-uuid',
      conModelId: mockModelBId,
      topicId: mockTopicId,
    }

    const result = validateDebateConfig(config)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors)
  })

  it('should reject invalid round counts', () => {
    const config = {
      proModelId: mockModelAId,
      conModelId: mockModelBId,
      topicId: mockTopicId,
      totalRounds: 0,
    }

    const result = validateDebateConfig(config)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors)
  })

  it('should reject invalid word limits', () => {
    const config = {
      proModelId: mockModelAId,
      conModelId: mockModelBId,
      topicId: mockTopicId,
      wordLimitPerTurn: 50,
    }

    const result = validateDebateConfig(config)
    assert.strictEqual(result.valid, false)
    assert.ok(result.errors)
  })
})
