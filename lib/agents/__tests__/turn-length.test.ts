import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { classifyTurnLength, MIN_SPEECH_WORDS, DEFAULT_MAX_TURN_RETRIES } from '../turn-length'

describe('classifyTurnLength', () => {
  test('accepts a turn within the word band', () => {
    assert.deepEqual(classifyTurnLength(200, 350, 1), { action: 'accept' })
  })

  test('retries an empty/too-short turn while retries remain', () => {
    assert.deepEqual(classifyTurnLength(0, 350, 1), { action: 'retry', kind: 'too_short' })
    assert.deepEqual(classifyTurnLength(10, 350, 2), { action: 'retry', kind: 'too_short' })
  })

  test('fails (does not accept) an empty turn once retries are exhausted', () => {
    // The critical fix: an empty speech must never be silently accepted.
    assert.deepEqual(classifyTurnLength(0, 350, DEFAULT_MAX_TURN_RETRIES), { action: 'fail', kind: 'too_short' })
  })

  test('retries an over-limit turn while retries remain, then truncates', () => {
    assert.deepEqual(classifyTurnLength(500, 350, 1), { action: 'retry', kind: 'too_long' })
    assert.deepEqual(classifyTurnLength(500, 350, DEFAULT_MAX_TURN_RETRIES), { action: 'truncate' })
  })

  test('too-short takes precedence and uses the min-words floor', () => {
    assert.deepEqual(classifyTurnLength(MIN_SPEECH_WORDS - 1, 350, 1), { action: 'retry', kind: 'too_short' })
    assert.deepEqual(classifyTurnLength(MIN_SPEECH_WORDS, 350, 1), { action: 'accept' })
  })
})
