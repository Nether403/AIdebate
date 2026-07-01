'use client'

import { useState } from 'react'
import { DebateTranscript, VotingInterface, ProbabilityGraph } from '@/components/debate'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DebateTurn, Model, FactCheck } from '@/types'

// Mock data for demonstration
const mockProModel: Model = {
  id: '1',
  name: 'GPT-5.1',
  provider: 'openai',
  modelId: 'gpt-5.1',
  isActive: true,
  crowdRating: 1650,
  crowdRatingDeviation: 150,
  aiQualityRating: 1700,
  aiQualityRatingDeviation: 140,
  aiQualityVolatility: 0.06,
  totalDebates: 50,
  wins: 30,
  losses: 15,
  ties: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockConModel: Model = {
  id: '2',
  name: 'Claude 4.5',
  provider: 'anthropic',
  modelId: 'claude-4.5-sonnet',
  isActive: true,
  crowdRating: 1620,
  crowdRatingDeviation: 155,
  aiQualityRating: 1680,
  aiQualityRatingDeviation: 145,
  aiQualityVolatility: 0.06,
  totalDebates: 45,
  wins: 25,
  losses: 15,
  ties: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockFactCheck: FactCheck = {
  id: '1',
  debateTurnId: '1',
  claim: 'AI systems have reduced energy consumption by 30% in data centers',
  verdict: 'true',
  confidence: 0.85,
  sources: [
    { url: 'https://example.com/source1', snippet: 'Study shows 30% reduction...' },
    { url: 'https://example.com/source2', snippet: 'Data centers report efficiency gains...' },
  ],
  reasoning: 'Multiple credible sources confirm this statistic from recent studies.',
  createdAt: new Date(),
}

const mockTurns: (DebateTurn & { factChecks?: FactCheck[] })[] = [
  {
    id: '1',
    debateId: 'example',
    roundNumber: 1,
    side: 'pro',
    modelId: '1',
    reflection: 'The opponent will likely argue that AI poses existential risks. I need to acknowledge these concerns while emphasizing the transformative benefits and our ability to manage risks through proper governance.',
    critique: 'Their argument may rely on speculative scenarios rather than current evidence. I should focus on concrete examples of AI benefits and existing safety measures.',
    speech: 'Ladies and gentlemen, we stand at the threshold of a technological revolution that promises to solve humanity\'s greatest challenges. Artificial Intelligence is not just a tool—it\'s a catalyst for unprecedented progress in healthcare, climate science, and education.\n\nConsider healthcare: AI systems are already detecting diseases earlier and more accurately than human doctors. In radiology, AI can identify cancerous tumors with 95% accuracy, potentially saving millions of lives. In drug discovery, AI has reduced development time from years to months.\n\nRegarding safety concerns, we have robust frameworks emerging. The EU AI Act, voluntary commitments from major tech companies, and active research into AI alignment show we\'re taking responsible development seriously. We\'re not blindly rushing forward—we\'re building guardrails as we go.\n\nThe question isn\'t whether AI will transform society—it already is. The question is whether we embrace this transformation and guide it toward human flourishing, or whether we let fear paralyze us while other nations race ahead.',
    wordCount: 165,
    factChecksPassed: 2,
    factChecksFailed: 0,
    wasRejected: false,
    retryCount: 0,
    tokensUsed: 450,
    latencyMs: 3200,
    createdAt: new Date(),
    factChecks: [mockFactCheck],
  },
  {
    id: '2',
    debateId: 'example',
    roundNumber: 1,
    side: 'con',
    modelId: '2',
    reflection: 'My opponent makes compelling points about AI benefits, but they\'re downplaying the risks. I need to acknowledge the benefits while emphasizing that the pace of development outstrips our ability to ensure safety.',
    critique: 'They cite healthcare benefits but ignore the concentration of power, job displacement, and the fundamental alignment problem. Their mention of "guardrails" is vague—what specific mechanisms prevent misuse?',
    speech: 'My opponent paints an optimistic picture, but let\'s examine what they\'re not telling you. Yes, AI has benefits—but at what cost?\n\nFirst, the alignment problem: We don\'t know how to ensure advanced AI systems reliably do what we want. Leading AI researchers, including Geoffrey Hinton and Yoshua Bengio, have warned that we\'re creating systems we don\'t fully understand. That\'s not fear-mongering—that\'s scientific consensus.\n\nSecond, the concentration of power: AI development is dominated by a handful of corporations with minimal oversight. These companies are racing to deploy increasingly powerful systems, prioritizing speed over safety. The "voluntary commitments" my opponent mentioned? They\'re non-binding and unenforceable.\n\nThird, societal disruption: AI is already displacing workers faster than we can retrain them. The benefits accrue to tech companies and their shareholders, while the costs—unemployment, inequality, social instability—are borne by everyone else.\n\nWe need to slow down, establish real regulatory frameworks, and ensure AI development serves humanity—not just Silicon Valley\'s bottom line.',
    wordCount: 178,
    factChecksPassed: 1,
    factChecksFailed: 0,
    wasRejected: false,
    retryCount: 0,
    tokensUsed: 520,
    latencyMs: 3800,
    createdAt: new Date(),
  },
]

export default function ExampleDebatePage() {
  const [showVoting, setShowVoting] = useState(false)

  useTopBar({
    breadcrumb: [{ label: 'Benchmark runs', href: '/debate/new' }, { label: 'Example' }],
    contextPill: 'illustrative',
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Page heading + honesty labels */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Sample / demo data</Badge>
          <Badge tone="accent">Model-based signal · not ground truth</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Example debate</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A demonstration of the debate viewer components rendered with illustrative mock data.
        </p>
      </div>

      {/* Debate header */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          AI development should be accelerated rather than slowed down
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Pro position</p>
            <p className="font-medium text-foreground">{mockProModel.name}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Con position</p>
            <p className="font-medium text-foreground">{mockConModel.name}</p>
          </div>
        </div>
      </Card>

      {/* Probability graph */}
      <div className="mb-6">
        <ProbabilityGraph
          turns={mockTurns}
          proModel={mockProModel}
          conModel={mockConModel}
          currentOdds={{ pro: 52, con: 48, tie: 0 }}
        />
      </div>

      {/* Debate transcript */}
      <div className="mb-6">
        <DebateTranscript
          turns={mockTurns}
          proModel={mockProModel}
          conModel={mockConModel}
          factCheckMode="standard"
        />
      </div>

      {/* Voting interface */}
      {!showVoting ? (
        <Button onClick={() => setShowVoting(true)} className="min-h-11 w-full">
          Show voting interface
        </Button>
      ) : (
        <VotingInterface
          debateId="example"
          proModel={mockProModel}
          conModel={mockConModel}
          onVoteSubmitted={() => alert('Vote submitted! (This is a demo)')}
        />
      )}
    </div>
  )
}
