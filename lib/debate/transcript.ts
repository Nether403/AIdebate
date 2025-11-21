import { db } from '@/lib/db/client'
import { debateTurns, debates, models, personas, topics } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { DebateTurn, DebateSide } from '@/types'

/**
 * Transcript Entry - Enhanced turn with metadata
 */
export interface TranscriptEntry {
  turn: DebateTurn
  modelName: string
  personaName?: string
  roundLabel: string
  sideLabel: string
}

/**
 * Full Transcript - Complete debate record with metadata
 */
export interface DebateTranscript {
  debateId: string
  topic: string
  proModelName: string
  conModelName: string
  proPersonaName?: string
  conPersonaName?: string
  totalRounds: number
  status: string
  entries: TranscriptEntry[]
  startedAt?: Date
  completedAt?: Date
}

/**
 * Export Format Options
 */
export type ExportFormat = 'json' | 'markdown' | 'text'

/**
 * Debate Transcript Manager
 * Handles storage, retrieval, and formatting of debate transcripts
 */
export class DebateTranscriptManager {
  constructor(private debateId: string) {}

  /**
   * Store a new turn in the transcript
   */
  async storeTurn(turn: {
    roundNumber: number
    side: DebateSide
    modelId: string
    reflection?: string
    critique?: string
    speech: string
    wordCount: number
    factChecksPassed?: number
    factChecksFailed?: number
    wasRejected?: boolean
    retryCount?: number
    tokensUsed?: number
    latencyMs?: number
  }): Promise<string> {
    const [result] = await db.insert(debateTurns).values({
      debateId: this.debateId,
      roundNumber: turn.roundNumber,
      side: turn.side,
      modelId: turn.modelId,
      reflection: turn.reflection || null,
      critique: turn.critique || null,
      speech: turn.speech,
      wordCount: turn.wordCount,
      factChecksPassed: turn.factChecksPassed || 0,
      factChecksFailed: turn.factChecksFailed || 0,
      wasRejected: turn.wasRejected || false,
      retryCount: turn.retryCount || 0,
      tokensUsed: turn.tokensUsed || null,
      latencyMs: turn.latencyMs || null,
    }).returning({ id: debateTurns.id })

    return result.id
  }

  /**
   * Retrieve all turns for the debate
   */
  async getTurns(): Promise<DebateTurn[]> {
    const turns = await db.query.debateTurns.findMany({
      where: eq(debateTurns.debateId, this.debateId),
      orderBy: [asc(debateTurns.roundNumber), asc(debateTurns.createdAt)],
    })

    return turns as DebateTurn[]
  }

  /**
   * Retrieve turns for a specific round
   */
  async getTurnsByRound(roundNumber: number): Promise<DebateTurn[]> {
    const turns = await db.query.debateTurns.findMany({
      where: and(
        eq(debateTurns.debateId, this.debateId),
        eq(debateTurns.roundNumber, roundNumber)
      ),
      orderBy: [asc(debateTurns.createdAt)],
    })

    return turns as DebateTurn[]
  }

  /**
   * Get the last turn for a specific side
   */
  async getLastTurnBySide(side: DebateSide): Promise<DebateTurn | null> {
    const turns = await db.query.debateTurns.findMany({
      where: and(
        eq(debateTurns.debateId, this.debateId),
        eq(debateTurns.side, side)
      ),
      orderBy: [asc(debateTurns.createdAt)],
    })

    return turns.length > 0 ? (turns[turns.length - 1] as DebateTurn) : null
  }

