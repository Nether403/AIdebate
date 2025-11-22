/**
 * Sanitization utilities for LLM responses
 * Handles removal of internal thinking tags and other metadata
 */

/**
 * Regex pattern to match thinking tags
 * Matches <thought>...</thought> blocks with any content including newlines
 * Uses non-greedy matching to handle multiple tags correctly
 */
const THINKING_TAG_PATTERN = /<thought>[\s\S]*?<\/thought>/gi;

/**
 * Strip thinking tags from LLM response content
 * Removes <thought>...</thought> blocks and their content
 * 
 * @param content - Raw LLM response content
 * @returns Sanitized content without thinking tags
 * 
 * @example
 * ```typescript
 * const raw = "Here's my answer. <thought>Let me think...</thought> The result is 42.";
 * const clean = stripThinkingTags(raw);
 * // Returns: "Here's my answer.  The result is 42."
 * ```
 */
export function stripThinkingTags(content: string): string {
  try {
    // Remove all thinking tag blocks
    return content.replace(THINKING_TAG_PATTERN, '');
  } catch (error) {
    console.error('Error sanitizing thinking tags:', error);
    // Return original content if sanitization fails
    // Better to show thinking tags than crash the system
    return content;
  }
}

/**
 * Check if content contains thinking tags
 * 
 * @param content - Content to check
 * @returns True if thinking tags are present
 * 
 * @example
 * ```typescript
 * hasThinkingTags("Normal text"); // false
 * hasThinkingTags("<thought>Internal reasoning</thought>"); // true
 * ```
 */
export function hasThinkingTags(content: string): boolean {
  return THINKING_TAG_PATTERN.test(content);
}

/**
 * Extended sanitization result with metadata
 */
export interface SanitizationResult {
  sanitizedContent: string;
  hadThinkingTags: boolean;
  removedTagCount: number;
}

/**
 * Strip thinking tags and return detailed result
 * 
 * @param content - Raw LLM response content
 * @returns Detailed sanitization result with metadata
 */
export function stripThinkingTagsWithMetadata(content: string): SanitizationResult {
  const matches = content.match(THINKING_TAG_PATTERN);
  const hadThinkingTags = matches !== null && matches.length > 0;
  const removedTagCount = matches ? matches.length : 0;
  const sanitizedContent = stripThinkingTags(content);

  return {
    sanitizedContent,
    hadThinkingTags,
    removedTagCount,
  };
}
