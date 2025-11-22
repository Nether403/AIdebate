# Monitoring Quick Reference

Quick commands and URLs for monitoring your production deployment.

## 🔗 Monitoring URLs

Replace `your-app.onrender.com` with your actual domain:

```
Health Check:    https://your-app.onrender.com/api/health
Metrics API:     https://your-app.onrender.com/api/monitoring/metrics
Cost API:        https://your-app.onrender.com/api/monitoring/costs
Admin Dashboard: https://your-app.onrender.com/admin/monitoring
Render Dashboard: https://dashboard.render.com
```

## 📊 Quick Health Check

```bash
# Check system health
curl https://your-app.onrender.com/api/health | jq '.'

# Check if healthy (returns 0 if healthy, 1 if not)
curl -s https://your-app.onrender.com/api/health | jq -e '.status == "healthy"'
```

## 📈 Metrics Commands

```bash
# Get 24-hour metrics
curl https://your-app.onrender.com/api/monitoring/metrics?range=24h | jq '.'

# Get just debate stats
curl https://your-app.onrender.com/api/monitoring/metrics?range=24h | jq '.metrics.debates'

# Get performance metrics
curl https://your-app.onrender.com/api/monitoring/metrics?range=24h | jq '.metrics.performance'

# Check health indicators
curl https://your-app.onrender.com/api/monitoring/metrics?range=24h | jq '.health'
```

## 💰 Cost Monitoring Commands

```bash
# Get 24-hour costs
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.'

# Get cost summary
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.summary'

# Check spending cap status
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.spending_cap'

# Get cost alerts
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.alerts'

# Get spending by provider
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.by_provider'

# Get most expensive calls
curl https://your-app.onrender.com/api/monitoring/costs?range=24h | jq '.expensive_calls'
```

## 🚨 Alert Thresholds

### System Health
- ✅ **Healthy:** All services operational
- ⚠️ **Degraded:** Some services slow (DB > 1s, Cache > 500ms)
- ❌ **Unhealthy:** Critical services down

### Database Latency
- ✅ **Good:** < 100ms
- ⚠️ **Slow:** 100-1000ms
- ❌ **Critical:** > 1000ms

### Debate Performance
- ✅ **Good:** < 5 minutes average
- ⚠️ **Slow:** 5-10 minutes
- ❌ **Critical:** > 10 minutes

### Failure Rate
- ✅ **Good:** < 5%
- ⚠️ **Warning:** 5-10%
- ❌ **Critical:** > 10%

### Spending
- ✅ **Good:** < 80% of daily cap
- ⚠️ **Warning:** 80-100% of daily cap
- ❌ **Critical:** > 100% of daily cap

## 📱 Monitoring Script

Save this as `monitor.sh`:

```bash
#!/bin/bash

APP_URL="https://your-app.onrender.com"

echo "🔍 AI Debate Arena - System Status"
echo "=================================="
echo ""

# Health Check
echo "📊 System Health:"
health=$(curl -s "$APP_URL/api/health")
status=$(echo $health | jq -r '.status')
db_latency=$(echo $health | jq -r '.services.database.latency_ms')
uptime=$(echo $health | jq -r '.uptime_seconds')

if [ "$status" = "healthy" ]; then
  echo "✅ Status: $status"
else
  echo "❌ Status: $status"
fi
echo "   Database: ${db_latency}ms"
echo "   Uptime: $((uptime / 3600))h $((uptime % 3600 / 60))m"
echo ""

# Metrics
echo "📈 Performance (24h):"
metrics=$(curl -s "$APP_URL/api/monitoring/metrics?range=24h")
debates=$(echo $metrics | jq -r '.metrics.debates.total')
completed=$(echo $metrics | jq -r '.metrics.debates.completed')
avg_duration=$(echo $metrics | jq -r '.metrics.performance.avg_debate_duration_seconds')
completion_rate=$(echo $metrics | jq -r '.metrics.performance.completion_rate')

echo "   Debates: $debates ($completed completed)"
echo "   Avg Duration: ${avg_duration}s"
echo "   Completion Rate: ${completion_rate}%"
echo ""

# Costs
echo "💰 Costs (24h):"
costs=$(curl -s "$APP_URL/api/monitoring/costs?range=24h")
total_cost=$(echo $costs | jq -r '.summary.total_cost')
daily_projection=$(echo $costs | jq -r '.summary.projected_daily_cost')
percentage_used=$(echo $costs | jq -r '.spending_cap.percentage_used')

echo "   Total: \$${total_cost}"
echo "   Daily Projection: \$${daily_projection}"
echo "   Budget Used: ${percentage_used}%"

# Alerts
alerts=$(echo $costs | jq -r '.alerts | length')
if [ "$alerts" -gt 0 ]; then
  echo ""
  echo "🚨 Alerts:"
  echo $costs | jq -r '.alerts[] | "   [\(.level | ascii_upcase)] \(.message)"'
fi

echo ""
echo "=================================="
echo "Last checked: $(date)"
```

