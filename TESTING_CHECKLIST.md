# Hybrid Architecture Testing Checklist

## Pre-Testing Setup

- [x] All code files created and compile without errors
- [x] Environment variables documented in `.env`
- [x] Model configuration system in place
- [x] Automatic fallback logic implemented
- [ ] API keys verified and active

## API Key Verification

### Google API (Judge)
```bash
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
  "https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-preview"
```
Expected: 200 OK with model details

### OpenAI API (Fact-Checker)
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models/gpt-5.1"
```
Expected: 200 OK with model details

### OpenRouter API (Debaters + Fallback)
```bash
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  "https://openrouter.ai/api/v1/models"
```
Expected: 200 OK with list of available models

## Unit Tests

### Model Configuration
- [ ] `getModelConfig('judge')` returns correct config
- [ ] `getModelConfig('fact-checker')` returns correct config
- [ ] `getModelConfig('moderator')` returns correct config
- [ ] `getDebaterLLMConfig(validModel)` returns correct config
- [ ] `isValidDebaterModel(validModel)` returns true
- [ ] `isValidDebaterModel(invalidModel)` returns false

### LLM Client Fallback
- [ ] Primary provider success returns response
- [ ] Primary provider failure triggers fallback
- [ ] Fallback to OpenRouter succeeds
- [ ] Both failures throw error
- [ ] Fallback is logged for monitoring

### Debater Model Utilities
- [ ] `getAvailableDebaterModels()` returns all models
- [ ] `getDebaterModelsByTier('frontier')` filters correctly
- [ ] `validateDebaterPairing(pro, con)` validates correctly
- [ ] `getModelDisplayName(id)` returns correct name

## Integration Tests

### Judge Agent
- [ ] Creates judge with default config (Gemini 3.0 Pro)
- [ ] Evaluates debate successfully
- [ ] Returns structured verdict
- [ ] Uses Google API (check logs)
- [ ] Falls back to OpenRouter if Google fails

### Fact-Checker Agent
- [ ] Extracts claims from speech
- [ ] Verifies claims using GPT-5.1
- [ ] Returns fact-check results
- [ ] Uses OpenAI API (check logs)
- [ ] Falls back to OpenRouter if OpenAI fails

### Debater Agent
- [ ] Generates turn using OpenRouter
- [ ] Supports multiple models
- [ ] Returns RCR-structured response
- [ ] Uses OpenRouter API (check logs)

### Moderator Agent
- [ ] Announces rounds (no LLM)
- [ ] Validates word counts
- [ ] Enforces rules
- [ ] Zero API calls

## End-to-End Tests

### Simple Debate (3 rounds)
```bash
# Start debate with frontier models
npm run debate:test -- \
  --topic "AI will replace most jobs by 2030" \
  --pro "anthropic/claude-4.5-sonnet" \
  --con "openai/gpt-5.1" \
  --rounds 3
```

**Verify:**
- [ ] Debate completes successfully
- [ ] Judge uses Gemini 3.0 Pro (Google API)
- [ ] Fact-Checker uses GPT-5.1 (OpenAI API)
- [ ] Debaters use OpenRouter
- [ ] Total cost ~$0.37
- [ ] Completion time <5 minutes
- [ ] No errors in logs

### Fallback Test (Disable Primary APIs)
```bash
# Temporarily disable primary APIs
export GOOGLE_API_KEY_BACKUP=$GOOGLE_API_KEY
export OPENAI_API_KEY_BACKUP=$OPENAI_API_KEY
unset GOOGLE_API_KEY
unset OPENAI_API_KEY

# Run debate
npm run debate:test -- \
  --topic "Test fallback" \
  --pro "anthropic/claude-4.5-sonnet" \
  --con "openai/gpt-5.1" \
  --rounds 1

