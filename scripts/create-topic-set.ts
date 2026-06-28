import 'dotenv/config'
import { db } from '@/lib/db/client'
import { topics } from '@/lib/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { createTopicSet } from '@/lib/topics/topic-sets'

function getArg(name: string): string | null {
  const i = process.argv.findIndex(a => a === name)
  return i >= 0 ? process.argv[i + 1] || null : null
}

/**
 * Create a versioned topic set, either from a category of active topics or from
 * an explicit comma-separated list of topic IDs.
 *
 * Usage:
 *   npm run topicset:create -- --name alignment-risk --version v1 --category ethics [--limit 10]
 *   npm run topicset:create -- --name custom --topics <uuid1>,<uuid2>,<uuid3>
 */
async function main() {
  const name = getArg('--name')
  if (!name) {
    console.error('Usage: --name <name> [--version v1] (--category <cat> [--limit N] | --topics <id1,id2,...>) [--description "..."]')
    process.exit(1)
  }
  const version = getArg('--version') || 'v1'
  const description = getArg('--description')
  const category = getArg('--category')
  const topicsArg = getArg('--topics')
  const limitArg = getArg('--limit')

  let topicIds: string[]
  if (topicsArg) {
    topicIds = topicsArg.split(',').map(s => s.trim()).filter(Boolean)
    // Validate they exist
    const found = await db.select({ id: topics.id }).from(topics).where(inArray(topics.id, topicIds))
    const foundSet = new Set(found.map(t => t.id))
    const missing = topicIds.filter(id => !foundSet.has(id))
    if (missing.length) throw new Error(`Unknown topic IDs: ${missing.join(', ')}`)
  } else if (category) {
    const rows = await db.select({ id: topics.id }).from(topics)
      .where(and(eq(topics.category, category), eq(topics.isActive, true)))
    topicIds = rows.map(r => r.id)
    if (limitArg) topicIds = topicIds.slice(0, parseInt(limitArg, 10))
    if (topicIds.length === 0) throw new Error(`No active topics found in category '${category}'`)
  } else {
    throw new Error('Provide either --category or --topics')
  }

  const result = await createTopicSet(
    { name, version, description, source: 'curated', metadata: category ? { category } : null },
    topicIds
  )
  console.log(`[TopicSet] Created '${result.name}' (${result.version}) with ${result.topicCount} topics`)
  console.log(`[TopicSet] id=${result.id}`)
  process.exit(0)
}

main().catch(error => {
  console.error('[TopicSet] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
