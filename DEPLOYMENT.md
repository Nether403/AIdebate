# Deployment Guide - Render

This guide walks you through deploying the AI Debate Arena to Render.

## Prerequisites

- GitHub repository with all code pushed
- Render account (free tier available)
- Neon database (production instance)
- Upstash Redis (production instance)
- All API keys ready (OpenAI, Google, xAI, etc.)

## Step 1: Prepare Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a production database (or use existing)
3. **Important**: Copy the connection string with **connection pooling enabled**
   - Use the "Pooled connection" string
   - It should include `?pgbouncer=true` or use the pooler endpoint
   - Example: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`

4. Run migrations:
   ```bash
   npm run db:push
   ```

5. Seed initial data:
   ```bash
   npm run db:seed
   ```

## Step 2: Set Up Render Service

### Option A: Using Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository: `ai-debate-arena`
5. Configure the service:

   **Basic Settings:**
   - Name: `ai-debate-arena`
   - Region: `Frankfurt` (or closest to your users)
   - Branch: `main`
   - Root Directory: (leave blank)
   
   **Build & Deploy:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   
   **Plan:**
   - Start with `Starter` ($7/month)
   - Upgrade to `Standard` for production traffic

6. Click **"Create Web Service"**

### Option B: Using render.yaml (Infrastructure as Code)

1. The `render.yaml` file is already in the repository
2. Go to Render Dashboard → **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically detect `render.yaml`
5. Review settings and click **"Apply"**

## Step 3: Configure Environment Variables

In the Render dashboard for your service, go to **"Environment"** tab and add:

### Database
```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
```

### Cache
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### LLM Providers
```
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-... (optional)
```

### Search API
```
TAVILY_API_KEY=tvly-...
```

### Authentication (Stack Auth)
```
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_...
STACK_SECRET_SERVER_KEY=ssk_...
```

### NextAuth
```
NEXTAUTH_SECRET=your_secret_min_32_chars
NEXTAUTH_URL=https://your-app.onrender.com
```

### Application Settings
```
NODE_ENV=production
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=500
DAILY_SPENDING_CAP_PROD=500
```

**Important**: After adding environment variables, click **"Save Changes"** and Render will automatically redeploy.

## Step 4: Configure Custom Domain (Optional)

1. In Render dashboard, go to **"Settings"** → **"Custom Domain"**
2. Add your domain (e.g., `debate.yourdomain.com`)
3. Update DNS records as instructed by Render
4. SSL certificate will be automatically provisioned

## Step 5: Enable Auto-Deploy

1. Go to **"Settings"** → **"Build & Deploy"**
2. Enable **"Auto-Deploy"** for `main` branch
3. Enable **"Preview Environments"** for pull requests (optional)

## Step 6: Set Up Health Checks

Render automatically monitors the `/api/health` endpoint:

- **Health Check Path**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

If health checks fail, Render will alert you and attempt to restart the service.

## Step 7: Configure Deploy Hooks (Optional)

For manual deployments or CI/CD integration:

1. Go to **"Settings"** → **"Deploy Hook"**
2. Copy the webhook URL
3. Use it in GitHub Actions or other CI/CD tools

## Step 8: Monitor Deployment

### First Deployment
1. Watch the build logs in Render dashboard
2. Build should complete in 3-5 minutes
3. Once deployed, visit your app URL: `https://your-app.onrender.com`
4. Check health endpoint: `https://your-app.onrender.com/api/health`

### Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 45
    },
    "api": {
      "status": "operational"
    }
  },
  "environment": "production"
}
```

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Build command failed"**
- Solution: Check build logs for specific errors
- Verify TypeScript types are correct: `npm run type-check`

### Database Connection Issues

**Error: "Connection timeout"**
- Solution: Verify you're using the **pooled connection string** from Neon
- Check that connection string includes `?pgbouncer=true` or uses pooler endpoint

**Error: "Too many connections"**
- Solution: Enable connection pooling in Neon
- Use the pooler endpoint: `ep-xxx-pooler.region.aws.neon.tech`

### Environment Variable Issues

**Error: "API key not found"**
- Solution: Double-check all environment variables are set in Render dashboard
- Remember: `NEXT_PUBLIC_*` variables are exposed to browser
- Redeploy after adding variables

### Health Check Failures

**Error: "Health check failed"**
- Solution: Check `/api/health` endpoint manually
- Verify database connection is working
- Check Render logs for specific errors

## Monitoring & Alerts

### Render Metrics
- Go to **"Metrics"** tab to view:
  - CPU usage
  - Memory usage
  - Request rate
  - Response times

### Set Up Alerts
1. Go to **"Settings"** → **"Notifications"**
2. Add email or Slack webhook
3. Configure alerts for:
   - Deploy failures
   - Health check failures
   - High error rates

### Error Tracking (Optional)
Add Sentry for detailed error tracking:
```
SENTRY_DSN=https://your-sentry-dsn
```

## Scaling

### Vertical Scaling (More Resources)
- Upgrade plan: Starter → Standard → Pro
- More CPU and memory per instance

### Horizontal Scaling (More Instances)
- Go to **"Settings"** → **"Scaling"**
- Increase number of instances
- Render automatically load balances

## Cost Optimization

### Development
- Use Starter plan ($7/month)
- Single instance
- Monitor API costs daily

### Production
- Standard plan ($25/month) for better performance
- 2-3 instances for high availability
- Set spending caps in environment variables

### Database
- Neon Free tier: 0.5 GB storage, 3 GB data transfer
- Scale plan: $19/month for 10 GB storage
- Enable autoscaling for compute

## Rollback

If a deployment breaks production:

1. Go to **"Events"** tab
2. Find the last working deployment
3. Click **"Rollback"** next to that deployment
4. Confirm rollback

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## Maintenance

### Regular Tasks
- Monitor API costs weekly
- Review error logs daily
- Update dependencies monthly
- Backup database weekly (Neon handles this automatically)

### Database Migrations
```bash
# Run migrations on production
npm run db:push

# Or use Neon branching for safe migrations
# 1. Create branch in Neon
# 2. Test migration on branch
# 3. Merge branch to main
```

## Support

- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Project Issues: GitHub Issues

## Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Initial data seeded
- [ ] Health check endpoint working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring and alerts set up
- [ ] Error tracking configured
- [ ] Spending caps set
- [ ] Backup strategy confirmed
- [ ] Team has access to Render dashboard
- [ ] Documentation updated with production URLs
