/**
 * Thinking Tag Sanitization Tests
 * Tests the stripThinkingTags utility for various edge cases
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  stripThinkingTags, 
  hasThinkingTags, 
  stripThinkingTagsWithMetadata 
} from '../sanitize';

describe('Thinking Tag Sanitization', () => {
  describe('stripThinkingTags', () => {
    it('should remove single thinking tag', () => {
      const input = 'Here is my answer. <thought>Let me think about this...</thought> The result is 42.';
      const expected = 'Here is my answer.  The result is 42.';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should remove multiple thinking tags', () => {
      const input = '<thought>First thought</thought> Some text <thought>Second thought</thought> More text <thought>Third thought</thought>';
      const expected = ' Some text  More text ';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle nested thinking tags', () => {
      const input = '<thought>Outer <thought>Inner</thought> thought</thought> Result';
      // Regex will match the first complete pair, leaving the outer closing tag
      // This is acceptable behavior for malformed input
      const result = stripThinkingTags(input);
      assert.ok(!result.includes('<thought>Inner</thought>'), 'Inner tag should be removed');
    });

    it('should handle unclosed thinking tags gracefully', () => {
      const input = 'Text before <thought>Incomplete thought... The answer is 42.';
      // Unclosed tags won't match the pattern, so content remains unchanged
      const result = stripThinkingTags(input);
      assert.strictEqual(result, input, 'Unclosed tags should leave content unchanged');
    });

    it('should handle malformed closing tags', () => {
      const input = 'Text <thought>Some thought</thoght> More text';
      // Malformed closing tag won't match, content remains unchanged
      const result = stripThinkingTags(input);
      assert.strictEqual(result, input, 'Malformed tags should leave content unchanged');
    });

    it('should return content unchanged when no thinking tags present', () => {
      const input = 'This is normal text without any thinking tags.';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, input);
    });

    it('should handle empty thinking tags', () => {
      const input = 'Before <thought></thought> After';
      const expected = 'Before  After';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should preserve whitespace outside thinking tags', () => {
      const input = '  Leading spaces\n<thought>Internal</thought>\n  Trailing spaces  ';
      const expected = '  Leading spaces\n\n  Trailing spaces  ';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle thinking tags with newlines inside', () => {
      const input = 'Text <thought>\nMultiline\nthinking\nprocess\n</thought> Result';
      const expected = 'Text  Result';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle thinking tags with special characters', () => {
      const input = 'Text <thought>Special chars: !@#$%^&*()</thought> Result';
      const expected = 'Text  Result';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should be case insensitive for tag names', () => {
      const input = 'Text <THOUGHT>Uppercase</THOUGHT> <Thought>Mixed</Thought> Result';
      const expected = 'Text   Result';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle empty string', () => {
      const input = '';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, '');
    });

    it('should handle string with only thinking tags', () => {
      const input = '<thought>Only thinking</thought>';
      const expected = '';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle consecutive thinking tags', () => {
      const input = '<thought>First</thought><thought>Second</thought><thought>Third</thought>';
      const expected = '';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle thinking tags at start of string', () => {
      const input = '<thought>Starting thought</thought> Rest of content';
      const expected = ' Rest of content';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle thinking tags at end of string', () => {
      const input = 'Content before <thought>Ending thought</thought>';
      const expected = 'Content before ';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle very long thinking content', () => {
      const longThought = 'x'.repeat(10000);
      const input = `Before <thought>${longThought}</thought> After`;
      const expected = 'Before  After';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('hasThinkingTags', () => {
    it('should return true when thinking tags are present', () => {
      const input = 'Text <thought>Internal</thought> More text';
      assert.strictEqual(hasThinkingTags(input), true);
    });

    it('should return false when no thinking tags present', () => {
      const input = 'Normal text without tags';
      assert.strictEqual(hasThinkingTags(input), false);
    });

    it('should return false for unclosed thinking tags', () => {
      const input = 'Text <thought>Unclosed';
      assert.strictEqual(hasThinkingTags(input), false);
    });

    it('should return true for multiple thinking tags', () => {
      const input = '<thought>One</thought> Text <thought>Two</thought>';
      assert.strictEqual(hasThinkingTags(input), true);
    });

    it('should return false for empty string', () => {
      const input = '';
      assert.strictEqual(hasThinkingTags(input), false);
    });

    it('should be case insensitive', () => {
      const input = 'Text <THOUGHT>Uppercase</THOUGHT>';
      assert.strictEqual(hasThinkingTags(input), true);
    });
  });

  describe('stripThinkingTagsWithMetadata', () => {
    it('should return metadata for content with thinking tags', () => {
      const input = 'Text <thought>One</thought> More <thought>Two</thought>';
      const result = stripThinkingTagsWithMetadata(input);
      
      assert.strictEqual(result.hadThinkingTags, true);
      assert.strictEqual(result.removedTagCount, 2);
      assert.strictEqual(result.sanitizedContent, 'Text  More ');
    });

    it('should return metadata for content without thinking tags', () => {
      const input = 'Normal text';
      const result = stripThinkingTagsWithMetadata(input);
      
      assert.strictEqual(result.hadThinkingTags, false);
      assert.strictEqual(result.removedTagCount, 0);
      assert.strictEqual(result.sanitizedContent, 'Normal text');
    });

    it('should count single thinking tag correctly', () => {
      const input = 'Text <thought>Internal</thought> Result';
      const result = stripThinkingTagsWithMetadata(input);
      
      assert.strictEqual(result.hadThinkingTags, true);
      assert.strictEqual(result.removedTagCount, 1);
    });

    it('should count multiple thinking tags correctly', () => {
      const input = '<thought>A</thought><thought>B</thought><thought>C</thought>';
      const result = stripThinkingTagsWithMetadata(input);
      
      assert.strictEqual(result.hadThinkingTags, true);
      assert.strictEqual(result.removedTagCount, 3);
    });

    it('should handle empty string', () => {
      const input = '';
      const result = stripThinkingTagsWithMetadata(input);
      
      assert.strictEqual(result.hadThinkingTags, false);
      assert.strictEqual(result.removedTagCount, 0);
      assert.strictEqual(result.sanitizedContent, '');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on extremely nested tags', () => {
      // Create deeply nested structure
      let input = 'Text ';
      for (let i = 0; i < 100; i++) {
        input += '<thought>nested ';
      }
      for (let i = 0; i < 100; i++) {
        input += '</thought>';
      }
      input += ' Result';
      
      // Should not throw
      assert.doesNotThrow(() => {
        stripThinkingTags(input);
      });
    });

    it('should handle unicode characters in thinking tags', () => {
      const input = 'Text <thought>Unicode: 你好 🌟 café</thought> Result';
      const expected = 'Text  Result';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle HTML-like tags that are not thinking tags', () => {
      const input = 'Text <div>HTML content</div> <thought>Real thinking</thought>';
      const expected = 'Text <div>HTML content</div> ';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });

    it('should handle mixed valid and invalid tags', () => {
      const input = '<thought>Valid</thought> <invalid>Not removed</invalid> <thought>Also valid</thought>';
      const expected = ' <invalid>Not removed</invalid> ';
      const result = stripThinkingTags(input);
      assert.strictEqual(result, expected);
    });
  });
});
