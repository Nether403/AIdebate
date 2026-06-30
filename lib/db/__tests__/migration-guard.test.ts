// Feature: cost-governor, Property 12: Protected columns cannot be dropped, renamed, or retyped
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  checkColumnOperation,
  isProtectedColumn,
  PROTECTED_COLUMNS,
  DESTRUCTIVE_KINDS,
  type ColumnOperation,
  type ColumnOperationKind,
  type ProtectedTable,
} from '../migration-guard'

const TABLES: readonly ProtectedTable[] = ['userVotes', 'debates']

// The full kind union: destructive + non-destructive.
const ALL_KINDS: readonly ColumnOperationKind[] = [
  ...DESTRUCTIVE_KINDS,
  'add',
  'reindex',
  'set_default',
  'set_not_null',
]

const table = (): fc.Arbitrary<string> => fc.constantFrom<string>(...TABLES)

const kind = (): fc.Arbitrary<ColumnOperationKind> =>
  fc.constantFrom<ColumnOperationKind>(...ALL_KINDS)

// Draw both real protected names AND arbitrary (mostly non-protected) names so
// the IFF condition is exercised on both sides.
const column = (): fc.Arbitrary<string> => {
  const protectedNames = [...PROTECTED_COLUMNS.userVotes, ...PROTECTED_COLUMNS.debates]
  return fc.oneof(
    fc.constantFrom<string>(...protectedNames),
    fc.string({ minLength: 1, maxLength: 20 })
  )
}

const columnOperation = (): fc.Arbitrary<ColumnOperation> =>
  fc.record({ table: table(), column: column(), kind: kind() })

describe('checkColumnOperation - Property 12: protected columns cannot be dropped, renamed, or retyped', () => {
  it('rejects IFF the kind is destructive AND the column is protected', () => {
    fc.assert(
      fc.property(columnOperation(), (op) => {
        const result = checkColumnOperation(op)

        const shouldReject =
          (DESTRUCTIVE_KINDS as readonly string[]).includes(op.kind) &&
          isProtectedColumn(op.table, op.column)

        assert.equal(result.allowed, !shouldReject)

        if (shouldReject) {
          // Rejection must name the offending column.
          assert.ok(result.violation, 'expected a violation on rejection')
          assert.equal(result.violation?.column, op.column)
          assert.equal(result.violation?.table, op.table)
        } else {
          // Allowed operations carry no violation.
          assert.equal(result.violation, undefined)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('allows every non-destructive kind on protected columns', () => {
    const nonDestructive = ALL_KINDS.filter(
      (k) => !(DESTRUCTIVE_KINDS as readonly string[]).includes(k)
    )
    fc.assert(
      fc.property(
        table(),
        fc.constantFrom<ColumnOperationKind>(...nonDestructive),
        (t, k) => {
          for (const col of PROTECTED_COLUMNS[t]) {
            assert.equal(checkColumnOperation({ table: t, column: col, kind: k }).allowed, true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('allows every kind on non-protected columns', () => {
    fc.assert(
      fc.property(
        table(),
        kind(),
        fc.string({ minLength: 1, maxLength: 20 }),
        (t, k, col) => {
          fc.pre(!isProtectedColumn(t, col))
          assert.equal(checkColumnOperation({ table: t, column: col, kind: k }).allowed, true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
