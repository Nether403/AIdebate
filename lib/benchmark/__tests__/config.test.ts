import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseBenchmarkRunConfig } from '../config'

describe('parseBenchmarkRunConfig', () => {
  it('parses a minimal benchmark run config with defaults', () => {
    const config = parseBenchmarkRunConfig({
      name: 'smoke',
      debates: [
        {
          proModelId: '11111111-1111-4111-8111-111111111111',
          conModelId: '22222222-2222-4222-8222-222222222222',
        },
      ],
    })

    assert.strictEqual(config.name, 'smoke')
    assert.strictEqual(config.debates.length, 1)
    assert.strictEqual(config.debates[0].topicSelection, 'random')
    assert.strictEqual(config.debates[0].totalRounds, 1)
    assert.strictEqual(config.debates[0].wordLimitPerTurn, 250)
    assert.strictEqual(config.debates[0].factCheckMode, 'standard')
  })

  it('rejects an empty debate list', () => {
    assert.throws(
      () => parseBenchmarkRunConfig({ name: 'empty', debates: [] }),
      /Invalid benchmark config: debates: Too small/
    )
  })
})
