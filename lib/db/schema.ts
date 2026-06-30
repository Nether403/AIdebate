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
  source: text('source').default('curated').notNull(), // 'curated', 'generated', imported dataset name, etc.
  sourceMetadata: jsonb('source_metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('topics_category_idx').on(table.category),
  difficultyIdx: index('topics_difficulty_idx').on(table.difficulty),
}))

// Topic sets table - curated groups of topics for reproducible benchmarks
export const topicSets = pgTable('topic_sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').default('v1').notNull(),
  source: text('source').default('curated').notNull(),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameVersionIdx: uniqueIndex('topic_sets_name_version_idx').on(table.name, table.version),
  activeIdx: index('topic_sets_active_idx').on(table.isActive),
}))

export const topicSetTopics = pgTable('topic_set_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicSetId: uuid('topic_set_id').references(() => topicSets.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  setIdx: index('topic_set_topics_set_idx').on(table.topicSetId),
  topicIdx: index('topic_set_topics_topic_idx').on(table.topicId),
  uniqueMembership: uniqueIndex('topic_set_topics_unique_idx').on(table.topicSetId, table.topicId),
}))

// Prompt templates table - prompt version registry for reproducibility
export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: text('template_id').notNull(),
  version: text('version').notNull(),
  role: text('role').notNull(), // 'debater', 'judge', 'fact-checker', 'moderator'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  templateVersionIdx: uniqueIndex('prompt_templates_template_version_idx').on(table.templateId, table.version),
  roleIdx: index('prompt_templates_role_idx').on(table.role),
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

// Benchmark runs table - groups debates from the same benchmark configuration
export const benchmarkRuns = pgTable('benchmark_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  config: jsonb('config').notNull(),
  totalDebates: integer('total_debates').default(0).notNull(),
  completedDebates: integer('completed_debates').default(0).notNull(),
  failedDebates: integer('failed_debates').default(0).notNull(),
  evaluationFailedDebates: integer('evaluation_failed_debates').default(0).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('benchmark_runs_status_idx').on(table.status),
  createdAtIdx: index('benchmark_runs_created_at_idx').on(table.createdAt),
}))

// Model snapshots table - immutable-ish provider/model metadata captured per run
export const modelSnapshots = pgTable('model_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  benchmarkRunId: uuid('benchmark_run_id').references(() => benchmarkRuns.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  providerModelId: text('provider_model_id').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull(), // 'pro', 'con', 'judge', 'fact-checker', etc.
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  runIdx: index('model_snapshots_run_idx').on(table.benchmarkRunId),
  providerModelIdx: index('model_snapshots_provider_model_idx').on(table.provider, table.providerModelId),
}))

// Debates table - stores debate sessions
export const debates = pgTable('debates', {
  id: uuid('id').defaultRandom().primaryKey(),
  benchmarkRunId: uuid('benchmark_run_id').references(() => benchmarkRuns.id, { onDelete: 'set null' }),
  topicId: uuid('topic_id').references(() => topics.id).notNull(),
  proModelId: uuid('pro_model_id').references(() => models.id).notNull(),
  conModelId: uuid('con_model_id').references(() => models.id).notNull(),
  proPersonaId: uuid('pro_persona_id').references(() => personas.id),
  conPersonaId: uuid('con_persona_id').references(() => personas.id),
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed', 'evaluation_failed', 'cancelled'
  totalRounds: integer('total_rounds').default(3).notNull(),
  currentRound: integer('current_round').default(0).notNull(),
  factCheckMode: text('fact_check_mode').default('standard').notNull(), // 'standard', 'strict', 'off'
  wordLimitPerTurn: integer('word_limit_per_turn').default(500).notNull(),
  judgeProvider: text('judge_provider'),
  judgeModel: text('judge_model'),
  factCheckerProvider: text('fact_checker_provider'),
  factCheckerModel: text('fact_checker_model'),
  promptVersion: text('prompt_version'),
  generationParams: jsonb('generation_params'),
  errorState: jsonb('error_state'),
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
  benchmarkRunIdx: index('debates_benchmark_run_idx').on(table.benchmarkRunId),
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
  provider: text('provider'),
  actualModelId: text('actual_model_id'),
  costEstimate: real('cost_estimate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('debate_turns_debate_idx').on(table.debateId),
  roundIdx: index('debate_turns_round_idx').on(table.roundNumber),
  acceptedTurnLookup: index('debate_turns_accepted_lookup_idx').on(table.debateId, table.roundNumber, table.side, table.wasRejected),
}))

