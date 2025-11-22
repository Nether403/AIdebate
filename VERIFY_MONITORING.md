# ✅ Verify Your Monitoring Setup

You're already deployed at **LLMArgument.com**! Now let's verify the monitoring infrastructure is working.

## 🎯 Quick Verification (5 minutes)

### 1. Test Health Endpoint

```bash
curl https://llmargument.com/api/health | jq '.'
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-22T...",
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
        "openrouter": true,
        "tavily": true
      },
      "missing": [],
      "healthy": true
    },
    "authentication": {
      "stack_auth": true,
      "healthy": true
    }
  },
  "environment": "production",
  "version": "1.0.0"
}
```

✅ **If you see `"status": "healthy"` - you're good!**

### 2. Test Metrics Endpoint

```bash
curl https://llmargument.com/api/monitoring/metrics?range=24h | jq '.'
```

**Expected Response:**
```json
{
  "timestamp": "2025-11-22T...",
  "time_range": "24h",
  "metrics": {
    "debates": {
      "total": 10,
      "completed": 8,
      "active": 1,
      "failed": 1
    },
    "votes": {
      "total": 50,
      "recent": 20
    },
    "betting": {
      "total": 15,
      "totalWagered": 5000,
      "avgWager": 333
    },
    "performance": {
      "avg_debate_duration_seconds": 180,
      "debates_per_hour": 0.4,
      "votes_per_hour": 2,
      "completion_rate": "80.00",
      "failure_rate": "10.00"
    }
  },
  "health": {
    "debates_healthy": true,
    "performance_healthy": true,
    "activity_healthy": true
  }
}
```

✅ **If you get metrics data - monitoring is working!**

### 3. Test Cost Monitoring

```bash
curl https://llmargument.com/api/monitoring/costs?range=24h | jq '.'
```

**Expected Response:**
```json
{
  "timestamp": "2025-11-22T...",
  "time_range": "24h",
  "note": "Cost estimates based on debate activity...",
  "summary": {
    "total_cost": 2.5,
    "total_debates": 10,
    "completed_debates": 8,
    "total_turns": 48,
    "estimated_tokens": 120000,
    "avg_cost_per_debate": 0.31,
    "spending_rate_per_hour": 0.10,
    "projected_daily_cost": 2.4,
    "projected_monthly_cost": 72
  },
  "spending_cap": {
    "daily_limit": 500,
    "current_daily_spending": 2.5,
    "percentage_used": "0.50",
    "remaining": 497.5
  },
  "alerts": []
}
```

✅ **If you see cost estimates - cost monitoring is working!**

### 4. Access Admin Dashboard

Visit: **https://llmargument.com/admin/monitoring**

You should see:
- System health status cards
- Performance metrics
- Cost tracking
- Real-time updates every 30 seconds

✅ **If the dashboard loads - you're all set!**

## 🔧 If Something Doesn't Work

### Health Check Returns 503 or Error

**Check Render logs:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Click "Logs" tab
4. Look for errors

**Common issues:**
- Database connection failed → Check DATABASE_URL in Render env vars
- Missing API keys → Verify all keys are set in Render
- Build failed → Check build logs

### Endpoints Return 404

**Redeploy the new code:**
```bash
# Make sure all changes are committed
git add .
git commit -m "Add monitoring infrastructure"
git push origin main
```

Render will automatically redeploy.

### Dashboard Shows "Loading..." Forever

**Check browser console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors

**Common issues:**
- CORS errors → Check NEXTAUTH_URL is set to https://llmargument.com
- Authentication errors → Verify Stack Auth credentials
- API errors → Check network tab for failed requests

## 📊 Daily Monitoring Routine

### Quick Health Check (30 seconds)

