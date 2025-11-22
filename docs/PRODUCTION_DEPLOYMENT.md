# Production Deployment Guide

This guide walks you through deploying AI Debate Arena to production on Render with full monitoring enabled.

## 📋 Pre-Deployment Checklist

### 1. Prerequisites

- [ ] GitHub repository with all code pushed
- [ ] Render account ([sign up here](https://dashboard.render.com))
- [ ] Neon database production instance
- [ ] Upstash Redis production instance
- [ ] All API keys ready:
  - [ ] OpenAI API key
  - [ ] Google API key (Gemini)
  - [ ] xAI API key (Grok)
  - [ ] Tavily API key (fact-checking)
  - [ ] Stack Auth credentials
  - [ ] OpenRouter API key (optional)

### 2. Run Pre-Flight Checks

```bash
npm run deploy:check
```

This will verify:
- ✅ Node.js version (>= 18.x)
- ✅ Dependencies installed
- ✅ TypeScript compilation
- ✅ ESLint passes
- ✅ Environment variables set
- ✅ Database connection
- ✅ Production build succeeds
- ✅ Critical files exist
- ✅ Git status clean
- ✅ No high-severity vulnerabilities

**Fix any issues before proceeding!**

## 🗄️ Step 1: Prepare Production Database

### 1.1 Create Neon Production Database

1. Go to [Neon Console](https://console.neon.tech)
2. Click **"New Project"**
3. Name: `ai-debate-arena-prod`
4. Region: Choose closest to your users (e.g., `US East`, `EU Frankfurt`)
5. Click **"Create Project"**

### 1.2 Get Pooled Connection String

**Important:** Use the pooled connection for production!

1. In Neon dashboard, go to **"Connection Details"**
2. Select **"Pooled connection"**
3. Copy the connection string (includes `pooler` in hostname)
4. Example: `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/db?sslmode=require`

### 1.3 Run Migrations

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your_pooled_connection_string"

# Run migrations
npm run db:push

# Seed initial data
npm run db:seed
```

### 1.4 Enable Connection Pooling

In Neon dashboard:
1. Go to **"Settings"** → **"Compute"**
2. Enable **"Connection Pooling"**
3. Set pool size: **20** (adjust based on traffic)

## 🚀 Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

#### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub account
4. Select repository: `ai-debate-arena`
5. Configure:

**Basic Settings:**
```
Name: ai-debate-arena
Region: Frankfurt (or closest to users)
Branch: main
Root Directory: (leave blank)
```

**Build & Deploy:**
```
Build Command: npm install && npm run build
Start Command: npm run start
```

**Plan:**
- Start with **Starter** ($7/month) for testing
- Upgrade to **Standard** ($25/month) for production traffic

6. Click **"Create Web Service"**

#### 2.2 Configure Environment Variables

In Render dashboard, go to **"Environment"** tab:

**Database:**
```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
```

**Cache:**
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**LLM Providers:**
```
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...
```

**Authentication:**
```
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_...
STACK_SECRET_SERVER_KEY=ssk_...
NEXTAUTH_SECRET=your_secret_min_32_chars
NEXTAUTH_URL=https://your-app.onrender.com
```

**Application Settings:**
```
NODE_ENV=production
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=500
DAILY_SPENDING_CAP_PROD=500
```

**Monitoring (Optional):**
```
SENTRY_DSN=https://your-sentry-dsn (optional)
```

7. Click **"Save Changes"** - Render will auto-deploy

### Option B: Using render.yaml (Infrastructure as Code)

1. The `render.yaml` file is already configured
2. Go to Render Dashboard → **"New +"** → **"Blueprint"**
3. Connect repository
4. Render detects `render.yaml` automatically
5. Review settings
6. Add environment variables (same as above)
7. Click **"Apply"**

## 📊 Step 3: Enable Monitoring

### 3.1 Health Check Endpoint

Render automatically monitors `/api/health`:

- **Endpoint:** `https://your-app.onrender.com/api/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Expected Response:** 200 OK

Test it manually:
```bash
curl https://your-app.onrender.com/api/health | jq '.'
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "uptime_seconds": 3600,
  "response_time_ms": 45,
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 45,
      "healthy": true
    },
    "cache": {
      "status": "connected",
      "latency_ms": 12,
      "healthy": true
    },
    "api_keys": {
      "configured": {
        "openai": true,
        "google": true,
        "xai": true,
        "tavily": true
      },
      "missing": [],
      "healthy": true
    }
  },
  "environment": "production",
  "version": "1.0.0"
}
```

### 3.2 Monitoring Dashboard

Access the admin monitoring dashboard:

1. Navigate to: `https://your-app.onrender.com/admin/monitoring`
2. Sign in with admin account
3. View real-time metrics:
   - System health
   - Debate statistics
   - API costs
   - Performance metrics

### 3.3 Metrics API

Query metrics programmatically:

```bash
# Get 24-hour metrics
curl https://your-app.onrender.com/api/monitoring/metrics?range=24h | jq '.'

# Get cost metrics
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.'
```

### 3.4 Set Up Alerts

In Render dashboard:

1. Go to **"Settings"** → **"Notifications"**
2. Add notification channels:
   - Email
   - Slack webhook
   - Discord webhook
3. Configure alerts for:
   - Deploy failures
   - Health check failures
   - High error rates
   - High memory usage

### 3.5 Sentry Error Tracking (Optional)

1. Sign up at [Sentry.io](https://sentry.io)
2. Create new project: **"Next.js"**
3. Copy DSN
4. Add to Render environment variables:
   ```
   SENTRY_DSN=https://your-sentry-dsn
   ```
5. Redeploy

## 🔄 Step 4: Set Up CI/CD

### 4.1 GitHub Actions

The workflow is already configured in `.github/workflows/deploy.yml`

Add these secrets to your GitHub repository:

1. Go to GitHub repo → **"Settings"** → **"Secrets and variables"** → **"Actions"**
2. Add secrets:

```
RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxx?key=xxx
RENDER_APP_URL=https://your-app.onrender.com
```

To get the deploy hook:
1. Render dashboard → Your service → **"Settings"** → **"Deploy Hook"**
2. Copy the webhook URL

### 4.2 Auto-Deploy on Push

Already configured! Every push to `main` will:
1. Run tests and linting
2. Run security audit
3. Trigger Render deployment
4. Wait for deployment
5. Run health check
6. Fetch metrics

### 4.3 Manual Deployment

```bash
# Run pre-flight checks and deploy
npm run deploy:prod

# Or manually
npm run deploy:check
git push origin main
```

## 🔍 Step 5: Post-Deployment Verification

### 5.1 Verify Deployment

1. **Check Render logs:**
   - Render dashboard → Your service → **"Logs"**
   - Look for: `✓ Ready in Xms`

2. **Test health endpoint:**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

3. **Test main page:**
   ```bash
   curl https://your-app.onrender.com
   ```

4. **Check monitoring dashboard:**
   - Visit: `https://your-app.onrender.com/admin/monitoring`

### 5.2 Run Smoke Tests

Test critical functionality:

1. **Start a debate:**
   - Go to homepage
   - Select models and topic
   - Start debate
   - Verify streaming works

2. **Vote on a debate:**
   - View completed debate
   - Cast vote
   - Verify vote recorded

3. **Check leaderboard:**
   - Visit `/leaderboard`
   - Verify models displayed
   - Check ratings

4. **Test authentication:**
   - Sign in with Google/GitHub
   - Verify user profile
   - Sign out

### 5.3 Monitor Initial Traffic

Watch for the first hour:

1. **Render Metrics:**
   - CPU usage
   - Memory usage
   - Request rate
   - Response times

2. **Application Metrics:**
   - Debate completion rate
   - API costs
   - Error rate

3. **Database Performance:**
   - Query latency
   - Connection pool usage

## 📈 Step 6: Scaling & Optimization

### 6.1 Vertical Scaling (More Resources)

If you see high CPU/memory usage:

1. Render dashboard → **"Settings"** → **"Instance Type"**
2. Upgrade plan:
   - Starter: 512 MB RAM, 0.5 CPU
   - Standard: 2 GB RAM, 1 CPU
   - Pro: 4 GB RAM, 2 CPU

### 6.2 Horizontal Scaling (More Instances)

For high traffic:

1. Render dashboard → **"Settings"** → **"Scaling"**
2. Increase instances: 1 → 2 → 3
3. Render automatically load balances

**Cost:** Each instance costs the plan price (e.g., 3 × $25 = $75/month)

### 6.3 Database Scaling

If database is slow:

1. **Neon Console** → Your project → **"Settings"**
2. Upgrade compute:
   - Scale: 0.25 → 0.5 → 1 → 2 CU
3. Enable autoscaling:
   - Min: 0.25 CU
   - Max: 2 CU

### 6.4 Cache Optimization

If cache is slow:

1. **Upstash Console** → Your database
2. Upgrade plan for more throughput
3. Enable regional replication

## 💰 Step 7: Cost Management

### 7.1 Monitor Spending

Check daily:
```bash
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.summary'
```

### 7.2 Set Spending Alerts

The app automatically alerts when:
- 80% of daily cap reached (warning)
- 100% of daily cap reached (critical)

Adjust cap in environment variables:
```
DAILY_SPENDING_CAP_PROD=500
```

### 7.3 Optimize Costs

**LLM Usage:**
- Use GPT-4o-mini for moderator (cheap)
- Use Gemini 3.0 for judge (cost-effective)
- Cache frequently used prompts

**Database:**
- Use connection pooling
- Enable autoscaling (pay only for what you use)
- Archive old debates

**Render:**
- Start with Starter plan
- Scale up only when needed
- Use auto-scaling for traffic spikes

### 7.4 Expected Costs

**Development (Low Traffic):**
- Render: $7/month (Starter)
- Neon: $0/month (Free tier)
- Upstash: $0/month (Free tier)
- LLM APIs: ~$50/month
- **Total: ~$57/month**

**Production (Moderate Traffic):**
- Render: $25/month (Standard)
- Neon: $19/month (Scale)
- Upstash: $10/month (Pro)
- LLM APIs: ~$200/month
- **Total: ~$254/month**

**Production (High Traffic):**
- Render: $75/month (3× Standard)
- Neon: $69/month (Business)
- Upstash: $30/month (Enterprise)
- LLM APIs: ~$500/month
- **Total: ~$674/month**

## 🔧 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Locally verify build
npm ci
npm run build
```

**Error: "TypeScript errors"**
```bash
# Check types
npx tsc --noEmit
```

### Database Connection Issues

**Error: "Connection timeout"**
- Verify using pooled connection string
- Check Neon dashboard for database status
- Test connection locally:
  ```bash
  psql "your_connection_string"
  ```

### Health Check Failures

**Error: "Health check failed"**
1. Check Render logs for errors
2. Test health endpoint manually
3. Verify all environment variables set
4. Check database connectivity

### High Costs

**Alert: "Daily spending cap exceeded"**
1. Check cost breakdown: `/api/monitoring/costs`
2. Identify expensive models/operations
3. Optimize prompts to reduce tokens
4. Consider cheaper model alternatives
5. Implement request caching

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Upstash Redis](https://docs.upstash.com/redis)

## 🆘 Support

If you encounter issues:

1. Check Render logs
2. Check application logs: `/api/monitoring/metrics`
3. Review health endpoint: `/api/health`
4. Check GitHub Issues
5. Contact support

## ✅ Deployment Complete!

Your AI Debate Arena is now live in production with full monitoring enabled!

**Next Steps:**
1. Share the URL with users
2. Monitor metrics daily
3. Gather user feedback
4. Iterate and improve

**Monitoring URLs:**
- Health: `https://your-app.onrender.com/api/health`
- Metrics: `https://your-app.onrender.com/api/monitoring/metrics`
- Costs: `https://your-app.onrender.com/api/monitoring/costs`
- Dashboard: `https://your-app.onrender.com/admin/monitoring`

🎉 **Congratulations on your deployment!**
