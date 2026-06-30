/**
 * Integration tests for migration `drizzle/0005_clear_johnny_blaze.sql`
 * (cost-governor spec, task 13.3).
 *
 * Validates, against a real Postgres/Neon connection:
 *   - removals:      public.user_profiles + user_votes betting columns dropped   (Req 7.1, 7.2, 7.4)
 *   - relocation:    data moved into an unreachable `archive` schema             (Req 7.7)
 *   - unreachability: relocated data is not present in the active schema         (Req 7.3, 7.7)
 *   - rollback:      an induced mid-migration failure leaves schema + data intact (Req 7.5)
 *   - idempotency:   re-applying the migration is a no-op success                (Req 7.6)
 *   - preservation:  row counts + protected column values for user_votes/debates (Req 8.1, 8.2, 8.3, 8.5)
 *
 * SAFETY: this suite NEVER touches the real `public` schema. Every test creates
 * uniquely-named throwaway schemas, rewrites the migration's hardcoded
 * `public.`/`archive` references to point at those schemas, runs against them,
 * and drops them in a `finally`. It additionally asserts the real `public`
 * schema gained no relocation tables, proving non-destructiveness.
 *
 * It only runs when a disposable database is explicitly designated (see
 * resolveTestConnectionString). Otherwise every test is SKIPPED (exit 0).
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { Pool, neonConfig } from '@neondatabase/serverless'

const MIGRATION_PATH = path.join(process.cwd(), 'drizzle', '0005_clear_johnny_blaze.sql')

// ---------------------------------------------------------------------------
// Safety guard: only run against an explicitly-designated disposable database.
// ---------------------------------------------------------------------------
function resolveTestConnectionString(): { url?: string; skipReason?: string } {
  const dedicated =
    process.env.INTEGRATION_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL
  const optIn = ['1', 'true', 'yes'].includes(
    (process.env.ALLOW_INTEGRATION_DB_TESTS || '').toLowerCase()
  )
  const url = dedicated || (optIn ? process.env.DATABASE_URL : undefined)

  if (!url) {
    return {
      skipReason:
        'integration tests require a disposable Neon branch: set ' +
        'INTEGRATION_TEST_DATABASE_URL (or TEST_DATABASE_URL) to a throwaway ' +
        'branch connection string, or set ALLOW_INTEGRATION_DB_TESTS=1 with ' +
        'DATABASE_URL pointing at a disposable branch. Production databases are ' +
        'never touched.',
    }
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    return { skipReason: 'configured database URL is not a postgres:// connection string' }
  }
  return { url }
}

// ---------------------------------------------------------------------------
// Migration rewriting: redirect hardcoded public./archive references at the
// uniquely-named throwaway schemas so the real public schema is never touched.
// ---------------------------------------------------------------------------
const IDENT = /^[a-z][a-z0-9_]*$/
function uniqueSchemaNames(): { active: string; archive: string } {
  const suffix = randomBytes(5).toString('hex') // 10 hex chars, no `public`/`archive` substrings
  const active = `cg_it_${suffix}`
  const archive = `cg_it_${suffix}_arc`
  assert.ok(IDENT.test(active) && IDENT.test(archive), 'generated schema names must be safe identifiers')
  return { active, archive }
}

function rewriteMigration(raw: string, active: string, archive: string): string {
  return raw
    .replace(/\bpublic\./g, `${active}.`) // schema-qualified refs (incl. inside string literals)
    .replace(/'public'/g, `'${active}'`) // information_schema.table_schema filter
    .replace(/\barchive\b/g, archive) // archive schema name + qualified refs
}

// ---------------------------------------------------------------------------
// Seed data (deterministic so values can be asserted after migration).
// ---------------------------------------------------------------------------
const SEED_VOTES = [
  { session: 'sess-1', vote: 'pro', confidence: 80, reasoning: 'a', wager: 10, odds: 1.5, payout: 20, wasCorrect: true },
  { session: 'sess-2', vote: 'con', confidence: null, reasoning: null, wager: 0, odds: null, payout: 0, wasCorrect: null },
  { session: 'sess-3', vote: 'tie', confidence: 50, reasoning: 'c', wager: 5, odds: 2.0, payout: 10, wasCorrect: false },
  { session: 'sess-4', vote: 'pro', confidence: 99, reasoning: 'd', wager: 0, odds: 2.5, payout: 0, wasCorrect: true },
]
const SEED_DEBATES = [
  { status: 'completed', pro: 3, con: 1, tie: 0, winner: 'pro' },
  { status: 'completed', pro: 2, con: 2, tie: 1, winner: 'tie' },
  { status: 'evaluation_failed', pro: 0, con: 0, tie: 0, winner: null },
]

function seedSql(active: string): string {
  // Minimal table shapes covering the columns the migration touches plus the
  // protected columns asserted on. FKs are omitted (isolated throwaway schema).
  const debatesValues = SEED_DEBATES.map(
    (d) =>
      `('${d.status}', ${d.pro}, ${d.con}, ${d.tie}, ${d.winner ? `'${d.winner}'` : 'NULL'})`
  ).join(', ')
  const votesValues = SEED_VOTES.map(
    (v) =>
      `('${v.session}', '${v.vote}', ${v.confidence ?? 'NULL'}, ${v.reasoning ? `'${v.reasoning}'` : 'NULL'}, ` +
      `${v.wager}, ${v.odds ?? 'NULL'}, ${v.payout}, ${v.wasCorrect === null ? 'NULL' : v.wasCorrect})`
  ).join(', ')

  return `
    CREATE SCHEMA "${active}";

    CREATE TABLE "${active}".user_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id text NOT NULL,
      session_id text NOT NULL,
      debate_points integer DEFAULT 1000 NOT NULL,
      is_superforecaster boolean DEFAULT false NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "${active}".debates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      status text NOT NULL,
      crowd_votes_pro_count integer DEFAULT 0 NOT NULL,
      crowd_votes_con_count integer DEFAULT 0 NOT NULL,
      crowd_votes_tie_count integer DEFAULT 0 NOT NULL,
      crowd_winner text,
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "${active}".user_votes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      debate_id uuid,
      user_id text,
      session_id text NOT NULL,
      vote text NOT NULL,
      confidence integer,
      reasoning text,
      ip_address text,
      was_correct boolean,
      wager_amount integer DEFAULT 0 NOT NULL,
      odds_at_bet real,
      payout_amount integer DEFAULT 0 NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    INSERT INTO "${active}".user_profiles (user_id, session_id) VALUES
      ('user-1', 'pf-1'), ('user-2', 'pf-2');

    INSERT INTO "${active}".debates (status, crowd_votes_pro_count, crowd_votes_con_count, crowd_votes_tie_count, crowd_winner)
      VALUES ${debatesValues};

    INSERT INTO "${active}".user_votes (session_id, vote, confidence, reasoning, wager_amount, odds_at_bet, payout_amount, was_correct)
      VALUES ${votesValues};
  `
}

// ---------------------------------------------------------------------------
// Small query helpers.
// ---------------------------------------------------------------------------
async function regclass(pool: Pool, qualified: string): Promise<string | null> {
  const { rows } = await pool.query('SELECT to_regclass($1) AS oid', [qualified])
  return rows[0].oid
}
async function columnNames(pool: Pool, schema: string, table: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY column_name`,
    [schema, table]
  )
  return rows.map((r: { column_name: string }) => r.column_name)
}
async function count(pool: Pool, schema: string, table: string): Promise<number> {
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM "${schema}"."${table}"`)
  return rows[0].n
}

const PROTECTED_VOTE_COLUMNS = [
  'vote', 'confidence', 'reasoning', 'debate_id', 'user_id', 'session_id', 'ip_address', 'was_correct', 'created_at',
]
const BETTING_COLUMNS = ['wager_amount', 'odds_at_bet', 'payout_amount']

const { url, skipReason } = resolveTestConnectionString()

if (skipReason) {
  console.log(`[integration] migration 0005 suite skipped: ${skipReason}`)
  test('migration 0005 (Neon branch) — skipped: no disposable database configured', { skip: skipReason }, () => {})
} else {
  // neon's Pool talks WebSocket; Node 22+ exposes a global WebSocket constructor.
  if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = WebSocket as unknown as typeof neonConfig.webSocketConstructor
  }

  const pool = new Pool({ connectionString: url })
  const rawMigration = readFileSync(MIGRATION_PATH, 'utf8')

  after(async () => {
    await pool.end()
  })

  /** Create unique throwaway schemas, seed them, run `fn`, always tear down. */
  async function withSeededSchemas(
    fn: (ctx: { active: string; archive: string }) => Promise<void>
  ): Promise<void> {
    const { active, archive } = uniqueSchemaNames()
    try {
      await pool.query(seedSql(active))
      await fn({ active, archive })
    } finally {
      // Only ever drop our own uniquely-named schemas. Never `public`.
      await pool.query(`DROP SCHEMA IF EXISTS "${active}" CASCADE`).catch(() => {})
      await pool.query(`DROP SCHEMA IF EXISTS "${archive}" CASCADE`).catch(() => {})
    }
  }

  test('applies 0005: removes gamification, relocates to archive, preserves crowd data (Req 7.1-7.4, 7.7, 8.1-8.3, 8.5)', async () => {
    await withSeededSchemas(async ({ active, archive }) => {
      const votesBefore = await count(pool, active, 'user_votes')
      const debatesBefore = await count(pool, active, 'debates')
      const profilesBefore = await count(pool, active, 'user_profiles')
      const { rows: debateSnapshot } = await pool.query(
        `SELECT id, status, crowd_votes_pro_count, crowd_votes_con_count, crowd_votes_tie_count, crowd_winner
         FROM "${active}".debates ORDER BY crowd_votes_pro_count, crowd_votes_tie_count`
      )

      await pool.query(rewriteMigration(rawMigration, active, archive))

      // Removals (Req 7.1, 7.2, 7.4)
      assert.equal(await regclass(pool, `${active}.user_profiles`), null, 'user_profiles must be dropped from the active schema')
      const voteCols = await columnNames(pool, active, 'user_votes')
      for (const col of BETTING_COLUMNS) {
        assert.ok(!voteCols.includes(col), `betting column ${col} must be dropped from user_votes`)
      }

      // Protected columns retained (Req 8.1, 8.2)
      for (const col of PROTECTED_VOTE_COLUMNS) {
        assert.ok(voteCols.includes(col), `protected column ${col} must remain on user_votes`)
      }

      // Relocation into archive (Req 7.7)
      assert.notEqual(await regclass(pool, `${archive}.user_profiles_legacy`), null, 'user_profiles relocated to archive')
      assert.notEqual(await regclass(pool, `${archive}.user_votes_betting_legacy`), null, 'betting columns relocated to archive')
      assert.equal(await count(pool, archive, 'user_profiles_legacy'), profilesBefore, 'all profiles relocated')
      assert.equal(await count(pool, archive, 'user_votes_betting_legacy'), votesBefore, 'one betting row relocated per vote')

      // Relocated data is unreachable from the active schema (Req 7.3, 7.7)
      assert.equal(await regclass(pool, `${active}.user_profiles_legacy`), null, 'archive copy must NOT live in the active schema')
      assert.equal(await regclass(pool, `${active}.user_votes_betting_legacy`), null, 'archive copy must NOT live in the active schema')

      // Real public schema is untouched — proves non-destructiveness.
      assert.equal(await regclass(pool, 'public.user_profiles_legacy'), null, 'real public schema must gain no relocation tables')
      assert.equal(await regclass(pool, 'public.user_votes_betting_legacy'), null, 'real public schema must gain no relocation tables')

      // Row counts preserved (Req 8.5)
      assert.equal(await count(pool, active, 'user_votes'), votesBefore, 'user_votes row count preserved')
      assert.equal(await count(pool, active, 'debates'), debatesBefore, 'debates row count preserved')

      // Betting values preserved in archive (multiset compare against seed)
      const { rows: relocated } = await pool.query(
        `SELECT wager_amount, odds_at_bet, payout_amount
         FROM "${archive}".user_votes_betting_legacy ORDER BY wager_amount, payout_amount, odds_at_bet NULLS FIRST`
      )
      const expectedBetting = [...SEED_VOTES]
        .map((v) => ({ wager_amount: v.wager, odds_at_bet: v.odds, payout_amount: v.payout }))
        .sort(
          (a, b) =>
            a.wager_amount - b.wager_amount ||
            a.payout_amount - b.payout_amount ||
            (a.odds_at_bet ?? -1) - (b.odds_at_bet ?? -1)
        )
      assert.deepEqual(
        relocated.map((r: any) => ({ wager_amount: r.wager_amount, odds_at_bet: r.odds_at_bet, payout_amount: r.payout_amount })),
        expectedBetting,
        'relocated betting values must match seeded values'
      )

      // Protected debate values unchanged (Req 8.3) — migration never touches debates.
      const { rows: debateAfter } = await pool.query(
        `SELECT id, status, crowd_votes_pro_count, crowd_votes_con_count, crowd_votes_tie_count, crowd_winner
         FROM "${active}".debates ORDER BY crowd_votes_pro_count, crowd_votes_tie_count`
      )
      assert.deepEqual(debateAfter, debateSnapshot, 'debates rows (status + crowd tallies + winner) must be unchanged')
    })
  })

  test('re-applying 0005 against an already-clean schema is a no-op success (Req 7.6)', async () => {
    await withSeededSchemas(async ({ active, archive }) => {
      const migration = rewriteMigration(rawMigration, active, archive)
      await pool.query(migration) // first application

      const profilesLegacy1 = await count(pool, archive, 'user_profiles_legacy')
      const bettingLegacy1 = await count(pool, archive, 'user_votes_betting_legacy')
      const votes1 = await count(pool, active, 'user_votes')

      // Second application must not throw and must not change anything.
      await assert.doesNotReject(() => pool.query(migration), 're-application must succeed')

      assert.equal(await count(pool, archive, 'user_profiles_legacy'), profilesLegacy1, 'archive profiles unchanged on re-apply')
      assert.equal(await count(pool, archive, 'user_votes_betting_legacy'), bettingLegacy1, 'archive betting rows not duplicated on re-apply')
      assert.equal(await count(pool, active, 'user_votes'), votes1, 'user_votes unchanged on re-apply')
      assert.equal(await regclass(pool, `${active}.user_profiles`), null, 'user_profiles still absent after re-apply')
    })
  })

  test('an induced mid-migration failure rolls back, leaving schema + data intact (Req 7.5)', async () => {
    await withSeededSchemas(async ({ active, archive }) => {
      const votesBefore = await count(pool, active, 'user_votes')
      const profilesBefore = await count(pool, active, 'user_profiles')

      // Inject a failing statement just before COMMIT so all migration work is
      // staged inside the transaction and then rolled back atomically.
      const failing = rewriteMigration(rawMigration, active, archive).replace(
        'COMMIT;',
        `SELECT * FROM "${active}".__cg_missing_force_fail__;\nCOMMIT;`
      )

      const client = await pool.connect()
      let threw = false
      try {
        await client.query(failing)
      } catch {
        threw = true
        await client.query('ROLLBACK').catch(() => {})
      } finally {
        client.release()
      }
      assert.ok(threw, 'the induced mid-migration failure must raise an error')

      // Schema + data intact (Req 7.5)
      assert.notEqual(await regclass(pool, `${active}.user_profiles`), null, 'user_profiles must survive a rolled-back migration')
      const voteCols = await columnNames(pool, active, 'user_votes')
      for (const col of BETTING_COLUMNS) {
        assert.ok(voteCols.includes(col), `betting column ${col} must survive a rolled-back migration`)
      }
      assert.equal(await count(pool, active, 'user_votes'), votesBefore, 'user_votes rows intact after rollback')
      assert.equal(await count(pool, active, 'user_profiles'), profilesBefore, 'user_profiles rows intact after rollback')

      // The archive schema must not persist from the rolled-back transaction.
      const { rows } = await pool.query('SELECT to_regnamespace($1) AS ns', [archive])
      assert.equal(rows[0].ns, null, 'archive schema creation must be rolled back')
    })
  })
}
