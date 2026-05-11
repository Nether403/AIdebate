-- Update Models Script
-- Updates the database with the new OpenRouter model IDs
-- Run with: psql $DATABASE_URL -f scripts/update-models.sql

-- Deactivate all existing models
UPDATE models SET is_active = false;

-- Insert new models with correct OpenRouter IDs
-- Tier 1: Frontier Models
INSERT INTO models (name, provider, model_id, is_active) VALUES
('Claude Sonnet 4.5', 'openrouter', 'anthropic/claude-sonnet-4.5', true),
('GPT-5 Pro', 'openrouter', 'openai/gpt-5-pro', true),
('GPT-5.1', 'openrouter', 'openai/gpt-5.1', true),
('Gemini 3.0 Pro', 'openrouter', 'google/gemini-3-pro-preview', true),
('Grok 4.1 Fast', 'openrouter', 'x-ai/grok-4.1-fast', true),
('Grok 4 Fast', 'openrouter', 'x-ai/grok-4-fast', true),
('DeepSeek V3.1 Terminus', 'openrouter', 'deepseek/deepseek-v3.1-terminus', true),

-- Tier 2: Advanced Models
('Claude Haiku 4.5', 'openrouter', 'anthropic/claude-haiku-4.5', true),
('GPT-5.1 Chat', 'openrouter', 'openai/gpt-5.1-chat', true),
('GPT-5 Codex', 'openrouter', 'openai/gpt-5-codex', true),
('Gemini 2.5 Flash', 'openrouter', 'google/gemini-2.5-flash-preview-09-2025', true),
('Qwen 3 Max', 'openrouter', 'qwen/qwen3-max', true),
('Qwen 3 Next 80B Thinking', 'openrouter', 'qwen/qwen3-next-80b-a3b-thinking', true),
('Cogito V2.1 671B', 'openrouter', 'deepcogito/cogito-v2.1-671b', true),
('Kimi K2 Thinking', 'openrouter', 'moonshotai/kimi-k2-thinking', true),

-- Tier 3: Capable Models
('Qwen 3 Coder Plus', 'openrouter', 'qwen/qwen3-coder-plus', true),
('Qwen 3 Next 80B Instruct', 'openrouter', 'qwen/qwen3-next-80b-a3b-instruct', true),
('MiniMax M2', 'openrouter', 'minimax/minimax-m2', true),
('GLM 4.6', 'openrouter', 'z-ai/glm-4.6', true),
('Tongyi DeepResearch 30B', 'openrouter', 'alibaba/tongyi-deepresearch-30b-a3b', true),
('Llama 3.3 Nemotron Super 49B', 'openrouter', 'nvidia/llama-3.3-nemotron-super-49b-v1.5', true)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  is_active = EXCLUDED.is_active;

-- Show the updated models
SELECT name, provider, model_id, is_active FROM models WHERE is_active = true ORDER BY name;
