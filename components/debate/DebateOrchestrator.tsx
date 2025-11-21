'use client'

import { useState, useEffect } from 'react'
import { DebateTranscript } from './DebateTranscript'
import type { Debate, DebateTurn, Model, Topic, Persona } from '@/types'

interface DebateOrchestratorProps {
  debateId: string
}

interface DebateData extends Debate {
  topic: Topic
  proModel: Model
  conModel: Model
  proPersona: Persona | null
  conPersona: Persona | null
  turns: DebateTurn[]
}

export function DebateOrchestrator({ debateId }: DebateOrchestratorProps) {
  const [debate, setDebate] = useState<DebateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    fetchDebate()
  }, [debateId])

  const fetchDebate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debate/${debateId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch debate')
      }

      const data = await response.json()
      setDebate(data)
      
      // If debate is in progress, start streaming
      if (data.status === 'in_progress') {
        startStreaming()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const startStreaming = () => {
    setIsStreaming(true)
    const eventSource = new EventSource(`/api/debate/stream/${debateId}`)

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data)
      
      if (update.type === 'turn') {
        setDebate((prev) => {
          if (!prev) return null
          return {
            ...prev,
            turns: [...prev.turns, update.turn],
            currentRound: update.turn.roundNumber,
          }
        })
      } else if (update.type === 'status') {
        setDebate((prev) => {
          if (!prev) return null
          return {
            ...prev,
            status: update.status,
            winner: update.winner,
            completedAt: update.completedAt,
          }
        })
        
        if (update.status === 'completed' || update.status === 'failed') {
          eventSource.close()
          setIsStreaming(false)
        }
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsStreaming(false)
    }

    return () => {
      eventSource.close()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading debate...</p>
        </div>
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-400">Error: {error || 'Debate not found'}</p>
          <button
            onClick={fetchDebate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Debate Header */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {debate.topic.motion}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              debate.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              debate.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              debate.status === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {debate.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Pro Position</p>
              <p className="text-white font-medium">{debate.proModel.name}</p>
              {debate.proPersona && (
                <p className="text-slate-400 text-xs mt-1">
                  as {debate.proPersona.name}
                </p>
              )}
            </div>
            <div>
              <p className="text-slate-400 mb-1">Con Position</p>
              <p className="text-white font-medium">{debate.conModel.name}</p>
              {debate.conPersona && (
                <p className="text-slate-400 text-xs mt-1">
                  as {debate.conPersona.name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <span>Round {debate.currentRound} of {debate.totalRounds}</span>
            <span>•</span>
            <span>Category: {debate.topic.category}</span>
            <span>•</span>
            <span>Difficulty: {debate.topic.difficulty}</span>
            {debate.factCheckMode !== 'off' && (
              <>
                <span>•</span>
                <span className="text-blue-400">
                  Fact-checking: {debate.factCheckMode}
                </span>
              </>
            )}
          </div>

          {isStreaming && (
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
              <div className="animate-pulse h-2 w-2 bg-blue-400 rounded-full"></div>
              <span>Live debate in progress...</span>
            </div>
          )}
        </div>

        {/* Debate Transcript */}
        <DebateTranscript
          turns={debate.turns}
          proModel={debate.proModel}
          conModel={debate.conModel}
          factCheckMode={debate.factCheckMode}
        />

        {/* Winner Display */}
        {debate.status === 'completed' && debate.winner && (
          <div className="bg-slate-800 rounded-lg p-6 mt-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Debate Result</h2>
            <div className="grid grid-cols-2 gap-4">
              {debate.aiJudgeWinner && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">AI Judge Winner</p>
                  <p className="text-white font-medium">
                    {debate.aiJudgeWinner === 'pro' ? debate.proModel.name :
                     debate.aiJudgeWinner === 'con' ? debate.conModel.name :
                     'Tie'}
                  </p>
                </div>
              )}
              {debate.crowdWinner && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Crowd Winner</p>
                  <p className="text-white font-medium">
                    {debate.crowdWinner === 'pro' ? debate.proModel.name :
                     debate.crowdWinner === 'con' ? debate.conModel.name :
                     'Tie'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Pro: {debate.crowdVotesProCount} | Con: {debate.crowdVotesConCount} | Tie: {debate.crowdVotesTieCount}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
