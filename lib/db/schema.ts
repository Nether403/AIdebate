import { pgTable, text, timestamp, integer, real, boolean, jsonb, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Models table - stores LLM model information
export const models = pgTable('models', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(), // 'openai', 'anthropic', 'google', 'xai', 'openrouter'
  modelId: text('model_id').notNull(), // e.g., 'gpt-5.1', 'claude-4.5-sonnet'
  isActive: boolean('is_active').default(true).notNull(),
  crowdRating: real('crowd_rating').default(1500).notNull(), // Elo rating
  crowdRatingDeviation: real('crowd_rating_deviation').default(350).notNull(), // Glicko-2 RD
  aiQualityRating: real('ai_quality_rating').default(1500).notNull(), // Glicko-2 rating
  aiQualityRatingDeviation: real('ai_quality_rating_deviation').default(350).notNull(),
  aiQualityVolatility: real('ai_quality_volatility').default(0.06).notNull(), // Glicko-2 volatility
  totalDebates: integer('total_debates').default(0).notNull(),
  wins: integer('wins').default(0).notNull(),
  losses: integer('losses').default(0).notNull(),
  ties: integer('ties').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('models_name_idx').on(table.name),
  providerIdx: index('models_provider_idx').on(table.provider),
}))

// Topics table - stores debate topics
export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  motion: text('motion').notNull(),
  category: text('category').notNull(), // 'technology', 'ethics', 'politics', 'science', etc.
  difficulty: text('difficulty').notNull(), // 'easy', 'medium', 'hard'
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('topics_category_idx').on(table.category),
  difficultyIdx: index('topics_difficulty_idx').on(table.difficulty),
}))

// Personas table - stores debate personas
export const personas = pgTable('personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('personas_name_idx').on(table.name),
}))

// Debates table - stores debate sessions
export const debates = pgTable('debates', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id).notNull(),
  proModelId: uuid('pro_model_id').references(() => models.id).notNull(),
  conModelId: uuid('con_model_id').references(() => models.id).notNull(),
  proPersonaId: uuid('pro_persona_id').references(() => personas.id),
  conPersonaId: uuid('con_persona_id').references(() => personas.id),
  status: text('status').notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  totalRounds: integer('total_rounds').default(3).notNull(),
  currentRound: integer('current_round').default(0).notNull(),
  factCheckMode: text('fact_check_mode').default('standard').notNull(), // 'standard', 'strict', 'off'
  winner: text('winner'), // 'pro', 'con', 'tie', null if not judged yet
  crowdWinner: text('crowd_winner'), // Based on user votes
  aiJudgeWinner: text('ai_judge_winner'), // Based on AI judge
  crowdVotesProCount: integer('crowd_votes_pro_count').default(0).notNull(),
  crowdVotesConCount: integer('crowd_votes_con_count').default(0).notNull(),
  crowdVotesTieCount: integer('crowd_votes_tie_count').default(0).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('debates_status_idx').on(table.status),
  topicIdx: index('debates_topic_idx').on(table.topicId),
  proModelIdx: index('debates_pro_model_idx').on(table.proModelId),
  conModelIdx: index('debates_con_model_idx').on(table.conModelId),
  createdAtIdx: index('debates_created_at_idx').on(table.createdAt),
}))

// Debate turns table - stores individual debate turns
export const debateTurns = pgTable('debate_turns', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }).notNull(),
  roundNumber: integer('round_number').notNull(),
  side: text('side').notNull(), // 'pro' or 'con'
  modelId: uuid('model_id').references(() => models.id).notNull(),
  reflection: text('reflection'), // RCR: Reflection phase
  critique: text('critique'), // RCR: Critique phase
  speech: text('speech').notNull(), // RCR: Refined speech
  wordCount: integer('word_count').notNull(),
  factChecksPassed: integer('fact_checks_passed').default(0).notNull(),
  factChecksFailed: integer('fact_checks_failed').default(0).notNull(),
  wasRejected: boolean('was_rejected').default(false).notNull(), // True if rejected by fact-checker
  retryCount: integer('retry_count').default(0).notNull(),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('debate_turns_debate_idx').on(table.debateId),
  roundIdx: index('debate_turns_round_idx').on(table.roundNumber),
}))

// Fact checks table - stores fact-checking results
export const factChecks = pgTable('fact_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateTurnId: uuid('debate_turn_id').references(() => debateTurns.id, { onDelete: 'cascade' }).notNull(),
  claim: text('claim').notNull(),
  verdict: text('verdict').notNull(), // 'true', 'false', 'unverifiable'
  confidence: real('confidence').notNull(), // 0.0 to 1.0
  sources: jsonb('sources').notNull(), // Array of source URLs and snippets
  reasoning: text('reasoning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  turnIdx: index('fact_checks_turn_idx').on(table.debateTurnId),
  verdictIdx: index('fact_checks_verdict_idx').on(table.verdict),
}))

// Debate evaluations table - stores AI judge evaluations
export const debateEvaluations = pgTable('debate_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }).notNull(),
  judgeModel: text('judge_model').notNull(), // e.g., 'gemini-3.0-pro'
  evaluationOrder: text('evaluation_order').notNull(), // 'pro_first' or 'con_first' for bias detection
  winner: text('winner').notNull(), // 'pro', 'con', 'tie'
  proScore: real('pro_score').notNull(),
  conScore: real('con_score').notNull(),
  reasoning: text('reasoning').notNull(),
  rubricScores: jsonb('rubric_scores').notNull(), // Detailed scores per criterion
  positionBiasDetected: boolean('position_bias_detected').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('debate_evaluations_debate_idx').on(table.debateId),
  winnerIdx: index('debate_evaluations_winner_idx').on(table.winner),
}))

