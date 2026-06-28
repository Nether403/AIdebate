/**
 * Model Configuration for Hybrid Architecture
 * 
 * Infrastructure roles use direct APIs for best performance
 * Debater roles use OpenRouter for maximum model selection
 */

import type { LLMProvider } from '@/types/llm';

export type AgentRole = 'judge' | 'fact-checker' | 'moderator' | 'debater';

export interface ModelAssignment {
  role: AgentRole;
  model: string;
  provider: LLMProvider;
  fallbackProvider?: LLMProvider;
  fallbackModel?: string;
  description: string;
}

/**
 * Resolve the env-configured Azure OpenAI deployment name, tolerating both the
 * documented `AZURE_OPENAI_API_DEPLOYMENT_NAME` and the shorter
 * `AZURE_OPENAI_DEPLOYMENT_NAME` that appears in some local `.env` files.
 */
export function getAzureDeploymentName(): string | undefined {
  return process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || undefined;
}

/**
 * Infrastructure model assignments (direct APIs)
 */
export const INFRASTRUCTURE_MODELS: Record<string, ModelAssignment> = {
  judge: {
    role: 'judge',
    // Use the env-configured Gemini model (direct Google API via GEMINI_API_KEY).
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    provider: 'google',
    fallbackProvider: 'openrouter',
    // OpenRouter equivalent for when the direct Google API is unavailable.
    fallbackModel: `google/${process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'}`,
    description: 'Primary debate adjudicator - Gemini (direct Google API) with OpenRouter fallback',
  },
  factChecker: {
    role: 'fact-checker',
    // Dedicated Azure deployment for fact-checking (a faster mini model), falling
    // back to the default chat deployment, then a generic model name.
    model: process.env.AZURE_OPENAI_FACTCHECK_DEPLOYMENT_NAME || getAzureDeploymentName() || 'gpt-4o-mini',
    provider: 'openai',
    fallbackProvider: 'openrouter',
    fallbackModel: 'openai/gpt-5.1',
    description: 'Fact validation via a dedicated Azure mini deployment for speed and precision',
  },
  moderator: {
    role: 'moderator',
    model: 'grok-4.1-fast-reasoning',
    provider: 'xai',
    fallbackProvider: 'openrouter',
    fallbackModel: 'x-ai/grok-4.1-fast',
    description: 'Rule enforcement - Grok 4.1 Fast for quick, reliable moderation',
  },
};

/**
 * Available debater models via OpenRouter
 * Only includes models with strong reasoning capabilities
 * Updated from OpenRouter API on 2025-01-20
 */
export const DEBATER_MODELS = [
  // Tier 1: Frontier reasoning models (Best for debates)
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    tier: 'frontier',
    reasoning: 'excellent',
    description: 'State-of-the-art reasoning and agentic capabilities',
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    tier: 'frontier',
    reasoning: 'excellent',
    description: 'Latest OpenAI model with adaptive reasoning',
  },
  {
    id: 'openai/gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'OpenAI',
    tier: 'frontier',
    reasoning: 'excellent',
    description: 'Most advanced OpenAI model for complex reasoning',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3.0 Pro',
    provider: 'Google',
    tier: 'frontier',
    reasoning: 'excellent',
    description: '1M token context, excellent multimodal reasoning',
  },
  {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    tier: 'frontier',
    reasoning: 'excellent',
    description: '2M context, fast reasoning with tool calling',
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    provider: 'xAI',
    tier: 'frontier',
    reasoning: 'excellent',
    description: 'Cost-efficient with 2M context window',
  },
  {
    id: 'deepseek/deepseek-v3.1-terminus',
    name: 'DeepSeek V3.1 Terminus',
    provider: 'DeepSeek',
    tier: 'frontier',
    reasoning: 'excellent',
    description: 'Hybrid reasoning model with thinking mode',
  },
  
  // Tier 2: Advanced reasoning models
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Fast frontier-level reasoning at lower cost',
  },
  {
    id: 'openai/gpt-5.1-chat',
    name: 'GPT-5.1 Chat',
    provider: 'OpenAI',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Fast, lightweight with adaptive reasoning',
  },
  {
    id: 'openai/gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Specialized for coding and technical reasoning',
  },
  {
    id: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Fast reasoning with 1M context',
  },
  {
    id: 'qwen/qwen3-max',
    name: 'Qwen 3 Max',
    provider: 'Alibaba',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Strong multilingual reasoning and tool use',
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-thinking',
    name: 'Qwen 3 Next 80B Thinking',
    provider: 'Alibaba',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Reasoning-first with structured thinking traces',
  },
  {
    id: 'deepcogito/cogito-v2.1-671b',
    name: 'Cogito V2.1 671B',
    provider: 'Deep Cogito',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Open model matching frontier performance',
  },
  {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'MoonshotAI',
    tier: 'advanced',
    reasoning: 'strong',
    description: 'Long-horizon reasoning with tool use',
  },
  
  // Tier 3: Capable reasoning models (Cost-effective)
  {
    id: 'qwen/qwen3-coder-plus',
    name: 'Qwen 3 Coder Plus',
    provider: 'Alibaba',
    tier: 'capable',
    reasoning: 'good',
    description: 'Coding-focused with agentic capabilities',
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen 3 Next 80B Instruct',
    provider: 'Alibaba',
    tier: 'capable',
    reasoning: 'good',
    description: 'Fast instruction-following without thinking traces',
  },
  {
    id: 'minimax/minimax-m2',
    name: 'MiniMax M2',
    provider: 'MiniMax',
    tier: 'capable',
    reasoning: 'good',
    description: 'Compact with strong coding and reasoning',
  },
  {
    id: 'z-ai/glm-4.6',
    name: 'GLM 4.6',
    provider: 'Z.AI',
    tier: 'capable',
    reasoning: 'good',
    description: '200K context with improved reasoning',
  },
  {
    id: 'alibaba/tongyi-deepresearch-30b-a3b',
    name: 'Tongyi DeepResearch 30B',
    provider: 'Alibaba',
    tier: 'capable',
    reasoning: 'good',
    description: 'Optimized for deep information-seeking tasks',
  },
  {
    id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
    name: 'Llama 3.3 Nemotron Super 49B',
    provider: 'NVIDIA',
    tier: 'capable',
    reasoning: 'good',
    description: 'Efficient reasoning with tool calling',
  },
] as const;

