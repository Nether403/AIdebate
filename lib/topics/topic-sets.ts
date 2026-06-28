/**
 * Topic set write paths.
 *
 * A topic set is a named, versioned, ordered collection of topics so benchmark
 * runs can draw from the same fixed topic pool reproducibly. This module owns
 * creating sets, listing their topics, and the pure membership-row builder
 * (extracted so it can be unit-tested without a database).
 */

import { db } from '@/lib/db/client'
import { topicSets, topicSetTopics } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export interface TopicSetMembershipRow {
  topicSetId: string
  topicId: string
  position: number
}

/**
 * Build ordered, de-duplicated membership rows for a topic set.
 * Duplicate topic IDs are collapsed (first occurrence wins) and positions are
 * assigned by final order starting at 0.
 */
export function buildTopicSetMembershipRows(topicSetId: string, topicIds: string[]): TopicSetMembershipRow[] {
  const seen = new Set<string>()
  const rows: TopicSetMembershipRow[] = []
  for (const topicId of topicIds) {
    if (seen.has(topicId)) continue
    seen.add(topicId)
    rows.push({ topicSetId, topicId, position: rows.length })
  }
  return rows
}

export interface CreateTopicSetInput {
  name: string
  version?: string
  description?: string | null
  source?: string
  metadata?: Record<string, unknown> | null
}

export interface CreateTopicSetResult {
  id: string
  name: string
  version: string
  topicCount: number
}

/**
 * Create a topic set and its (ordered, de-duplicated) topic memberships.
 * (name, version) is unique; creating a duplicate will throw a DB constraint error.
 */
export async function createTopicSet(input: CreateTopicSetInput, topicIds: string[]): Promise<CreateTopicSetResult> {
  if (topicIds.length === 0) {
    throw new Error('Cannot create a topic set with no topics')
  }

  const version = input.version ?? 'v1'

  const [set] = await db.insert(topicSets).values({
    name: input.name,
    version,
    description: input.description ?? null,
    source: input.source ?? 'curated',
    metadata: input.metadata ?? null,
  }).returning({ id: topicSets.id })

  const rows = buildTopicSetMembershipRows(set.id, topicIds)
  await db.insert(topicSetTopics).values(rows)

  return { id: set.id, name: input.name, version, topicCount: rows.length }
}

/**
 * Return the topic IDs in a set, ordered by membership position.
 */
export async function getTopicSetTopicIds(topicSetId: string): Promise<string[]> {
  const rows = await db.select({ topicId: topicSetTopics.topicId })
    .from(topicSetTopics)
    .where(eq(topicSetTopics.topicSetId, topicSetId))
    .orderBy(asc(topicSetTopics.position))

  return rows.map(row => row.topicId)
}

/**
 * Look up a topic set id by (name, version). Returns null if not found.
 */
export async function findTopicSetId(name: string, version = 'v1'): Promise<string | null> {
  const row = await db.query.topicSets.findFirst({
    where: (sets, { and }) => and(eq(sets.name, name), eq(sets.version, version)),
  })
  return row?.id ?? null
}

export interface TopicSelectable {
  topicId?: string
  topicSetId?: string
  topicSelection?: 'random' | 'manual'
}

/**
 * Resolve a concrete topicId for each debate that references a topic set but no
 * explicit topic. Debates sharing a set are spread across it round-robin so a
 * run covers the set deterministically. Debates with an explicit topicId (or no
 * topicSetId) are returned unchanged. Pure: no DB access, given the set->topicIds map.
 */
export function resolveTopicSetSelections<T extends TopicSelectable>(
  debates: T[],
  setTopicIds: Map<string, string[]>
): T[] {
  const cursor = new Map<string, number>()
  return debates.map(debate => {
    if (!debate.topicSetId || debate.topicId) return debate

    const ids = setTopicIds.get(debate.topicSetId)
    if (!ids || ids.length === 0) {
      throw new Error(`Topic set ${debate.topicSetId} has no topics to draw from`)
    }

    const index = cursor.get(debate.topicSetId) ?? 0
    cursor.set(debate.topicSetId, index + 1)
    return { ...debate, topicId: ids[index % ids.length], topicSelection: 'manual' as const }
  })
}
