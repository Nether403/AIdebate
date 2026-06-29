/**
 * Debater Model Selection and Configuration
 * 
 * All debater models use OpenRouter for maximum flexibility
 */

import { DEBATER_MODELS, isValidDebaterModel, getDebaterModelsByTier } from './model-config';
import type { LLMConfig } from '@/types/llm';

/**
 * Get LLM config for a debater model
 */
export function getDebaterLLMConfig(modelId: string, options?: {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}): LLMConfig {
  if (!isValidDebaterModel(modelId)) {
    throw new Error(`Invalid debater model: ${modelId}. Use one of the available models from DEBATER_MODELS.`);
  }
  
  return {
    provider: 'openrouter',
    model: modelId,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 800,
    topP: options?.topP ?? 0.9,
  };
}

/**
 * Get all available debater models
 */
export function getAvailableDebaterModels() {
  return DEBATER_MODELS;
}

/**
 * Get debater models by tier
 */
export function getDebaterModelsByReasoningTier(tier?: 'frontier' | 'advanced' | 'capable') {
  return getDebaterModelsByTier(tier);
}

/**
 * Get recommended debater models for different use cases
 */
export function getRecommendedDebaterModels() {
  return {
    // Best overall performance (Frontier tier)
    best: [
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-5-pro',
      'openai/gpt-5.1',
      'google/gemini-3.1-pro-preview',
      'x-ai/grok-4.3',
    ],
    
    // Best value (performance/cost ratio)
    value: [
      'anthropic/claude-haiku-4.5',
      'openai/gpt-5.1-chat',
      'qwen/qwen3-max',
      'deepcogito/cogito-v2.1-671b',
    ],
    
    // Most cost-effective
    budget: [
      'qwen/qwen3-next-80b-a3b-instruct',
      'minimax/minimax-m2',
      'z-ai/glm-4.6',
      'nvidia/llama-3.3-nemotron-super-49b-v1.5',
    ],
    
    // Extended reasoning (with thinking modes)
    reasoning: [
      'deepseek/deepseek-v3.1-terminus',
      'qwen/qwen3-next-80b-a3b-thinking',
      'moonshotai/kimi-k2-thinking',
      'openai/gpt-5-pro',
    ],
    
    // Coding-focused
    coding: [
      'openai/gpt-5-codex',
      'qwen/qwen3-coder-plus',
      'deepseek/deepseek-v3.1-terminus',
    ],
  };
}

/**
 * Validate debater model pairing (ensure they're different)
 */
export function validateDebaterPairing(proModelId: string, conModelId: string): {
  valid: boolean;
  error?: string;
} {
  if (!isValidDebaterModel(proModelId)) {
    return {
      valid: false,
      error: `Invalid Pro model: ${proModelId}`,
    };
  }
  
  if (!isValidDebaterModel(conModelId)) {
    return {
      valid: false,
      error: `Invalid Con model: ${conModelId}`,
    };
  }
  
  if (proModelId === conModelId) {
    return {
      valid: false,
      error: 'Pro and Con models must be different',
    };
  }
  
  return { valid: true };
}

/**
 * Get model display name for UI
 */
export function getModelDisplayName(modelId: string): string {
  const model = DEBATER_MODELS.find(m => m.id === modelId);
  return model?.name || modelId;
}

/**
 * Get model provider for UI
 */
export function getModelProvider(modelId: string): string {
  const model = DEBATER_MODELS.find(m => m.id === modelId);
  return model?.provider || 'Unknown';
}

/**
 * Get model tier for UI
 */
export function getModelTier(modelId: string): string {
  const model = DEBATER_MODELS.find(m => m.id === modelId);
  return model?.tier || 'unknown';
}
