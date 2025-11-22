# Requirements Document: LLM Configuration Fixes

## Introduction

This specification addresses two critical issues in the LLM configuration:
1. The Judge Agent configuration still references the legacy `gemini-1.5-pro` model instead of the current `gemini-3.0-pro`
2. The OpenAI provider returns raw content that may include internal thinking tags (e.g., `<thought>`) from GPT-5.1-thinking mode, which should be stripped before displaying to users

## Glossary

- **Judge Agent**: The AI system that evaluates completed debates and determines winners
- **LLM Provider**: The adapter layer that interfaces with external AI model APIs (OpenAI, Google, etc.)
- **Thinking Tags**: XML-style tags (e.g., `<thought>`, `</thought>`) used by some models to separate internal reasoning from final output
- **Model Configuration**: The settings that specify which AI model to use for specific tasks
- **GPT-5.1-thinking**: OpenAI's extended reasoning mode that includes internal monologue in responses

## Requirements

### Requirement 1: Update Judge Agent Model Configuration

**User Story:** As a system administrator, I want the Judge Agent to use the latest Gemini model (gemini-3-pro-preview) instead of the legacy version, so that evaluations benefit from improved reasoning capabilities.

#### Acceptance Criteria

1. WHEN the Judge Agent is initialized with default configuration, THE System SHALL use model identifier "gemini-3-pro-preview"
2. WHEN the Judge Agent factory function is called without parameters, THE System SHALL create an agent configured with "gemini-3-pro-preview"
3. WHEN the tiebreaker judge is invoked, THE System SHALL use "gpt-5.1" as specified in the configuration
4. WHERE legacy model identifiers exist in seed data, THE System SHALL update them to current model identifiers

### Requirement 2: Strip Thinking Tags from LLM Responses

**User Story:** As a user viewing debate content, I want to see only the final polished arguments without internal AI reasoning, so that the debate remains clear and professional.

#### Acceptance Criteria

1. WHEN the OpenAI provider receives a response containing thinking tags, THE System SHALL extract and remove all content within `<thought>` and `</thought>` tags
2. WHEN the OpenAI provider receives a response containing thinking tags, THE System SHALL return only the content outside the thinking tags
3. WHEN the OpenAI provider receives a response without thinking tags, THE System SHALL return the content unchanged
4. WHEN multiple thinking tag pairs exist in a response, THE System SHALL remove all of them
5. WHERE thinking tags are nested or malformed, THE System SHALL handle them gracefully without crashing

### Requirement 3: Maintain Backward Compatibility

**User Story:** As a developer, I want legacy model identifiers to remain in the pricing configuration, so that historical data and fallback options continue to work.

#### Acceptance Criteria

1. WHEN the Google provider calculates costs, THE System SHALL support both "gemini-3.0-pro" and "gemini-1.5-pro" pricing
2. WHEN the OpenAI provider calculates costs, THE System SHALL support all GPT-5.1 variants (instant, thinking, base)
3. WHERE a model identifier is not found in pricing, THE System SHALL log a warning and return zero cost

### Requirement 4: Update Database Seed Data

**User Story:** As a system administrator, I want the initial database to contain current model identifiers, so that new deployments use the latest models by default.

#### Acceptance Criteria

1. WHEN the database is seeded, THE System SHALL include "gemini-3-pro-preview" as an active model option
2. WHEN the database is seeded, THE System SHALL include "gemini-2.5-pro" as an active model option
3. WHEN the database is seeded, THE System SHALL mark legacy models (gemini-1.5-pro) as inactive
4. WHEN the database is seeded, THE System SHALL include "gpt-5.1" as an active model option

### Requirement 5: Update Google Provider Pricing

**User Story:** As a system administrator, I want accurate cost calculations for the latest Gemini models, so that budget tracking remains accurate.

#### Acceptance Criteria

1. WHEN the Google provider calculates costs for "gemini-3-pro-preview", THE System SHALL use the correct pricing rates
2. WHEN the Google provider calculates costs for "gemini-2.5-pro", THE System SHALL use the correct pricing rates
3. WHERE legacy model identifiers are used, THE System SHALL continue to support their pricing for backward compatibility
