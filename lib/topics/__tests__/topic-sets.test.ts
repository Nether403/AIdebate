import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildTopicSetMembershipRows } from '../topic-sets'

describe('buildTopicSetMembershipRows', () => {
  test('assigns sequential positions in order', () => {
    const rows = buildTopicSetMembershipRows('set-1', ['a', 'b', 'c'])
    assert.deepEqual(rows, [
      { topicSetId: 'set-1', topicId: 'a', position: 0 },
      { topicSetId: 'set-1', topicId: 'b', position: 1 },
      { topicSetId: 'set-1', topicId: 'c', position: 2 },
    ])
  })

  test('de-duplicates topic ids, keeping first occurrence and re-numbering positions', () => {
    const rows = buildTopicSetMembershipRows('set-1', ['a', 'b', 'a', 'c', 'b'])
    assert.deepEqual(rows.map(r => r.topicId), ['a', 'b', 'c'])
    assert.deepEqual(rows.map(r => r.position), [0, 1, 2])
  })

  test('returns an empty array for no topics', () => {
    assert.deepEqual(buildTopicSetMembershipRows('set-1', []), [])
  })
})
