# Update Models Guide

## Problem

The frontend displays old/incorrect model IDs from the database, not from the code configuration files.

## Solution

Update the database with the correct OpenRouter model IDs.

## Option 1: Using TypeScript Script (Recommended)

```bash
npx tsx scripts/update-models.ts
```

This will:
1. Deactivate all existing models
2. Insert 21 new models with correct OpenRouter IDs
3. Show success message

## Option 2: Using SQL Script

```bash
# Using psql
psql $DATABASE_URL -f scripts/update-models.sql

# Or using Neon CLI
neon sql < scripts/update-models.sql
```

## Option 3: Manual via Neon Dashboard

1. Go to https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Copy and paste the contents of `scripts/update-models.sql`
5. Click "Run"

## Option 4: Using Drizzle Studio

```bash
# Start Drizzle Studio
npx drizzle-kit studio

# Then manually:
# 1. Go to the 'models' table
# 2. Deactivate old models (set is_active = false)
# 3. Add new models with correct IDs
```

## Verify the Update

After running the update, verify it worked:

```bash
# Check the database
psql $DATABASE_URL -c "SELECT name, model_id FROM models WHERE is_active = true ORDER BY name;"
```

Expected output: 21 models with OpenRouter IDs like:
- `anthropic/claude-sonnet-4.5`
- `openai/gpt-5-pro`
- `x-ai/grok-4.1-fast`
- etc.

## Refresh the Frontend

After updating the database:

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. The model selector should now show the updated list
3. Test by starting a debate with `x-ai/grok-4.1-fast`

## New Model List (21 Models)

### Tier 1: Frontier (7 models)
- Claude Sonnet 4.5
- GPT-5 Pro
- GPT-5.1
- Gemini 3.0 Pro
- Grok 4.1 Fast
- Grok 4 Fast
- DeepSeek V3.1 Terminus

### Tier 2: Advanced (8 models)
- Claude Haiku 4.5
- GPT-5.1 Chat
- GPT-5 Codex
- Gemini 2.5 Flash
- Qwen 3 Max
- Qwen 3 Next 80B Thinking
- Cogito V2.1 671B
- Kimi K2 Thinking

### Tier 3: Capable (6 models)
- Qwen 3 Coder Plus
- Qwen 3 Next 80B Instruct
- MiniMax M2
- GLM 4.6
- Tongyi DeepResearch 30B
- Llama 3.3 Nemotron Super 49B

## Troubleshooting

### Script fails with "database connection error"

Check your DATABASE_URL:
```bash
echo $DATABASE_URL
```

Make sure it's set in your `.env` file.

### Models still show old list after update

1. Hard refresh your browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check the database directly:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM models WHERE is_active = true;"
   ```

### "Invalid debater model" error

This means the model ID in the database doesn't match OpenRouter's API.

Solution:
1. Run the update script again
2. Make sure all model IDs have the provider prefix (e.g., `x-ai/`, `anthropic/`)

## Files Updated

1. `scripts/seed-database.ts` - Updated seed data
2. `scripts/update-models.ts` - New TypeScript update script
3. `scripts/update-models.sql` - New SQL update script
4. `lib/llm/model-config.ts` - Code configuration (already updated)
5. `lib/llm/debater-models.ts` - Helper functions (already updated)

## Next Steps

After updating the models:

1. ✅ Run the update script
2. ✅ Refresh your browser
3. ✅ Test a debate with the new models
4. ✅ Verify no "Invalid debater model" errors
5. [ ] Update any existing debates in the database (optional)

## Important Notes

- All models now use OpenRouter as the provider
- Model IDs include the provider prefix (e.g., `x-ai/grok-4.1-fast`)
- Old models are deactivated, not deleted (for historical data)
- The frontend will only show active models
- Changes take effect immediately after database update

## Quick Test

After updating, test with:

```bash
# Start a debate with the new model IDs
curl -X POST http://localhost:3000/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{
    "proModelId": "x-ai/grok-4.1-fast",
    "conModelId": "anthropic/claude-sonnet-4.5",
    "topicSelection": "random",
    "totalRounds": 1,
    "factCheckMode": "off"
  }'
```

Should return a debate ID without errors.
