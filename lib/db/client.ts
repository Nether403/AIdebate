import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Get database URL with a clear error message. Called lazily (on first use), so
// importing this module never throws — pure-logic code/tests that transitively
// import the db client but never run a query work without DATABASE_URL set.
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please ensure your .env file is properly configured.'
    )
  }
  return url
}

type Sql = ReturnType<typeof neon>
type Db = NeonHttpDatabase<typeof schema>

let _sql: Sql | null = null
let _db: Db | null = null

function getSql(): Sql {
  if (!_sql) _sql = neon(getDatabaseUrl())
  return _sql
}

function getDb(): Db {
  if (!_db) _db = drizzle(getSql(), { schema })
  return _db
}

// Lazy proxies: connection is established on first property access / call, not
// at import time.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as any
    const value = real[prop]
    return typeof value === 'function' ? value.bind(real) : value
  },
})

export const sql = new Proxy(function () {} as unknown as Sql, {
  get(_target, prop) {
    const real = getSql() as any
    const value = real[prop]
    return typeof value === 'function' ? value.bind(real) : value
  },
  apply(_target, _thisArg, args: any[]) {
    return (getSql() as any)(...args)
  },
})