// User profiles table - stores user statistics and DebatePoints
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(), // Stack Auth user ID
  sessionId: text('session_id').notNull().unique(), // For linking anonymous activity
  debatePoints: integer('debate_points').default(1000).notNull(), // Virtual currency
  totalVotes: integer('total_votes').default(0).notNull(),
  correctPredictions: integer('correct_predictions').default(0).notNull(),
  totalBetsPlaced: integer('total_bets_placed').default(0).notNull(),
  totalBetsWon: integer('total_bets_won').default(0).notNull(),
  totalPointsWagered: integer('total_points_wagered').default(0).notNull(),
  totalPointsWon: integer('total_points_won').default(0).notNull(),
  isSuperforecaster: boolean('is_superforecaster').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('user_profiles_user_idx').on(table.userId),
  sessionIdx: uniqueIndex('user_profiles_session_idx').on(table.sessionId),
}))

// User votes table - stores crowd voting with betting
export const userVotes = pgTable('user_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id'), // null for anonymous votes, Stack Auth user ID for authenticated
  sessionId: text('session_id').notNull(), // For anonymous vote tracking
  vote: text('vote').notNull(), // 'pro', 'con', 'tie'
  confidence: integer('confidence'), // 1-5 scale, optional
  reasoning: text('reasoning'), // Optional user explanation
  wagerAmount: integer('wager_amount').default(0).notNull(), // DebatePoints wagered
  oddsAtBet: real('odds_at_bet'), // Odds when bet was placed (e.g., 2.5 means 2.5x payout)
  payoutAmount: integer('payout_amount').default(0).notNull(), // Points won/lost
  wasCorrect: boolean('was_correct'), // null until debate is judged
  ipAddress: text('ip_address'), // For abuse prevention
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('user_votes_debate_idx').on(table.debateId),
  userIdx: index('user_votes_user_idx').on(table.userId),
  sessionIdx: index('user_votes_session_idx').on(table.sessionId),
  uniqueVote: uniqueIndex('user_votes_unique_idx').on(table.debateId, table.sessionId),
}))

// Model ratings table - stores rating history for analytics
export const modelRatings = pgTable('model_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: uuid('model_id').references(() => models.id, { onDelete: 'cascade' }).notNull(),
  ratingType: text('rating_type').notNull(), // 'crowd' or 'ai_quality'
  rating: real('rating').notNull(),
  ratingDeviation: real('rating_deviation').notNull(),
  volatility: real('volatility'), // Only for Glicko-2 (ai_quality)
  debatesCount: integer('debates_count').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  modelIdx: index('model_ratings_model_idx').on(table.modelId),
  typeIdx: index('model_ratings_type_idx').on(table.ratingType),
  createdAtIdx: index('model_ratings_created_at_idx').on(table.createdAt),
}))

// Relations
export const modelsRelations = relations(models, ({ many }) => ({
  proDebates: many(debates, { relationName: 'proModel' }),
  conDebates: many(debates, { relationName: 'conModel' }),
  turns: many(debateTurns),
  ratings: many(modelRatings),
}))

export const topicsRelations = relations(topics, ({ many }) => ({
  debates: many(debates),
}))

export const personasRelations = relations(personas, ({ many }) => ({
  proDebates: many(debates, { relationName: 'proPersona' }),
  conDebates: many(debates, { relationName: 'conPersona' }),
}))

export const debatesRelations = relations(debates, ({ one, many }) => ({
  topic: one(topics, {
    fields: [debates.topicId],
    references: [topics.id],
  }),
  proModel: one(models, {
    fields: [debates.proModelId],
    references: [models.id],
    relationName: 'proModel',
  }),
  conModel: one(models, {
    fields: [debates.conModelId],
    references: [models.id],
    relationName: 'conModel',
  }),
  proPersona: one(personas, {
    fields: [debates.proPersonaId],
    references: [personas.id],
    relationName: 'proPersona',
  }),
  conPersona: one(personas, {
    fields: [debates.conPersonaId],
    references: [personas.id],
    relationName: 'conPersona',
  }),
  turns: many(debateTurns),
  evaluations: many(debateEvaluations),
  votes: many(userVotes),
}))

export const debateTurnsRelations = relations(debateTurns, ({ one, many }) => ({
  debate: one(debates, {
    fields: [debateTurns.debateId],
    references: [debates.id],
  }),
  model: one(models, {
    fields: [debateTurns.modelId],
    references: [models.id],
  }),
  factChecks: many(factChecks),
}))

export const factChecksRelations = relations(factChecks, ({ one }) => ({
  turn: one(debateTurns, {
    fields: [factChecks.debateTurnId],
    references: [debateTurns.id],
  }),
}))

export const debateEvaluationsRelations = relations(debateEvaluations, ({ one }) => ({
  debate: one(debates, {
    fields: [debateEvaluations.debateId],
    references: [debates.id],
  }),
}))

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  votes: many(userVotes),
}))

export const userVotesRelations = relations(userVotes, ({ one }) => ({
  debate: one(debates, {
    fields: [userVotes.debateId],
    references: [debates.id],
  }),
  userProfile: one(userProfiles, {
    fields: [userVotes.sessionId],
    references: [userProfiles.sessionId],
  }),
}))

export const modelRatingsRelations = relations(modelRatings, ({ one }) => ({
  model: one(models, {
    fields: [modelRatings.modelId],
    references: [models.id],
  }),
}))
