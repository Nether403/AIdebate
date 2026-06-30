'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, ShieldCheck, Terminal, Clock, Coins, Hash, ExternalLink } from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import type { DebateTurn, Model, FactCheck } from '@/types'

interface DebateTranscriptProps {
  turns: DebateTurn[]
  proModel: Model
  conModel: Model
  factCheckMode: string
}

interface TurnWithFactChecks extends DebateTurn {
  factChecks?: FactCheck[]
}

export function DebateTranscript({ turns, proModel, conModel, factCheckMode }: DebateTranscriptProps) {
  const [expandedTurns, setExpandedTurns] = useState<Set<string>>(new Set())

  const toggleTurn = (turnId: string) => {
    setExpandedTurns((prev) => {
      const next = new Set(prev)
      if (next.has(turnId)) {
        next.delete(turnId)
      } else {
        next.add(turnId)
      }
      return next
    })
  }

  if (turns.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-white/5">
        <p className="text-slate-400 text-sm font-light">No arguments streamed yet. Graph session initiating...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {turns.map((turn, index) => {
          const model = turn.side === 'pro' ? proModel : conModel
          const isExpanded = expandedTurns.has(turn.id)
          const hasRCR = turn.reflection || turn.critique
          const isPro = turn.side === 'pro'

          return (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`glass-panel rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isPro 
                  ? 'border-cyan-500/20 bg-cyan-950/5 shadow-[0_4px_20px_rgba(6,182,212,0.02)]' 
                  : 'border-pink-500/20 bg-pink-950/5 shadow-[0_4px_20px_rgba(236,72,153,0.02)]'
              }`}
            >
              {/* Subtle top indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                isPro ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-pink-500 to-rose-400'
              }`} />

              {/* Turn Header */}
              <div className="p-4 sm:p-5 border-b border-white/5 bg-slate-950/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
                      isPro 
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                        : 'bg-pink-500/10 border-pink-500/30 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                    }`}>
                      {turn.side}
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base group-hover:text-cyan-300 transition-colors">
                      {model.name}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">Round {turn.roundNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Fact Check Indicators */}
                    {factCheckMode !== 'off' && (
                      <div className="flex items-center gap-1.5">
                        {turn.factChecksPassed > 0 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{turn.factChecksPassed}</span>
                          </span>
                        )}
                        {turn.factChecksFailed > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{turn.factChecksFailed}</span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {turn.wasRejected && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/25 border border-red-500/40 text-red-300 uppercase tracking-widest">
                        Rejected
                      </span>
                    )}
                    <span className="text-slate-400 text-xs font-mono">{turn.wordCount} words</span>
                  </div>
                </div>
              </div>

              {/* RCR Thinking Section (Collapsible Monospace Log) */}
              {hasRCR && (
                <div className="border-b border-white/5">
                  <button
                    onClick={() => toggleTurn(turn.id)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                  >
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isExpanded ? '$ close --rcr-diagnostics' : '$ cat --rcr-diagnostics'}</span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 space-y-4 font-mono bg-slate-950/40 border-t border-white/5">
                          {turn.reflection && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="space-y-1.5"
                            >
                              <h4 className="text-[10px] font-bold text-cyan-400 tracking-wider">
                                &gt;_ REFLECTION_TRACE
                              </h4>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {turn.reflection}
                              </p>
                            </motion.div>
                          )}
                          {turn.critique && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.15 }}
                              className="space-y-1.5"
                            >
                              <h4 className="text-[10px] font-bold text-amber-400 tracking-wider">
                                &gt;_ ADVERSARIAL_CRITIQUE_TRACE
                              </h4>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {turn.critique}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Main Speech Body */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-sm sm:text-base font-light">
                    {turn.speech}
                  </p>
                </div>

                {/* Fact Check Details (Accordion Grid) */}
                {factCheckMode !== 'off' && (turn as TurnWithFactChecks).factChecks && (turn as TurnWithFactChecks).factChecks!.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Annotation logs</h4>
                    <div className="grid gap-2">
                      {(turn as TurnWithFactChecks).factChecks!.map((factCheck) => (
                        <FactCheckBadge key={factCheck.id} factCheck={factCheck} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Turn Telemetry Strip */}
                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-400 font-mono">
                  {turn.tokensUsed && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      <span>{turn.tokensUsed.toLocaleString()} tokens</span>
                    </div>
                  )}
                  {turn.latencyMs && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{(turn.latencyMs / 1000).toFixed(2)}s latency</span>
                    </div>
                  )}
                  {turn.retryCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{turn.retryCount} {turn.retryCount === 1 ? 'retry' : 'retries'}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

interface FactCheckBadgeProps {
  factCheck: FactCheck
}

function FactCheckBadge({ factCheck }: FactCheckBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getVerdictStyle = () => {
    switch (factCheck.verdict) {
      case 'true':
        return {
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          text: 'text-emerald-400',
          icon: <ShieldCheck className="w-4 h-4" />,
          label: 'VERIFIED',
        }
      case 'false':
        return {
          bg: 'bg-red-500/5',
          border: 'border-red-500/20 hover:border-red-500/40',
          text: 'text-red-400',
          icon: <ShieldAlert className="w-4 h-4 animate-pulse" />,
          label: 'FALSE CLAIM',
        }
      default:
        return {
          bg: 'bg-slate-500/5',
          border: 'border-slate-500/20 hover:border-slate-500/40',
          text: 'text-slate-400',
          icon: <HelpCircle className="w-4 h-4" />,
          label: 'UNVERIFIABLE',
        }
    }
  }

  const style = getVerdictStyle()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all duration-300`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={style.text}>{style.icon}</span>
          <span className={`text-[10px] font-bold ${style.text} tracking-wider font-mono`}>
            {style.label}
          </span>
          <span className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md md:max-w-lg">
            "{factCheck.claim}"
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-2"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5 text-xs text-slate-300">
              <div className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">Verifying Evidence reasoning</span>
                <p className="leading-relaxed font-light text-slate-300">{factCheck.reasoning}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="grid gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">Confidence Level</span>
                  <span className="font-mono text-white text-sm">{(factCheck.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {factCheck.sources && Array.isArray(factCheck.sources) && factCheck.sources.length > 0 && (
                <div className="grid gap-1.5 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">Retained Sources</span>
                  <ul className="space-y-1.5">
                    {factCheck.sources.map((source: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-500">{idx + 1}.</span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                        >
                          <span>{source.url.replace(/https?:\/\/(www\.)?/, '').substring(0, 45)}...</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}



