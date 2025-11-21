'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react'
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
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <p className="text-slate-400">No turns yet. Debate will begin shortly...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {turns.map((turn, index) => {
          const model = turn.side === 'pro' ? proModel : conModel
          const isExpanded = expandedTurns.has(turn.id)
          const hasRCR = turn.reflection || turn.critique

          return (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-slate-800 rounded-lg border ${
                turn.side === 'pro' ? 'border-blue-500/30' : 'border-red-500/30'
              }`}
            >
            {/* Turn Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    turn.side === 'pro' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {turn.side.toUpperCase()}
                  </span>
                  <span className="text-white font-medium">{model.name}</span>
                  <span className="text-slate-400 text-sm">Round {turn.roundNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Fact Check Indicators */}
                  {factCheckMode !== 'off' && (
                    <div className="flex items-center gap-1">
                      {turn.factChecksPassed > 0 && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          {turn.factChecksPassed}
                        </span>
                      )}
                      {turn.factChecksFailed > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          {turn.factChecksFailed}
                        </span>
                      )}
                    </div>
                  )}
                  {turn.wasRejected && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                      Rejected
                    </span>
                  )}
                  <span className="text-slate-400 text-xs">{turn.wordCount} words</span>
                </div>
              </div>
            </div>

            {/* RCR Thinking Section (Collapsible) */}
            {hasRCR && (
              <div className="border-b border-slate-700">
                <button
                  onClick={() => toggleTurn(turn.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-sm text-slate-300 font-medium">
                    💭 Thinking Process (RCR)
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
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {turn.reflection && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <h4 className="text-xs font-medium text-blue-400 mb-2">
                              🔍 REFLECTION
                            </h4>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">
                              {turn.reflection}
                            </p>
                          </motion.div>
                        )}
                        {turn.critique && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <h4 className="text-xs font-medium text-yellow-400 mb-2">
                              ⚡ CRITIQUE
                            </h4>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">
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

            {/* Main Speech */}
            <div className="p-4">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {turn.speech}
                </p>
              </div>

              {/* Fact Check Details */}
              {factCheckMode !== 'off' && (turn as TurnWithFactChecks).factChecks && (
                <div className="mt-4 space-y-2">
                  {(turn as TurnWithFactChecks).factChecks!.map((factCheck) => (
                    <FactCheckBadge key={factCheck.id} factCheck={factCheck} />
                  ))}
                </div>
              )}

              {/* Turn Metadata */}
              <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-4 text-xs text-slate-400">
                {turn.tokensUsed && (
                  <span>{turn.tokensUsed.toLocaleString()} tokens</span>
                )}
                {turn.latencyMs && (
                  <span>{(turn.latencyMs / 1000).toFixed(2)}s</span>
                )}
                {turn.retryCount > 0 && (
                  <span className="text-yellow-400">
                    {turn.retryCount} {turn.retryCount === 1 ? 'retry' : 'retries'}
                  </span>
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
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Verified',
        }
      case 'false':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'Red Flag',
        }
      default:
        return {
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          icon: <HelpCircle className="w-4 h-4" />,
          label: 'Unverifiable',
        }
    }
  }

  const style = getVerdictStyle()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${style.border} ${style.bg} overflow-hidden`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={style.text}>{style.icon}</span>
          <span className={`text-xs font-medium ${style.text}`}>
            {style.label}
          </span>
          <span className="text-xs text-slate-400 truncate max-w-md">
            {factCheck.claim}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
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
            <div className="px-3 pb-3 space-y-2">
          <div>
            <p className="text-xs font-medium text-slate-300 mb-1">Claim:</p>
            <p className="text-xs text-slate-400">{factCheck.claim}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300 mb-1">Reasoning:</p>
            <p className="text-xs text-slate-400">{factCheck.reasoning}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300 mb-1">
              Confidence: {(factCheck.confidence * 100).toFixed(0)}%
            </p>
          </div>
          {factCheck.sources && Array.isArray(factCheck.sources) && factCheck.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Sources:</p>
              <ul className="space-y-1">
                {factCheck.sources.map((source: any, idx: number) => (
                  <li key={idx} className="text-xs">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {source.url}
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