# Restore keys
export GOOGLE_API_KEY=$GOOGLE_API_KEY_BACKUP
export OPENAI_API_KEY=$OPENAI_API_KEY_BACKUP
```

**Verify:**
- [ ] Debate completes successfully
- [ ] Judge falls back to OpenRouter
- [ ] Fact-Checker falls back to OpenRouter
- [ ] Fallback logged in monitoring
- [ ] Slightly higher latency (~200ms)
- [ ] Slightly higher cost (~$0.03)

### Model Variety Test
```bash
# Test different debater models
for model in \
  "anthropic/claude-4.5-sonnet" \
  "openai/gpt-5.1" \
  "google/gemini-3-pro-preview" \
  "qwen/qwen-3-72b-instruct" \
  "deepseek/deepseek-chat"
do
  npm run debate:test -- \
    --topic "Test model: $model" \
    --pro "$model" \
    --con "anthropic/claude-3.5-sonnet" \
    --rounds 1
done
```

**Verify:**
- [ ] All models work via OpenRouter
- [ ] Different costs per model
- [ ] Different response styles
- [ ] No errors

## Performance Tests

### Latency Measurement
```bash
# Run 10 debates and measure average latency
npm run benchmark:latency -- --count 10
```

**Expected:**
- [ ] Judge latency: <1000ms
- [ ] Fact-Checker latency: <800ms
- [ ] Debater latency: <1500ms
- [ ] Total debate time: <5 minutes

### Cost Tracking
```bash
# Run 10 debates and track costs
npm run benchmark:cost -- --count 10
```

**Expected:**
- [ ] Infrastructure cost: ~$0.17 per debate
- [ ] Debater cost: $0.05-$0.20 per debate
- [ ] Total cost: $0.22-$0.37 per debate
- [ ] Matches estimates within 10%

### Fallback Rate
```bash
# Monitor fallback rate over 100 debates
npm run monitor:fallback -- --count 100
```

**Expected:**
- [ ] Fallback rate: <10%
- [ ] Most fallbacks are transient errors
- [ ] No systematic failures

## Monitoring Tests

### Cost Logging
- [ ] Each LLM call logged with cost
- [ ] Costs aggregated by role
- [ ] Costs aggregated by debate
- [ ] Daily spending tracked
- [ ] Alerts trigger at 80% of cap

### Fallback Logging
- [ ] Fallback events logged
- [ ] Includes primary provider
- [ ] Includes fallback provider
- [ ] Includes error reason
- [ ] Includes timestamp

### Error Tracking
- [ ] API errors logged
- [ ] Fallback failures logged
- [ ] Invalid model selections logged
- [ ] Rate limit errors logged

## Production Readiness

### Configuration
- [ ] All API keys in production environment
- [ ] Rate limits configured
- [ ] Daily spending caps set
- [ ] Monitoring alerts configured

### Documentation
- [ ] Team trained on hybrid architecture
- [ ] Runbooks updated
- [ ] Troubleshooting guide available
- [ ] Cost optimization guide available

### Rollback Plan
- [ ] Can revert to OpenRouter-only if needed
- [ ] Database compatible with both architectures
- [ ] No breaking changes to API
- [ ] Feature flags for gradual rollout

## Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Ready for staging

### QA Team
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Cost tracking verified
- [ ] Ready for production

### Operations Team
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Runbooks updated
- [ ] Ready for production

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor fallback rate
- [ ] Monitor costs vs estimates
- [ ] Monitor latency
- [ ] Monitor error rate
- [ ] Check user feedback

### First Week
- [ ] Analyze cost trends
- [ ] Analyze performance trends
- [ ] Identify optimization opportunities
- [ ] Adjust model assignments if needed

### First Month
- [ ] Generate cost report
- [ ] Generate performance report
- [ ] A/B test alternative models
- [ ] Implement optimizations

## Success Criteria

✅ **All tests passing**  
✅ **Fallback rate <10%**  
✅ **Costs within 10% of estimates**  
✅ **Latency improved vs baseline**  
✅ **Zero production incidents**  
✅ **Positive user feedback**  

---

**Status:** Ready for testing  
**Next Step:** Run API key verification  
**Blocker:** None  