```bash
# Save this as check-health.sh
#!/bin/bash

echo "🔍 Checking LLMArgument.com Health..."
echo ""

# Health
health=$(curl -s https://llmargument.com/api/health)
status=$(echo $health | jq -r '.status')
db_latency=$(echo $health | jq -r '.services.database.latency_ms')

if [ "$status" = "healthy" ]; then
  echo "✅ Status: $status"
else
  echo "❌ Status: $status"
fi
echo "   Database: ${db_latency}ms"
echo ""

# Metrics (24h)
metrics=$(curl -s https://llmargument.com/api/monitoring/metrics?range=24h)
debates=$(echo $metrics | jq -r '.metrics.debates.total')
completed=$(echo $metrics | jq -r '.metrics.debates.completed')
completion_rate=$(echo $metrics | jq -r '.metrics.performance.completion_rate')

echo "📊 Last 24 Hours:"
echo "   Debates: $debates ($completed completed)"
echo "   Completion Rate: ${completion_rate}%"
echo ""

# Costs
costs=$(curl -s https://llmargument.com/api/monitoring/costs?range=24h)
total_cost=$(echo $costs | jq -r '.summary.total_cost')
daily_projection=$(echo $costs | jq -r '.summary.projected_daily_cost')
percentage_used=$(echo $costs | jq -r '.spending_cap.percentage_used')

echo "💰 Costs:"
echo "   Total (24h): \$${total_cost}"
echo "   Daily Projection: \$${daily_projection}"
echo "   Budget Used: ${percentage_used}%"
echo ""

# Alerts
alerts=$(echo $costs | jq -r '.alerts | length')
if [ "$alerts" -gt 0 ]; then
  echo "🚨 Alerts:"
  echo $costs | jq -r '.alerts[] | "   [\(.level | ascii_upcase)] \(.message)"'
fi
```

Make it executable:
```bash
chmod +x check-health.sh
./check-health.sh
```

### Or Just Visit the Dashboard

**Easiest option:** Bookmark https://llmargument.com/admin/monitoring

Check it once a day to see:
- System health
- Debate activity
- Cost trends
- Any alerts

## 🎯 What to Watch For

### Daily Checks
- ✅ Health status: "healthy"
- ✅ Database latency: < 100ms
- ✅ Completion rate: > 90%
- ✅ Daily spending: < 80% of cap ($400)

### Weekly Reviews
- 📈 Debate volume trends
- 💰 Cost per debate trends
- 🎯 Model performance
- 🐛 Error patterns

### Monthly Reviews
- 💵 Total spending vs budget
- 📊 User growth
- ⚡ Performance optimization opportunities
- 🔒 Security audit

## 🚨 Alert Thresholds

The system automatically alerts when:

**Warning (80% of cap):**
```json
{
  "level": "warning",
  "message": "Approaching daily spending cap: $400 / $500"
}
```

**Critical (100% of cap):**
```json
{
  "level": "critical",
  "message": "Daily spending cap exceeded: $510 / $500"
}
```

## 📱 Set Up Slack Alerts (Optional)

Create a webhook in Slack, then add this to your monitoring script:

```bash
#!/bin/bash

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Get health and costs
health=$(curl -s https://llmargument.com/api/health)
costs=$(curl -s https://llmargument.com/api/monitoring/costs?range=24h)

status=$(echo $health | jq -r '.status')
alerts=$(echo $costs | jq -r '.alerts')

# Send to Slack if unhealthy or alerts exist
if [ "$status" != "healthy" ] || [ "$(echo $alerts | jq 'length')" -gt 0 ]; then
  message="🚨 *LLMArgument.com Alert*\n\nStatus: $status\n\nAlerts:\n$(echo $alerts | jq -r '.[] | "• [\(.level)] \(.message)"')"
  
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$message\"}"
fi
```

Run this hourly with cron:
```bash
crontab -e
# Add this line:
0 * * * * /path/to/your/alert-script.sh
```

## ✅ You're All Set!

Your monitoring infrastructure is deployed and ready. Here's what you have:

1. **Health Check** - `/api/health` - Tests all services
2. **Metrics API** - `/api/monitoring/metrics` - Tracks performance
3. **Cost API** - `/api/monitoring/costs` - Monitors spending
4. **Dashboard** - `/admin/monitoring` - Visual monitoring

**Bookmark these:**
- 🏥 Health: https://llmargument.com/api/health
- 📊 Metrics: https://llmargument.com/api/monitoring/metrics?range=24h
- 💰 Costs: https://llmargument.com/api/monitoring/costs?range=24h
- 🖥️ Dashboard: https://llmargument.com/admin/monitoring

**Next:** Just run the verification commands above to make sure everything works!
