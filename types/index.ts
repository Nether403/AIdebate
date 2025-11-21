// Type definitions for the AI Debate Arena platform

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'openrouter'

export type DebateStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type FactCheckMode = 'standard' | 'strict' | 'off'

export type DebateWinner = 'pro' | 'con' | 'tie' | null

export type FactCheckVerdict = 'true' | 'false' | 'unverifiable'

export type RatingType = 'crowd' | 'ai_quality'

export type TopicCategory = 
  | 'technology' 
  | 'ethics' 
  | 'politics' 
  | 'science' 
  | 'education' 
  | 'economics' 
  | 'health' 
  | 'environment' 
  | 'culture' 
  | 'philosophy'

export type TopicDifficulty = 'easy' | 'medium' | 'hard'

export type DebateSide = 'pro' | 'con'

export type EvaluationOrder = 'pro_first' | 'con_first'

// Model interface
export interface Model {
  id: string
  name: string
  provider: ModelProvider
  modelId: string
  isActive: boolean
  crowdRating: number
  crowdRatingDeviation: number
  aiQualityRating: number
  aiQualityRatingDeviation: number
  aiQualityVolatility: number
  totalDebates: number
  wins: number
  losses: number
  ties: number
  createdAt: Date
  updatedAt: Date
}

// Topic interface
export interface Topic {
  id: string
  motion: string
  category: TopicCategory
  difficulty: TopicDifficulty
  isActive: boolean
  usageCount: number
  createdAt: Date
}

// Persona interface
export interface Persona {
  id: string
  name: string
  description: string
  systemPrompt: string
  isActive: boolean
  usageCount: number
  createdAt: Date
}

// Debate interface
export interface Debate {
  id: string
  topicId: string
  proModelId: string
  conModelId: string
  proPersonaId: string | null
  conPersonaId: string | null
  status: DebateStatus
  totalRounds: number
  currentRound: number
  factCheckMode: FactCheckMode
  winner: DebateWinner
  crowdWinner: DebateWinner
  aiJudgeWinner: DebateWinner
  crowdVotesProCount: number
  crowdVotesConCount: number
  crowdVotesTieCount: number
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

// Debate turn interface
export interface DebateTurn {
  id: string
  debateId: string
  roundNumber: number
  side: DebateSide
  modelId: string
  reflection: string | null
  critique: string | null
  speech: string
  wordCount: number
  factChecksPassed: number
  factChecksFailed: number
  wasRejected: boolean
  retryCount: number
  tokensUsed: number | null
  latencyMs: number | null
  createdAt: Date
}

// Fact check interface
export interface FactCheck {
  id: string
  debateTurnId: string
  claim: string
  verdict: FactCheckVerdict
  confidence: number
  sources: Array<{ url: string; snippet: string }>
  reasoning: string
  createdAt: Date
}

// Debate evaluation interface
export interface DebateEvaluation {
  id: string
  debateId: string
  judgeModel: string
  evaluationOrder: EvaluationOrder
  winner: DebateWinner
  proScore: number
  conScore: number
  reasoning: string
  rubricScores: Record<string, number>
  positionBiasDetected: boolean
  createdAt: Date
}

// User vote interface
export interface UserVote {
  id: string
  debateId: string
  userId: string | null
  sessionId: string
  vote: DebateWinner
  confidence: number | null
  reasoning: string | null
  ipAddress: string | null
  createdAt: Date
}

// Model rating interface
export interface ModelRating {
  id: string
  modelId: string
  ratingType: RatingType
  rating: number
  ratingDeviation: number
  volatility: number | null
  debatesCount: number
  createdAt: Date
}
