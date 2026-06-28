/**
 * Prompt template registry — single source of truth for prompt/version IDs.
 *
 * Agents reference the exported version constants instead of hard-coding strings,
 * and `seedPromptTemplates()` writes the registry into the `prompt_templates`
 * table so every debate's persisted `promptVersion` traces to a canonical,
 * versioned template (id, role, content skeleton, metadata).
 *
 * The stored `promptVersion` string equals `${templateId}-${version}` so existing
 * persisted values (e.g. `debate-rcr-v1`) remain stable.
 */

import { db } from '@/lib/db/client'
import { promptTemplates } from '@/lib/db/schema'

export type PromptRole = 'debater' | 'judge' | 'fact-checker' | 'moderator'

export interface PromptTemplateEntry {
  templateId: string
  version: string
  role: PromptRole
  content: string
  metadata?: Record<string, unknown>
}

/** Combined version string stored on records: `${templateId}-${version}`. */
export function combinedVersion(entry: Pick<PromptTemplateEntry, 'templateId' | 'version'>): string {
  return `${entry.templateId}-${entry.version}`
}

export const PROMPT_TEMPLATES: PromptTemplateEntry[] = [
  {
    templateId: 'debate-rcr',
    version: 'v1',
    role: 'debater',
    content: [
      'System: {{persona_system_prompt?}} You are a skilled debater arguing {{position}} the motion: "{{motion}}".',
      'User: debate context (round {{currentRound}}/{{totalRounds}}, {{roundType}}, word limit {{wordLimit}}), the full prior transcript, and the opponent\'s last argument.',
      'Task: Reflect-Critique-Refine. Output EXACTLY these tags:',
      '<reflection>state of the debate; opponent thesis, evidence, strongest point</reflection>',
      '<critique>opponent weaknesses (fallacies, unsupported claims, contradictions) or anticipated counterarguments</critique>',
      '<speech>the {{roundType}} argument, {{wordLimit}} words maximum</speech>',
    ].join('\n'),
    metadata: { tags: ['reflection', 'critique', 'speech'], outputFormat: 'xml-tags' },
  },
  {
    templateId: 'fact-check',
    version: 'v1',
    role: 'fact-checker',
    content: [
      'Stage 1 — claim extraction: extract up to 5 verifiable factual claims from a speech.',
      'Output JSON array of { text, type(statistical|historical|scientific|definitional|general), confidence(0-1) }.',
      'Stage 2 — evidence analysis: given a claim plus web evidence (Tavily -> Firecrawl fallback) and authoritative publisher fact-checks (Google Fact Check Tools), determine the verdict.',
      'Output JSON { verdict(true|false|unverifiable), confidence(0-1), reasoning }. Publisher fact-checks are weighted heavily when present.',
    ].join('\n'),
    metadata: { stages: ['claim-extraction', 'evidence-analysis'], outputFormat: 'json' },
  },
  {
    templateId: 'judge-rubric',
    version: 'v1',
    role: 'judge',
    content: [
      'System: impartial debate judge. Evaluate the transcript against a fixed rubric.',
      'Rubric (0-10 each): logical_coherence, rebuttal_strength, factuality. Flag logical fallacies.',
      'Determine winner (pro|con|tie) with a justification of at least 100 characters.',
      'Output JSON { winner, scores:{logical_coherence, rebuttal_strength, factuality}, justification, flagged_fallacies:[{type, description, location, severity}] }.',
      'Position-bias mitigation: evaluate pro-first and con-first; a tiebreaker resolves disagreement.',
    ].join('\n'),
    metadata: { rubric: ['logical_coherence', 'rebuttal_strength', 'factuality'], outputFormat: 'json', schemaVersion: 'judge-v1' },
  },
  {
    templateId: 'moderator-rules',
    version: 'v1',
    role: 'moderator',
    content: [
      'Rule-based (no LLM). Announces each round ("Round X of Y: {{roundType}}. Topic, word limit, fact-check mode."),',
      'resets per-round state, and enforces turn order (pro speaks first each round).',
      'Turn word-limit and minimum-length enforcement are handled by the fact-checker gate.',
    ].join('\n'),
    metadata: { ruleBased: true },
  },
]

// Version constants referenced by the agents (single source of truth).
const DEBATER_ENTRY = PROMPT_TEMPLATES.find(t => t.templateId === 'debate-rcr')!
const FACT_CHECK_ENTRY = PROMPT_TEMPLATES.find(t => t.templateId === 'fact-check')!
const JUDGE_ENTRY = PROMPT_TEMPLATES.find(t => t.templateId === 'judge-rubric')!

export const DEBATER_PROMPT_VERSION = combinedVersion(DEBATER_ENTRY) // 'debate-rcr-v1'
export const FACT_CHECK_PROMPT_VERSION = combinedVersion(FACT_CHECK_ENTRY) // 'fact-check-v1'
export const JUDGE_PROMPT_VERSION = combinedVersion(JUDGE_ENTRY) // 'judge-rubric-v1'
// Judge output schema version (distinct from the prompt template version).
export const JUDGE_SCHEMA_VERSION = 'judge-v1'

/** Pure: insert values for the prompt_templates table. */
export function buildPromptTemplateRows(): PromptTemplateEntry[] {
  return PROMPT_TEMPLATES.map(entry => ({
    templateId: entry.templateId,
    version: entry.version,
    role: entry.role,
    content: entry.content,
    metadata: entry.metadata ?? undefined,
  }))
}

/**
 * Upsert the registry into prompt_templates. Idempotent: existing (templateId,
 * version) rows are left untouched (bump the version to register a new template).
 */
export async function seedPromptTemplates(): Promise<number> {
  const rows = buildPromptTemplateRows().map(r => ({
    templateId: r.templateId,
    version: r.version,
    role: r.role,
    content: r.content,
    metadata: r.metadata ?? null,
  }))
  await db.insert(promptTemplates).values(rows).onConflictDoNothing()
  return rows.length
}
