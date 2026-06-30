// Static schema guard over lib/db/schema.ts (Req 7.3, 8.4; complements Property 12).
//
// Two complementary checks:
//   (1) Import the Drizzle table objects and assert the protected crowd-vote
//       columns are present and the removed betting columns are absent.
//   (2) Scan the schema.ts source text to assert the gamification table and
//       betting columns leave no trace (no `userProfiles` relation/reference).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { getTableColumns } from 'drizzle-orm'
import * as schema from '../schema'
import { userVotes, debates } from '../schema'
import { PROTECTED_COLUMNS } from '../migration-guard'

// Betting columns removed in task 12.1; they must never reappear on userVotes.
const REMOVED_USER_VOTE_COLUMNS = ['wagerAmount', 'oddsAtBet', 'payoutAmount'] as const

// Source-text tokens that must not appear anywhere in the active schema.
const FORBIDDEN_TOKENS = ['userProfiles', 'wagerAmount', 'oddsAtBet', 'payoutAmount'] as const

describe('schema guard - protected columns present (Req 7.3, 8.4)', () => {
  it('userVotes retains every protected crowd-vote column', () => {
    const columns = getTableColumns(userVotes)
    for (const name of PROTECTED_COLUMNS.userVotes) {
      assert.ok(name in columns, `userVotes is missing protected column "${name}"`)
    }
  })

  it('debates retains every protected crowd-tally column', () => {
    const columns = getTableColumns(debates)
    for (const name of PROTECTED_COLUMNS.debates) {
      assert.ok(name in columns, `debates is missing protected column "${name}"`)
    }
  })

  it('userVotes has no betting columns', () => {
    const columns = getTableColumns(userVotes)
    for (const name of REMOVED_USER_VOTE_COLUMNS) {
      assert.ok(!(name in columns), `userVotes still exposes removed betting column "${name}"`)
    }
  })
})

describe('schema guard - no gamification references (Req 7.3, 7.1, 7.2)', () => {
  it('the schema module exports no userProfiles table or relation', () => {
    assert.ok(!('userProfiles' in schema), 'userProfiles table is still exported from schema.ts')
    assert.ok(
      !('userProfilesRelations' in schema),
      'userProfilesRelations is still exported from schema.ts'
    )
  })

  it('schema.ts source contains no gamification table/column references', () => {
    const source = readFileSync(path.join(process.cwd(), 'lib', 'db', 'schema.ts'), 'utf8')
    for (const token of FORBIDDEN_TOKENS) {
      assert.ok(
        !source.includes(token),
        `schema.ts still references removed gamification token "${token}"`
      )
    }
  })
})