/**
 * Get model configuration for a specific role
 */
export function getModelConfig(role: AgentRole, modelId?: string): ModelAssignment {
  // For infrastructure roles, use predefined assignments
  if (role === 'judge') return INFRASTRUCTURE_MODELS.judge;
  if (role === 'fact-checker') return INFRASTRUCTURE_MODELS.factChecker;
  if (role === 'moderator') return INFRASTRUCTURE_MODELS.moderator;
  
  // For debaters, use OpenRouter with specified model
  if (role === 'debater' && modelId) {
    const debaterModel = DEBATER_MODELS.find(m => m.id === modelId);
    if (!debaterModel) {
      throw new Error(`Unknown debater model: ${modelId}`);
    }
    
    return {
      role: 'debater',
      model: modelId,
      provider: 'openrouter',
      description: debaterModel.description,
    };
  }
  
  throw new Error(`Invalid role or missing modelId for debater: ${role}`);
}

/**
 * Get available debater models filtered by tier
 */
export function getDebaterModelsByTier(tier?: 'frontier' | 'advanced' | 'capable') {
  if (!tier) return DEBATER_MODELS;
  return DEBATER_MODELS.filter(m => m.tier === tier);
}

/**
 * Resolve the judge provider/model for a debate, preferring an explicit
 * per-debate/per-run override and falling back to the infrastructure default.
 * This is what makes "judge strength" a configurable experimental variable.
 */
export function resolveJudgeConfig(override?: { provider?: LLMProvider | null; model?: string | null }): { provider: LLMProvider; model: string } {
  const base = INFRASTRUCTURE_MODELS.judge
  return {
    provider: (override?.provider as LLMProvider) ?? base.provider,
    model: override?.model ?? base.model,
  }
}

/**
 * Validate that a model ID is available for debaters
 */
export function isValidDebaterModel(modelId: string): boolean {
  return DEBATER_MODELS.some(m => m.id === modelId);
}

/**
 * Map a model identifier to the slug OpenRouter expects when the OpenRouter
 * fallback is triggered. Infrastructure models are configured with provider-
 * native IDs (e.g. `gemini-3-pro-preview`) that OpenRouter does not recognize;
 * this resolves them to their declared `fallbackModel` slug. Models that are
 * already OpenRouter slugs (contain a `/`) are returned unchanged.
 */
export function getOpenRouterFallbackModel(model: string): string {
  for (const assignment of Object.values(INFRASTRUCTURE_MODELS)) {
    if (assignment.model === model && assignment.fallbackModel) {
      return assignment.fallbackModel;
    }
  }
  return model;
}

/**
 * Get cost estimate for a debate configuration
 */
export function estimateDebateCost(
  rounds: number,
  turnsPerRound: number = 2,
  avgWordsPerTurn: number = 400,
  factChecksPerTurn: number = 3
): {
  judgeCost: number;
  factCheckCost: number;
  moderatorCost: number;
  totalInfrastructureCost: number;
} {
  // Rough token estimates (1 word ≈ 1.3 tokens)
  const tokensPerTurn = avgWordsPerTurn * 1.3;
  const totalTurns = rounds * turnsPerRound;
  
  // Judge cost (evaluates full transcript at end)
  const judgeInputTokens = totalTurns * tokensPerTurn;
  const judgeOutputTokens = 2000; // Structured verdict
  const judgeCost = (judgeInputTokens / 1_000_000) * 1.25 + (judgeOutputTokens / 1_000_000) * 5.0;
  
  // Fact-checker cost (per claim, per turn)
  const totalFactChecks = totalTurns * factChecksPerTurn;
  const factCheckInputTokens = 500; // Claim + search results
  const factCheckOutputTokens = 200; // Verdict
  const factCheckCost = totalFactChecks * (
    (factCheckInputTokens / 1_000_000) * 1.25 + (factCheckOutputTokens / 1_000_000) * 10.0
  );
  
  // Moderator cost (per round)
  const moderatorInputTokens = 300; // Simple rule checking
  const moderatorOutputTokens = 100; // Announcement
  const moderatorCost = rounds * (
    (moderatorInputTokens / 1_000_000) * 2.5 + (moderatorOutputTokens / 1_000_000) * 7.5
  );
  
  return {
    judgeCost,
    factCheckCost,
    moderatorCost,
    totalInfrastructureCost: judgeCost + factCheckCost + moderatorCost,
  };
}
