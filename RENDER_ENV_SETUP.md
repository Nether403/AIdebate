# Render Environment Variables Setup Guide

## Variables That MUST Change for Production

### 1. NODE_ENV ⚠️ MUST CHANGE
```bash
# Development (.env)
NODE_ENV=development

# Production (Render)
NODE_ENV=production
```

### 2. NEXTAUTH_URL ⚠️ MUST CHANGE
```bash
# Development (.env)
NEXTAUTH_URL=http://localhost:3000

# Production (Render)
NEXTAUTH_URL=https://your-app-name.onrender.com
```
**Note:** Replace `your-app-name` with your actual Render service name

### 3. DATABASE_URL ⚠️ VERIFY POOLING
```bash
# Make sure your connection string has -pooler in the hostname
DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require
```
✅ Ensure your connection string has `-pooler` in the hostname for production!

**If you want a separate production database:**
- Create a new Neon database for production
- Use the **pooled connection string** (with `-pooler` in hostname)

## Variables That Stay The Same

These can be copied directly from your `.env` to Render:

### Database (if using same Neon database)
```bash
DATABASE_URL=your_neon_database_url_with_pooler
```

### Cache
```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### LLM Providers
```bash
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
XAI_API_KEY=your_xai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Search API
```bash
TAVILY_API_KEY=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
```

### Authentication (Stack Auth)
```bash
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
```

### NextAuth
```bash
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Rate Limiting
```bash
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=500
```

## Variables You Don't Need in Render

These are development-only and should NOT be added to Render:

```bash
# ❌ Don't add these to Render
DAILY_SPENDING_CAP_DEV=10
DAILY_SPENDING_CAP_STAGING=50
SENTRY_DSN=  # Empty, not needed yet
```

## New Variable for Production

Add this spending cap for production:

```bash
DAILY_SPENDING_CAP_PROD=500
```

## Complete Render Environment Variables List

Copy and paste these into Render's Environment Variables section:

```bash
# Database
DATABASE_URL=your_neon_database_url_with_pooler

# Cache
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# LLM Providers
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
XAI_API_KEY=your_xai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Authentication
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app-name.onrender.com

# Application Settings
NODE_ENV=production
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=500
DAILY_SPENDING_CAP_PROD=500
```

## Important Notes

### 1. Anthropic API Key
Your `.env` has an empty `ANTHROPIC_API_KEY`. This is fine - the app will work without it since you have other providers configured. If you want to add Claude 4.5 support later, you can add this key in Render.

### 2. Tavily API Key
Your key starts with `tvly-dev-` which suggests it's a development key. You may want to:
- Check if Tavily has separate production keys
- Monitor usage limits
- Consider upgrading to a production plan if needed

### 3. Database Recommendation
For production, consider:
- Creating a separate Neon database for production (recommended)
- Or using the same database but with different schema/tables
- Your current connection already has pooling enabled ✅

### 4. Security Best Practices
- ✅ Your API keys are already secure (not in git)
- ✅ Connection pooling is enabled
- ✅ SSL is required in connection string
- Consider rotating keys after deployment for extra security

## Step-by-Step Render Setup

1. **Go to Render Dashboard** → Your Service → Environment

2. **Click "Add Environment Variable"**

3. **Add each variable one by one** (or use bulk add if available)

4. **IMPORTANT: Update these two values:**
   - `NODE_ENV` → `production`
   - `NEXTAUTH_URL` → `https://your-actual-app-name.onrender.com`

5. **Click "Save Changes"**

6. **Render will automatically redeploy** with new environment variables

## Verification Checklist

After deployment, verify:
- [ ] Health check endpoint returns healthy status
- [ ] Database connection works (check health endpoint)
- [ ] Redis cache works
- [ ] Can create a test debate
- [ ] LLM providers respond correctly
- [ ] Authentication works (if testing)

## Troubleshooting

### If health check fails:
1. Check Render logs for errors
2. Verify `DATABASE_URL` has `-pooler` in hostname
3. Verify all API keys are correct
4. Check that `NODE_ENV=production`

### If database connection fails:
1. Verify Neon database is active
2. Check connection string is correct
3. Ensure pooling is enabled (you already have this ✅)
4. Check Neon dashboard for connection limits

### If API calls fail:
1. Verify API keys are valid
2. Check API provider dashboards for usage/limits
3. Monitor Render logs for specific errors
4. Verify spending caps aren't blocking calls

## Summary

**Only 2 variables need to change:**
1. ✅ `NODE_ENV`: `development` → `production`
2. ✅ `NEXTAUTH_URL`: `http://localhost:3000` → `https://your-app.onrender.com`

**Everything else can be copied as-is from your `.env` file!**

Your setup is already production-ready with proper connection pooling and secure API keys. 🎉
