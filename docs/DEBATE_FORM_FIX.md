# Debate Form Validation Error Fix

## Problem
When trying to start a debate, the form was throwing a validation error. The error occurred because:

1. **Missing `topicSelection` field**: The form wasn't sending the `topicSelection` field that the API validation schema requires
2. **Invalid `topicId` value**: The form was sending `topicId: null` for random topic selection, but the validation schema expects either:
   - A valid UUID string
   - The field to be omitted entirely (undefined)
3. **API response mismatch**: The form expected `debateId` but the API returns `debate.id`

## Solution

### 1. Updated DebateConfig Interface
Added the required `topicSelection` field and made optional fields properly typed:

```typescript
export interface DebateConfig {
  proModelId: string
  conModelId: string
  topicId?: string  // Optional, only included for manual selection
  topicSelection: 'random' | 'manual'  // Required field
  proPersonaId?: string | null
  conPersonaId?: string | null
  totalRounds: number
  wordLimitPerTurn?: number
  factCheckMode: 'off' | 'standard' | 'strict'
}
```

### 2. Fixed Form Submission Logic
Updated `handleSubmit` to properly construct the config based on topic mode:

```typescript
const finalConfig: DebateConfig = {
  ...config,
  topicSelection: topicMode,
}

// Only include topicId if manual mode and a topic is selected
if (topicMode === 'manual' && config.topicId) {
  finalConfig.topicId = config.topicId
} else {
  // Remove topicId for random mode
  delete finalConfig.topicId
}

onSubmit(finalConfig)
```

### 3. Updated Topic Mode Buttons
Made the buttons update both the local state and the config:

```typescript
onClick={() => {
  setTopicMode('random')
  setConfig({ ...config, topicSelection: 'random', topicId: undefined })
}}
```

### 4. Fixed API Response Handling
Updated the response handler to work with both possible response formats:

```typescript
const debateId = data.debateId || data.debate?.id
if (!debateId) {
  throw new Error('No debate ID returned from server')
}
router.push(`/debate/${debateId}`)
```

## Validation Schema Requirements

The API expects this structure (from `lib/middleware/validation.ts`):

```typescript
export const debateConfigSchema = z.object({
  proModelId: z.string().uuid(),
  conModelId: z.string().uuid(),
  topicId: z.string().uuid().optional(),  // Must be UUID or omitted
  topicSelection: z.enum(['random', 'manual']).default('random'),
  proPersonaId: z.string().uuid().optional(),
  conPersonaId: z.string().uuid().optional(),
  totalRounds: z.number().int().min(1).max(5).default(3),
  wordLimitPerTurn: z.number().int().min(100).max(1000).default(500),
  factCheckMode: z.enum(['off', 'standard', 'strict']).default('standard'),
})
```

## Testing
After these changes, the form should:
1. ✅ Send valid data for random topic selection (no `topicId` field)
2. ✅ Send valid data for manual topic selection (with UUID `topicId`)
3. ✅ Include the required `topicSelection` field
4. ✅ Handle the API response correctly regardless of format

## Files Modified
- `components/debate/DebateConfigForm.tsx` - Fixed form data structure and submission
- `app/debate/new/page.tsx` - Fixed API response handling
