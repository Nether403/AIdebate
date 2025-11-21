-- Performance Optimization Indexes for AI Debate Arena
-- Run these after initial schema creation

-- Debates table indexes
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debates_model_a ON debates(model_a_id);
CREATE INDEX IF NOT EXISTS idx_debates_model_b ON debates(model_b_id);
CREATE INDEX IF NOT EXISTS idx_debates_topic ON debates(topic_id);
CREATE INDEX IF NOT EXISTS idx_debates_winner ON debates(winner);
CREATE INDEX IF NOT EXISTS idx_debates_completed_at ON debates(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_debates_models_winner ON debates(model_a_id, model_b_id, winner, completed_at);

-- Debate turns indexes
CREATE INDEX IF NOT EXISTS idx_debate_turns_debate_id ON debate_turns(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_turns_round ON debate_turns(debate_id, round);
CREATE INDEX IF NOT EXISTS idx_debate_turns_speaker ON debate_turns(speaker_model_id);

-- Fact checks indexes
CREATE INDEX IF NOT EXISTS idx_fact_checks_turn_id ON fact_checks(turn_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_verdict ON fact_checks(verdict);

-- Debate evaluations indexes
CREATE INDEX IF NOT EXISTS idx_debate_evaluations_debate_id ON debate_evaluations(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_evaluations_judge ON debate_evaluations(judge_model);

-- User votes indexes
CREATE INDEX IF NOT EXISTS idx_user_votes_debate_id ON user_votes(debate_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_session_id ON user_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_created_at ON user_votes(created_at DESC);

-- Model ratings indexes
CREATE INDEX IF NOT EXISTS idx_model_ratings_model_id ON model_ratings(model_id);
CREATE INDEX IF NOT EXISTS idx_model_ratings_type ON model_ratings(rating_type);
CREATE INDEX IF NOT EXISTS idx_model_ratings_rating ON model_ratings(rating DESC);

-- Composite index for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_model_ratings_leaderboard ON model_ratings(rating_type, rating DESC, games_played);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty);
CREATE INDEX IF NOT EXISTS idx_topics_is_balanced ON topics(is_balanced) WHERE is_balanced = true;
CREATE INDEX IF NOT EXISTS idx_topics_retired ON topics(retired_at) WHERE retired_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_topics_times_used ON topics(times_used);

-- Models indexes
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_models_is_active ON models(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_models_is_legacy ON models(is_legacy);

-- Personas indexes
CREATE INDEX IF NOT EXISTS idx_personas_is_active ON personas(is_active) WHERE is_active = true;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_debates_active ON debates(id, status, created_at) 
  WHERE status IN ('initializing', 'in_progress', 'paused');

CREATE INDEX IF NOT EXISTS idx_debates_completed_recent ON debates(id, completed_at, model_a_id, model_b_id, winner)
  WHERE completed_at > NOW() - INTERVAL '30 days';

-- Covering index for leaderboard statistics
CREATE INDEX IF NOT EXISTS idx_debates_stats_covering ON debates(model_a_id, model_b_id, winner, completed_at)
  WHERE completed_at IS NOT NULL
  INCLUDE (id, total_tokens_a, total_tokens_b);

-- Comments for documentation
COMMENT ON INDEX idx_debates_status IS 'Fast filtering by debate status';
COMMENT ON INDEX idx_debates_models_winner IS 'Optimizes leaderboard win/loss calculations';
COMMENT ON INDEX idx_model_ratings_leaderboard IS 'Optimizes leaderboard sorting and filtering';
COMMENT ON INDEX idx_debates_completed_recent IS 'Optimizes recent debates queries';