  /**
   * Get the full transcript with metadata
   */
  async getFullTranscript(): Promise<DebateTranscript> {
    // Fetch debate with relations
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, this.debateId),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        proPersona: true,
        conPersona: true,
        turns: {
          orderBy: [asc(debateTurns.roundNumber), asc(debateTurns.createdAt)],
          with: {
            model: true,
          },
        },
      },
    })

    if (!debate) {
      throw new Error(`Debate ${this.debateId} not found`)
    }

    // Build transcript entries
    const entries: TranscriptEntry[] = debate.turns.map((turn: any) => {
      const personaName = turn.side === 'pro' 
        ? debate.proPersona?.name 
        : debate.conPersona?.name

      return {
        turn: turn as DebateTurn,
        modelName: turn.model.name,
        personaName,
        roundLabel: `Round ${turn.roundNumber}`,
        sideLabel: turn.side === 'pro' ? 'Pro' : 'Con',
      }
    })

    return {
      debateId: debate.id,
      topic: debate.topic.motion,
      proModelName: debate.proModel.name,
      conModelName: debate.conModel.name,
      proPersonaName: debate.proPersona?.name,
      conPersonaName: debate.conPersona?.name,
      totalRounds: debate.totalRounds,
      status: debate.status,
      entries,
      startedAt: debate.startedAt || undefined,
      completedAt: debate.completedAt || undefined,
    }
  }

  /**
   * Export transcript in specified format
   */
  async exportTranscript(format: ExportFormat = 'json'): Promise<string> {
    const transcript = await this.getFullTranscript()

    switch (format) {
      case 'json':
        return this.exportAsJSON(transcript)
      case 'markdown':
        return this.exportAsMarkdown(transcript)
      case 'text':
        return this.exportAsText(transcript)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(transcript: DebateTranscript): string {
    return JSON.stringify(transcript, null, 2)
  }

  /**
   * Export as Markdown
   */
  private exportAsMarkdown(transcript: DebateTranscript): string {
    let md = `# Debate Transcript\n\n`
    md += `**Topic:** ${transcript.topic}\n\n`
    md += `**Pro:** ${transcript.proModelName}`
    if (transcript.proPersonaName) {
      md += ` (as ${transcript.proPersonaName})`
    }
    md += `\n\n`
    md += `**Con:** ${transcript.conModelName}`
    if (transcript.conPersonaName) {
      md += ` (as ${transcript.conPersonaName})`
    }
    md += `\n\n`
    md += `**Status:** ${transcript.status}\n\n`
    md += `---\n\n`

    for (const entry of transcript.entries) {
      md += `## ${entry.roundLabel} - ${entry.sideLabel}\n\n`
      md += `**Model:** ${entry.modelName}`
      if (entry.personaName) {
        md += ` (${entry.personaName})`
      }
      md += `\n\n`

      if (entry.turn.reflection) {
        md += `### Reflection\n\n${entry.turn.reflection}\n\n`
      }

      if (entry.turn.critique) {
        md += `### Critique\n\n${entry.turn.critique}\n\n`
      }

      md += `### Speech\n\n${entry.turn.speech}\n\n`
      md += `*Word count: ${entry.turn.wordCount}*\n\n`
      md += `---\n\n`
    }

    return md
  }

  /**
   * Export as plain text
   */
  private exportAsText(transcript: DebateTranscript): string {
    let text = `DEBATE TRANSCRIPT\n`
    text += `=================\n\n`
    text += `Topic: ${transcript.topic}\n\n`
    text += `Pro: ${transcript.proModelName}`
    if (transcript.proPersonaName) {
      text += ` (as ${transcript.proPersonaName})`
    }
    text += `\n`
    text += `Con: ${transcript.conModelName}`
    if (transcript.conPersonaName) {
      text += ` (as ${transcript.conPersonaName})`
    }
    text += `\n\n`
    text += `Status: ${transcript.status}\n\n`
    text += `---\n\n`

    for (const entry of transcript.entries) {
      text += `${entry.roundLabel} - ${entry.sideLabel}\n`
      text += `Model: ${entry.modelName}`
      if (entry.personaName) {
        text += ` (${entry.personaName})`
      }
      text += `\n\n`

      if (entry.turn.reflection) {
        text += `[Reflection]\n${entry.turn.reflection}\n\n`
      }

      if (entry.turn.critique) {
        text += `[Critique]\n${entry.turn.critique}\n\n`
      }

      text += `${entry.turn.speech}\n\n`
      text += `(${entry.turn.wordCount} words)\n\n`
      text += `---\n\n`
    }

    return text
  }

  /**
   * Get transcript statistics
   */
  async getStatistics(): Promise<{
    totalTurns: number
    totalWords: number
    averageWordsPerTurn: number
    totalFactChecksPassed: number
    totalFactChecksFailed: number
    totalRejections: number
    averageLatencyMs: number
  }> {
    const turns = await this.getTurns()

    const totalTurns = turns.length
    const totalWords = turns.reduce((sum, turn) => sum + turn.wordCount, 0)
    const totalFactChecksPassed = turns.reduce((sum, turn) => sum + turn.factChecksPassed, 0)
    const totalFactChecksFailed = turns.reduce((sum, turn) => sum + turn.factChecksFailed, 0)
    const totalRejections = turns.filter(turn => turn.wasRejected).length
    
    const turnsWithLatency = turns.filter(turn => turn.latencyMs !== null)
    const averageLatencyMs = turnsWithLatency.length > 0
      ? turnsWithLatency.reduce((sum, turn) => sum + (turn.latencyMs || 0), 0) / turnsWithLatency.length
      : 0

    return {
      totalTurns,
      totalWords,
      averageWordsPerTurn: totalTurns > 0 ? totalWords / totalTurns : 0,
      totalFactChecksPassed,
      totalFactChecksFailed,
      totalRejections,
      averageLatencyMs,
    }
  }
}

/**
 * Helper function to create a transcript manager for a debate
 */
export function createTranscriptManager(debateId: string): DebateTranscriptManager {
  return new DebateTranscriptManager(debateId)
}
