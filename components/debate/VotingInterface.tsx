'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import type { Model } from '@/types'

interface VotingInterfaceProps {
  debateId: string
  proModel: Model
  conModel: Model
  onVoteSubmitted?: () => void
}

export function VotingInterface({ debateId, proModel, conModel, onVoteSubmitted }: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<'a' | 'b' | 'tie' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [revealedIdentities, setRevealedIdentities] = useState(false)

  // Randomly assign which model is A and which is B
  const [modelAssignment] = useState(() => {
    const random = Math.random() > 0.5
    return {
      a: random ? proModel : conModel,
      b: random ? conModel : proModel,
      aIsPro: random,
    }
  })

  const handleVote = async (vote: 'a' | 'b' | 'tie') => {
    setSelectedVote(vote)
  }

  const handleSubmit = async () => {
    if (!selectedVote) return

    try {
      setIsSubmitting(true)

      // Convert A/B vote to pro/con based on assignment
      const actualVote = 
        selectedVote === 'tie' ? 'tie' :
        selectedVote === 'a' ? (modelAssignment.aIsPro ? 'pro' : 'con') :
        modelAssignment.aIsPro ? 'con' : 'pro'

      const response = await fetch('/api/debate/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debateId,
          vote: actualVote,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit vote')
      }

      setHasVoted(true)
      setRevealedIdentities(true)
      onVoteSubmitted?.()
    } catch (error) {
      console.error('Failed to submit vote:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasVoted && revealedIdentities) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Vote Submitted!</h3>
          <p className="text-slate-300">Thank you for participating in the evaluation.</p>
          
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-lg font-semibold text-white mb-4">Model Identities Revealed</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Model A</p>
                <p className="text-white font-medium">{modelAssignment.a.name}</p>
                <p className="text-xs text-slate-400 mt-1">{modelAssignment.a.provider}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Model B</p>
                <p className="text-white font-medium">{modelAssignment.b.name}</p>
                <p className="text-xs text-slate-400 mt-1">{modelAssignment.b.provider}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                Your vote: <span className="font-medium">
                  {selectedVote === 'tie' ? 'Tie' : 
                   selectedVote === 'a' ? `Model A (${modelAssignment.a.name})` :
                   `Model B (${modelAssignment.b.name})`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Cast Your Vote</h3>
        <p className="text-slate-400 text-sm">
          Which model presented the stronger argument? Model identities will be revealed after you vote.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Model A Button */}
        <button
          onClick={() => handleVote('a')}
          disabled={isSubmitting}
          className={`p-6 rounded-lg border-2 transition-all ${
            selectedVote === 'a'
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">A</div>
            <div className="text-sm text-slate-400">Model A</div>
            {selectedVote === 'a' && (
              <CheckCircle className="w-5 h-5 text-blue-400 mx-auto mt-2" />
            )}
          </div>
        </button>

        {/* Tie Button */}
        <button
          onClick={() => handleVote('tie')}
          disabled={isSubmitting}
          className={`p-6 rounded-lg border-2 transition-all ${
            selectedVote === 'tie'
              ? 'border-yellow-500 bg-yellow-500/20'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">=</div>
            <div className="text-sm text-slate-400">Tie</div>
            {selectedVote === 'tie' && (
              <CheckCircle className="w-5 h-5 text-yellow-400 mx-auto mt-2" />
            )}
          </div>
        </button>

        {/* Model B Button */}
        <button
          onClick={() => handleVote('b')}
          disabled={isSubmitting}
          className={`p-6 rounded-lg border-2 transition-all ${
            selectedVote === 'b'
              ? 'border-red-500 bg-red-500/20'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">B</div>
            <div className="text-sm text-slate-400">Model B</div>
            {selectedVote === 'b' && (
              <CheckCircle className="w-5 h-5 text-red-400 mx-auto mt-2" />
            )}
          </div>
        </button>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedVote || isSubmitting}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Vote'}
      </button>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-400 text-center">
          🔒 Anonymous voting prevents brand bias. Model identities are hidden until after you vote.
        </p>
      </div>
    </div>
  )
}
