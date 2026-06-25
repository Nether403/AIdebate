import { describe, it } from 'node:test'
import assert from 'node:assert'
import { collectPendingSnapshots } from '../snapshots'
import type { BenchmarkDebateConfig } from '../config'

const baseDebateConfig: Omit<BenchmarkDebateConfig, 'proModelId' | 'conModelId'> = {
  topicSelection: 'random',
  totalRounds: 1,
  wordLimitPerTurn: 500,
  factCheckMode: 'standard',
}

const proModelA = '11111111-1111-4111-8111-111111111111'
const conModelA = '22222222-2222-4222-8222-222222222222'
const proModelB = '33333333-3333-4333-8333-333333333333'

describe('collectPendingSnapshots', () => {
  it('includes one snapshot per unique debater model-role pair and infra snapshots', () => {
    const snapshots = collectPendingSnapshots([
      { ...baseDebateConfig, proModelId: proModelA, conModelId: conModelA },
      { ...baseDebateConfig, proModelId: proModelA, conModelId: conModelA },
    ])

    const roles = snapshots.map(s => s.role).sort()
    assert.deepStrictEqual(roles, ['con', 'fact-checker', 'judge', 'pro'])

    const pro = snapshots.find(s => s.role === 'pro')
    assert.strictEqual(pro?.modelId, proModelA)
    assert.strictEqual(pro?.provider, 'pending')
    assert.strictEqual(pro?.providerModelId, 'pending')
  })

  it('captures distinct pro models across debates as separate snapshots', () => {
    const snapshots = collectPendingSnapshots([
      { ...baseDebateConfig, proModelId: proModelA, conModelId: conModelA },
      { ...baseDebateConfig, proModelId: proModelB, conModelId: conModelA },
    ])

    const proSnapshots = snapshots.filter(s => s.role === 'pro').map(s => s.modelId).sort()
    assert.deepStrictEqual(proSnapshots, [proModelA, proModelB].sort())
  })

  it('resolves judge and fact-checker snapshots from infrastructure model config', () => {
    const snapshots = collectPendingSnapshots([
      { ...baseDebateConfig, proModelId: proModelA, conModelId: conModelA },
    ])

    const judge = snapshots.find(s => s.role === 'judge')
    assert.ok(judge, 'expected judge snapshot')
    assert.strictEqual(judge?.modelId, null)
    assert.notStrictEqual(judge?.provider, 'pending')
    assert.notStrictEqual(judge?.providerModelId, 'pending')

    const factChecker = snapshots.find(s => s.role === 'fact-checker')
    assert.ok(factChecker, 'expected fact-checker snapshot')
    assert.strictEqual(factChecker?.modelId, null)
    assert.notStrictEqual(factChecker?.provider, 'pending')
    assert.notStrictEqual(factChecker?.providerModelId, 'pending')
  })
})
