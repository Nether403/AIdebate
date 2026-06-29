import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeCalibration } from '../calibration'

describe('computeCalibration', () => {
  const judged = [
    { debateId: 'd1', topicMotion: 'Open source AI', judgeWinner: 'pro' as const },
    { debateId: 'd2', topicMotion: 'Nuclear energy', judgeWinner: 'con' as const },
    { debateId: 'd3', topicMotion: 'UBI', judgeWinner: 'tie' as const },
  ]

  test('matches by debateId and computes agreement + confusion', () => {
    const gold = [
      { debateId: 'd1', winner: 'pro' as const }, // agree
      { debateId: 'd2', winner: 'pro' as const }, // disagree (judge con)
      { debateId: 'd3', winner: 'tie' as const }, // agree
    ]
    const r = computeCalibration(judged, gold)
    assert.equal(r.matched, 3)
    assert.equal(r.agreements, 2)
    assert.equal(r.agreementRate, 2 / 3)
    assert.equal(r.confusion['pro']['pro'], 1)
    assert.equal(r.confusion['pro']['con'], 1)
    assert.equal(r.disagreements.length, 1)
    assert.equal(r.disagreements[0].debateId, 'd2')
  })

  test('falls back to topic-motion matching when no debateId', () => {
    const gold = [{ topicMotion: 'nuclear ENERGY ', winner: 'con' as const }]
    const r = computeCalibration(judged, gold)
    assert.equal(r.matched, 1)
    assert.equal(r.agreements, 1)
  })

  test('counts unmatched gold labels and yields 0 rate when nothing matches', () => {
    const r = computeCalibration(judged, [{ debateId: 'missing', winner: 'pro' as const }])
    assert.equal(r.matched, 0)
    assert.equal(r.unmatched, 1)
    assert.equal(r.agreementRate, 0)
  })
})
