import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PROMPT_TEMPLATES,
  buildPromptTemplateRows,
  combinedVersion,
  DEBATER_PROMPT_VERSION,
  FACT_CHECK_PROMPT_VERSION,
  JUDGE_PROMPT_VERSION,
  JUDGE_SCHEMA_VERSION,
} from '../registry'

describe('prompt template registry', () => {
  test('every entry has the required fields', () => {
    for (const entry of PROMPT_TEMPLATES) {
      assert.ok(entry.templateId.length > 0, 'templateId')
      assert.ok(entry.version.length > 0, 'version')
      assert.ok(['debater', 'judge', 'fact-checker', 'moderator'].includes(entry.role), `role ${entry.role}`)
      assert.ok(entry.content.length > 0, 'content')
    }
  })

  test('(templateId, version) pairs are unique', () => {
    const keys = PROMPT_TEMPLATES.map(combinedVersion)
    assert.equal(new Set(keys).size, keys.length)
  })

  test('exported version constants match registry entries and stable stored values', () => {
    // These values are persisted on debate/eval records; keep them stable.
    assert.equal(DEBATER_PROMPT_VERSION, 'debate-rcr-v1')
    assert.equal(FACT_CHECK_PROMPT_VERSION, 'fact-check-v1')
    assert.equal(JUDGE_PROMPT_VERSION, 'judge-rubric-v1')
    assert.equal(JUDGE_SCHEMA_VERSION, 'judge-v1')

    // Each combined constant corresponds to a real registry entry.
    const combos = new Set(PROMPT_TEMPLATES.map(combinedVersion))
    assert.ok(combos.has(DEBATER_PROMPT_VERSION))
    assert.ok(combos.has(FACT_CHECK_PROMPT_VERSION))
    assert.ok(combos.has(JUDGE_PROMPT_VERSION))
  })

  test('buildPromptTemplateRows returns one row per registry entry', () => {
    const rows = buildPromptTemplateRows()
    assert.equal(rows.length, PROMPT_TEMPLATES.length)
    assert.ok(rows.every(r => r.templateId && r.version && r.role && r.content))
  })
})