Make it executable:
```bash
chmod +x monitor.sh
./monitor.sh
```

## 🔔 Slack Webhook Integration

Send alerts to Slack:

```bash
#!/bin/bash

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
APP_URL="https://your-app.onrender.com"

# Get health status
health=$(curl -s "$APP_URL/api/health")
status=$(echo $health | jq -r '.status')

# Get cost alerts
costs=$(curl -s "$APP_URL/api/monitoring/costs?range=24h")
alerts=$(echo $costs | jq -r '.alerts')

# Send to Slack if unhealthy or alerts exist
if [ "$status" != "healthy" ] || [ "$(echo $alerts | jq 'length')" -gt 0 ]; then
  message="🚨 *AI Debate Arena Alert*\n\nStatus: $status\n\nAlerts:\n$(echo $alerts | jq -r '.[] | "• [\(.level)] \(.message)"')"
  
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$message\"}"
fi
```

## 📅 Monitoring Schedule

### Every 5 Minutes (Automated)
- Health check (Render automatic)
- Auto-restart if unhealthy

### Every Hour (Automated)
- Metrics collection
- Cost tracking
- Alert evaluation

### Daily (Manual)
- Review cost dashboard
- Check for anomalies
- Review error logs

### Weekly (Manual)
- Performance analysis
- Cost optimization review
- Capacity planning

### Monthly (Manual)
- Full system audit
- Security review
- Dependency updates

## 🛠️ Troubleshooting Commands

```bash
# Check Render logs
render logs -t ai-debate-arena

# Check database connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check Redis connection
redis-cli -u "$UPSTASH_REDIS_REST_URL" ping

# Test API endpoints
curl -I https://your-app.onrender.com/api/health
curl -I https://your-app.onrender.com/api/monitoring/metrics
curl -I https://your-app.onrender.com/api/monitoring/costs

# Check SSL certificate
openssl s_client -connect your-app.onrender.com:443 -servername your-app.onrender.com
```

## 📞 Emergency Contacts

**Critical Issues:**
1. Check Render status: https://status.render.com
2. Check Neon status: https://neon.tech/status
3. Check Upstash status: https://status.upstash.com

**Rollback Procedure:**
1. Go to Render dashboard
2. Navigate to "Events" tab
3. Find last working deployment
4. Click "Rollback"

**Support:**
- Render: https://render.com/support
- Neon: https://neon.tech/docs/introduction/support
- GitHub Issues: [Your repo]/issues

## 📊 Key Metrics to Watch

### Daily
- [ ] System health status
- [ ] API spending vs. budget
- [ ] Debate completion rate
- [ ] Error rate

### Weekly
- [ ] Average debate duration trend
- [ ] User growth
- [ ] Cost per debate trend
- [ ] Database performance

### Monthly
- [ ] Total spending vs. budget
- [ ] User retention
- [ ] Model performance trends
- [ ] Infrastructure costs

## 🎯 Success Criteria

**Healthy System:**
- ✅ Health status: "healthy"
- ✅ Database latency: < 100ms
- ✅ Debate completion rate: > 95%
- ✅ Average duration: < 5 minutes
- ✅ Daily spending: < 80% of cap
- ✅ Error rate: < 1%

**Action Required:**
- ❌ Health status: "unhealthy"
- ❌ Database latency: > 1000ms
- ❌ Completion rate: < 90%
- ❌ Average duration: > 10 minutes
- ❌ Daily spending: > 100% of cap
- ❌ Error rate: > 5%
