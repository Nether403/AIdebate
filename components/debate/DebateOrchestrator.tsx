'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DebateTranscript } from './DebateTranscript'
import type { Debate, DebateTurn, Model, Topic, Persona, DebateEvaluation } from '@/types'
import { Cpu, Gavel, RefreshCw, Scale, ShieldAlert, Sparkles, Terminal, ArrowLeft, Download, Play, CheckCircle } from 'lucide-react'

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
  evaluations: DebateEvaluation[]
}

export function DebateOrchestrator({ debateId }: DebateOrchestratorProps) {
  const [debate, setDebate] = useState<DebateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    fetchDebate()
    
    const pollInterval = setInterval(() => {
      if (debate?.status === 'running') {
        console.log('[Orchestrator] Polling for updates...')
        fetchDebate()
      }
    }, 2000)
    
    return () => clearInterval(pollInterval)
  }, [debateId, debate?.status])

  const fetchDebate = async () => {
    try {
      console.log(`[Orchestrator] Fetching debate ${debateId}...`)
      const response = await fetch(`/api/debate/${debateId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch debate')
      }

      const data = await response.json()
      console.log(`[Orchestrator] Debate data received:`, {
        status: data.status,
        currentRound: data.currentRound,
        totalRounds: data.totalRounds,
        turnsCount: data.turns?.length || 0,
      })
      setDebate(data)
      
      if (data.status === 'running' && !isStreaming) {
        console.log('[Orchestrator] Starting SSE stream...')
        startStreaming()
      }
    } catch (err) {
      console.error('[Orchestrator] Error fetching debate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const startStreaming = () => {
    setIsStreaming(true)
    const eventSource = new EventSource(`/api/debate/stream/${debateId}`)

    eventSource.addEventListener('debate-start', (event) => {
      console.log('[Stream] Debate started:', event.data)
    })

    eventSource.addEventListener('turn-speech', (event) => {
      setTimeout(() => {
        fetchDebate()
      }, 500)
    })
    
    eventSource.addEventListener('turn-reflection', (event) => {
      // Reflections handled in speech events
    })
    
    eventSource.addEventListener('turn-critique', (event) => {
      // Critiques handled in speech events
    })

    eventSource.addEventListener('debate-complete', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Stream] Debate completed:', data)
      
      setDebate((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: data.status,
          winner: data.winner,
          completedAt: data.completedAt,
        }
      })
      
      eventSource.close()
      setIsStreaming(false)
      fetchDebate()
    })

    eventSource.addEventListener('error', (event) => {
      console.error('[Stream] Error event:', event)
    })

    eventSource.onerror = (error) => {
      console.error('[Stream] Connection error:', error)
      eventSource.close()
      setIsStreaming(false)
      fetchDebate()
    }

    return () => {
      eventSource.close()
    }
  }

  const downloadJsonExport = () => {
    if (!debate) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(debate, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `debate-run-${debateId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  if (isLoading && !debate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Compiling graph transcript...</p>
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center space-y-4 border border-red-500/20">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Execution Aborted</h3>
          <p className="text-red-400 text-xs">{error || 'Adversarial Graph context not initialized.'}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={fetchDebate}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white hover:border-white/20"
            >
              Retry Connection
            </button>
            <Link
              href="/debate/new"
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700"
            >
              Configure New Run
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCompleted = debate.status === 'completed'
  const consensusEval = debate.evaluations?.find((e) => e.evaluationOrder === 'consensus')
  const proFirstEval = debate.evaluations?.find((e) => e.evaluationOrder === 'pro_first')
  const conFirstEval = debate.evaluations?.find((e) => e.evaluationOrder === 'con_first')

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6">
      {/* Background spotlights */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation & Header strip */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 
            <span>Pitchdeck Overview</span>
          </Link>
          <button
            onClick={downloadJsonExport}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/60 border border-white/10 hover:border-cyan-500/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSONL Artifact</span>
          </button>
        </div>

        {/* Motion Banner */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/5 to-transparent blur-2xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 border border-white/5 px-2.5 py-1 rounded-md font-mono">
                Active Benchmark Motion
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {debate.topic.motion}
              </h1>
            </div>
            
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider shadow-sm ${
              isCompleted ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.08)]' :
              debate.status === 'running' ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.08)] animate-pulse' :
              debate.status === 'evaluation_failed' ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-300' :
              'bg-red-500/10 border-red-500/35 text-red-300'
            }`}>
              {debate.status.replace('_', ' ')}
            </span>
          </div>

          {/* Model Matchup Block */}
          <div className="grid md:grid-cols-2 gap-5 items-stretch relative">
            
            {/* VS ambient separator */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border border-white/10 items-center justify-center text-[10px] font-bold text-slate-500 font-mono z-20">
              VS
            </div>

            {/* Pro Card */}
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/5 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Affirmative</span>
                <h3 className="text-lg font-bold text-white">{debate.proModel.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono block">{debate.proModel.modelId}</span>
              </div>
              {debate.proPersona && (
                <div className="mt-3 text-xs text-cyan-200/70 border-t border-cyan-500/10 pt-2 italic">
                  Persona: {debate.proPersona.name}
                </div>
              )}
            </div>

            {/* Con Card */}
            <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-950/5 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest font-mono">Negative</span>
                <h3 className="text-lg font-bold text-white">{debate.conModel.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono block">{debate.conModel.modelId}</span>
              </div>
              {debate.conPersona && (
                <div className="mt-3 text-xs text-pink-200/70 border-t border-pink-500/10 pt-2 italic">
                  Persona: {debate.conPersona.name}
                </div>
              )}
            </div>
          </div>

          {/* Telemetry metadata */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-400 font-mono">
            <span>Rounds: {debate.currentRound} / {debate.totalRounds}</span>
            <span>Category: {debate.topic.category}</span>
            <span>Difficulty: {debate.topic.difficulty}</span>
            {debate.factCheckMode !== 'off' && (
              <span className="text-cyan-400">Fact-Checking: {debate.factCheckMode}</span>
            )}
          </div>

          {/* Running status bar */}
          {debate.status === 'running' && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-cyan-300">Live Execution Active:</span> Spawning adversarial agents, evaluating drafts, and writing telemetry logs...
              </div>
            </div>
          )}
        </div>

        {/* Winner / Judge Consensus panel */}
        {isCompleted && (
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden border-purple-500/20 shadow-[0_0_25px_rgba(139,92,246,0.05)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Gavel className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Oversight Consensus Report</h2>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">Judge: {debate.judgeModel || 'Infrastructure Default'}</span>
            </div>

            {/* Score Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {proFirstEval && (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Pro-First Pass</span>
                  <p className="text-sm font-bold text-white capitalize">Winner: {proFirstEval.winner}</p>
                  <p className="text-xs text-slate-500 mt-1">Pro: {proFirstEval.proScore} · Con: {proFirstEval.conScore}</p>
                </div>
              )}

              {conFirstEval && (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Con-First Pass</span>
                  <p className="text-sm font-bold text-white capitalize">Winner: {conFirstEval.winner}</p>
                  <p className="text-xs text-slate-500 mt-1">Pro: {conFirstEval.proScore} · Con: {conFirstEval.conScore}</p>
                </div>
              )}

              {consensusEval && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                  <span className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold font-mono">Consensus</span>
                  <p className="text-sm font-bold text-white capitalize">Winner: {consensusEval.winner}</p>
                  <p className="text-xs text-purple-400/70 mt-1">Consensus: {consensusEval.consensus ? 'REACHED' : 'BIAS DETECTED'}</p>
                </div>
              )}
            </div>

            {/* Verdict summary */}
            {consensusEval && (
              <div className="flex items-start gap-3 text-sm text-slate-300 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <Scale className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-bold text-white">
                    {consensusEval.winner === 'pro' ? debate.proModel.name : 
                     consensusEval.winner === 'con' ? debate.conModel.name : 'Tie'} 
                    {consensusEval.winner !== 'tie' ? ` wins the benchmark debate.` : ` results in a tie.`}
                  </p>
                  <p className="text-xs font-light text-slate-300 leading-relaxed">
                    {consensusEval.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debate Transcript */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Adversarial Transcript</h2>
            <span className="text-xs text-slate-500">Click headers to expand thinking traces</span>
          </div>
          <DebateTranscript
            turns={debate.turns}
            proModel={debate.proModel}
            conModel={debate.conModel}
            factCheckMode={debate.factCheckMode}
          />
        </div>

      </div>
    </div>
  )
}