// Durable LLM provider calls for artifact diagnostics and cost accounting
export const llmProviderCalls = pgTable('llm_provider_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }),
  debateTurnId: uuid('debate_turn_id').references(() => debateTurns.id, { onDelete: 'set null' }),
  benchmarkRunId: uuid('benchmark_run_id').references(() => benchmarkRuns.id, { onDelete: 'set null' }),
  stage: text('stage').notNull(), // 'debater', 'claim-extraction', 'fact-checker', 'judge', 'tiebreaker'
  provider: text('provider').notNull(),
  requestedModel: text('requested_model').notNull(),
  actualModel: text('actual_model'),
  promptVersion: text('prompt_version'),
  generationParams: jsonb('generation_params'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  latencyMs: integer('latency_ms'),
  costEstimate: real('cost_estimate'),
  status: text('status').default('success').notNull(), // 'success' or 'error'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('llm_provider_calls_debate_idx').on(table.debateId),
  benchmarkRunIdx: index('llm_provider_calls_benchmark_run_idx').on(table.benchmarkRunId),
  stageIdx: index('llm_provider_calls_stage_idx').on(table.stage),
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
  judgeProvider: text('judge_provider'),
  judgeModel: text('judge_model').notNull(), // e.g., 'gemini-3.0-pro'
  evaluationOrder: text('evaluation_order').notNull(), // 'pro_first', 'con_first', 'tiebreaker', or 'consensus'
  winner: text('winner'), // 'pro', 'con', 'tie', null if parsing/evaluation failed
  proScore: real('pro_score'),
  conScore: real('con_score'),
  reasoning: text('reasoning').notNull(),
  rubricScores: jsonb('rubric_scores').notNull(), // Detailed scores per criterion
  positionBiasDetected: boolean('position_bias_detected').default(false).notNull(),
  parseStatus: text('parse_status').default('parsed').notNull(), // 'parsed', 'parse_failed', 'error'
  rawResponse: text('raw_response'),
  errorMessage: text('error_message'),
  promptVersion: text('prompt_version'),
  schemaVersion: text('schema_version'),
  consensus: boolean('consensus'),
  tiebreakerUsed: boolean('tiebreaker_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  debateIdx: index('debate_evaluations_debate_idx').on(table.debateId),
  winnerIdx: index('debate_evaluations_winner_idx').on(table.winner),
}))

// Dataset exports table - manifest registry for benchmark exports
export const datasetExports = pgTable('dataset_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  benchmarkRunId: uuid('benchmark_run_id').references(() => benchmarkRuns.id, { onDelete: 'cascade' }),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }),
  format: text('format').notNull(), // 'json', 'jsonl', 'csv'
  outputPath: text('output_path').notNull(),
  manifest: jsonb('manifest').notNull(),
  rowCount: integer('row_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  runIdx: index('dataset_exports_run_idx').on(table.benchmarkRunId),
  debateIdx: index('dataset_exports_debate_idx').on(table.debateId),
}))

// User votes table - stores plain crowd voting (no betting/gamification)
export const userVotes = pgTable('user_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  debateId: uuid('debate_id').references(() => debates.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id'), // null for anonymous votes, Stack Auth user ID for authenticated
  sessionId: text('session_id').notNull(), // For anonymous vote tracking
  vote: text('vote').notNull(), // 'pro', 'con', 'tie'
  confidence: integer('confidence'), // 1-5 scale, optional
  reasoning: text('reasoning'), // Optional user explanation
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
  snapshots: many(modelSnapshots),
}))

export const topicsRelations = relations(topics, ({ many }) => ({
  debates: many(debates),
  topicSetMemberships: many(topicSetTopics),
}))

export const topicSetsRelations = relations(topicSets, ({ many }) => ({
  topics: many(topicSetTopics),
}))

export const topicSetTopicsRelations = relations(topicSetTopics, ({ one }) => ({
  topicSet: one(topicSets, {
    fields: [topicSetTopics.topicSetId],
    references: [topicSets.id],
  }),
  topic: one(topics, {
    fields: [topicSetTopics.topicId],
    references: [topics.id],
  }),
}))

export const personasRelations = relations(personas, ({ many }) => ({
  proDebates: many(debates, { relationName: 'proPersona' }),
  conDebates: many(debates, { relationName: 'conPersona' }),
}))

export const benchmarkRunsRelations = relations(benchmarkRuns, ({ many }) => ({
  debates: many(debates),
  modelSnapshots: many(modelSnapshots),
  llmProviderCalls: many(llmProviderCalls),
  datasetExports: many(datasetExports),
}))

export const modelSnapshotsRelations = relations(modelSnapshots, ({ one }) => ({
  benchmarkRun: one(benchmarkRuns, {
    fields: [modelSnapshots.benchmarkRunId],
    references: [benchmarkRuns.id],
  }),
  model: one(models, {
    fields: [modelSnapshots.modelId],
    references: [models.id],
  }),
}))

export const debatesRelations = relations(debates, ({ one, many }) => ({
  benchmarkRun: one(benchmarkRuns, {
    fields: [debates.benchmarkRunId],
    references: [benchmarkRuns.id],
  }),
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
  llmProviderCalls: many(llmProviderCalls),
  datasetExports: many(datasetExports),
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
  llmProviderCalls: many(llmProviderCalls),
}))

export const llmProviderCallsRelations = relations(llmProviderCalls, ({ one }) => ({
  debate: one(debates, {
    fields: [llmProviderCalls.debateId],
    references: [debates.id],
  }),
  debateTurn: one(debateTurns, {
    fields: [llmProviderCalls.debateTurnId],
    references: [debateTurns.id],
  }),
  benchmarkRun: one(benchmarkRuns, {
    fields: [llmProviderCalls.benchmarkRunId],
    references: [benchmarkRuns.id],
  }),
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

export const datasetExportsRelations = relations(datasetExports, ({ one }) => ({
  benchmarkRun: one(benchmarkRuns, {
    fields: [datasetExports.benchmarkRunId],
    references: [benchmarkRuns.id],
  }),
  debate: one(debates, {
    fields: [datasetExports.debateId],
    references: [debates.id],
  }),
}))

export const userVotesRelations = relations(userVotes, ({ one }) => ({
  debate: one(debates, {
    fields: [userVotes.debateId],
    references: [debates.id],
  }),
}))

export const modelRatingsRelations = relations(modelRatings, ({ one }) => ({
  model: one(models, {
    fields: [modelRatings.modelId],
    references: [models.id],
  }),
}))
