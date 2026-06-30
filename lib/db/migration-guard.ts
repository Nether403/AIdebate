/**
 * Pure, dependency-free protected-column migration guard.
 *
 * Plain crowd-voting data must survive the gamification-removal migration: a
 * migration may not drop, rename, or change the type of any protected column on
 * the `userVotes` or `debates` tables. This module is the pure check behind that
 * rule — it inspects a single column operation and decides whether it is allowed,
 * naming the offending column when it is rejected.
 *
 * Destructive operations (`drop`/`rename`/`retype`) against a protected column
 * are rejected. Every other case — non-destructive kinds on a protected column,
 * and any kind on a non-protected column — is allowed.
 *
 * Requirements: 8.4
 */

/** Tables whose crowd-vote columns are protected from destructive migration. */
export type ProtectedTable = 'userVotes' | 'debates'

/**
 * The destructive kinds that the guard rejects on a protected column. Listing
 * other (non-destructive) kinds keeps the `ColumnOperationKind` union open to
 * the operations a generator or real migration might emit (e.g. adding a column
 * or an index) without ever tripping the guard.
 */
export type DestructiveKind = 'drop' | 'rename' | 'retype'
export type NonDestructiveKind = 'add' | 'reindex' | 'set_default' | 'set_not_null'
export type ColumnOperationKind = DestructiveKind | NonDestructiveKind

/** A single column-level migration operation over a known table/column. */
export interface ColumnOperation {
  table: string
  column: string
  kind: ColumnOperationKind
}

/** Identifies the protected column an operation would have damaged. */
export interface ColumnViolation {
  table: string
  column: string
  reason: string
}

export interface ColumnOperationResult {
  allowed: boolean
  /** Present iff `allowed` is false; names the offending protected column. */
  violation?: ColumnViolation
}

/**
 * The protected crowd-vote column set, keyed by the Drizzle table export name.
 * These columns must retain their pre-migration name and data type (Req 8.1–8.3),
 * so a migration that drops, renames, or retypes any of them is rejected.
 */
export const PROTECTED_COLUMNS: Record<ProtectedTable, readonly string[]> = {
  userVotes: [
    'vote',
    'confidence',
    'reasoning',
    'debateId',
    'userId',
    'sessionId',
    'ipAddress',
    'wasCorrect',
    'createdAt',
  ],
  debates: [
    'crowdVotesProCount',
    'crowdVotesConCount',
    'crowdVotesTieCount',
    'crowdWinner',
  ],
}

/** The operation kinds that would damage a protected column if applied to one. */
export const DESTRUCTIVE_KINDS: readonly DestructiveKind[] = ['drop', 'rename', 'retype']

function isDestructive(kind: ColumnOperationKind): kind is DestructiveKind {
  return (DESTRUCTIVE_KINDS as readonly string[]).includes(kind)
}

/** Human-readable phrasing for a destructive operation, for rejection messages. */
const DESTRUCTIVE_VERB: Record<DestructiveKind, string> = {
  drop: 'dropped',
  rename: 'renamed',
  retype: 'retyped',
}

/** True iff `column` is a protected crowd-vote column on `table`. */
export function isProtectedColumn(table: string, column: string): boolean {
  const columns = PROTECTED_COLUMNS[table as ProtectedTable]
  return columns !== undefined && columns.includes(column)
}

/**
 * Decide whether a single column operation is allowed. The operation is rejected
 * if and only if it is destructive (`drop`/`rename`/`retype`) AND targets a
 * protected column; the rejection names the offending column. Operations on
 * non-protected columns, and non-destructive operations on protected columns,
 * are allowed.
 */
export function checkColumnOperation(op: ColumnOperation): ColumnOperationResult {
  if (isDestructive(op.kind) && isProtectedColumn(op.table, op.column)) {
    return {
      allowed: false,
      violation: {
        table: op.table,
        column: op.column,
        reason: `protected crowd-vote column "${op.table}.${op.column}" cannot be ${DESTRUCTIVE_VERB[op.kind]}`,
      },
    }
  }
  return { allowed: true }
}
