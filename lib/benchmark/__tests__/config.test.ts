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

  const baseDebate = {
    proModelId: '11111111-1111-4111-8111-111111111111',
    conModelId: '22222222-2222-4222-8222-222222222222',
  }

  it('parses valid per-debate and per-run cost ceilings', () => {
    const config = parseBenchmarkRunConfig({
      name: 'ceilings',
      perDebateCostCeilingUsd: 0.5,
      perRunCostCeilingUsd: 100,
      debates: [baseDebate],
    })

    assert.strictEqual(config.perDebateCostCeilingUsd, 0.5)
    assert.strictEqual(config.perRunCostCeilingUsd, 100)
  })

  it('parses boundary ceiling values (0 and 1_000_000)', () => {
    const config = parseBenchmarkRunConfig({
      name: 'boundary',
      perDebateCostCeilingUsd: 0,
      perRunCostCeilingUsd: 1_000_000,
      debates: [baseDebate],
    })

    assert.strictEqual(config.perDebateCostCeilingUsd, 0)
    assert.strictEqual(config.perRunCostCeilingUsd, 1_000_000)
  })

  it('treats absent ceilings as unconfigured (undefined)', () => {
    const config = parseBenchmarkRunConfig({
      name: 'no-ceilings',
      debates: [baseDebate],
    })

    assert.strictEqual(config.perDebateCostCeilingUsd, undefined)
    assert.strictEqual(config.perRunCostCeilingUsd, undefined)
  })

  it('rejects a negative per-debate ceiling and names the field', () => {
    assert.throws(
      () =>
        parseBenchmarkRunConfig({
          name: 'negative',
          perDebateCostCeilingUsd: -1,
          debates: [baseDebate],
        }),
      /perDebateCostCeilingUsd/
    )
  })

  it('rejects an out-of-range per-run ceiling and names the field', () => {
    assert.throws(
      () =>
        parseBenchmarkRunConfig({
          name: 'too-big',
          perRunCostCeilingUsd: 1_000_001,
          debates: [baseDebate],
        }),
      /perRunCostCeilingUsd/
    )
  })

  it('rejects a non-finite per-debate ceiling and names the field', () => {
    assert.throws(
      () =>
        parseBenchmarkRunConfig({
          name: 'infinite',
          perDebateCostCeilingUsd: Number.POSITIVE_INFINITY,
          debates: [baseDebate],
        }),
      /perDebateCostCeilingUsd/
    )
  })
})
