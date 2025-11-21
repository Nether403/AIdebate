import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Get database URL with fallback for better error messages
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please ensure your .env file is properly configured.'
    )
  }
  return url
}

// Create Neon HTTP client
const sql = neon(getDatabaseUrl())

// Create Drizzle ORM instance with schema
export const db = drizzle(sql, { schema })

// Export the raw SQL client for advanced queries
export { sql }
