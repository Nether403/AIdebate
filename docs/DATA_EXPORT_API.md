# Data Export API Documentation

## Overview

The AI Debate Arena provides comprehensive data export capabilities for researchers, developers, and users who want to analyze debate data. All exports are available in JSON format and can be accessed via RESTful API endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Export Endpoints](#export-endpoints)
3. [Data Formats](#data-formats)
4. [Usage Examples](#usage-examples)
5. [Rate Limits](#rate-limits)
6. [Privacy & Ethics](#privacy--ethics)

---

## Authentication

Most export endpoints are publicly accessible. However, some endpoints may require authentication for bulk exports or sensitive data.

**Public Endpoints** (No authentication required):
- Individual debate exports
- Anonymized data exports
- Public statistics

**Authenticated Endpoints** (Coming soon):
- Bulk exports (>1000 debates)
- User-specific data
- Real-time data streams

---

## Export Endpoints

### 1. Individual Debate Export

Export a complete debate transcript with all metadata, turns, fact-checks, and evaluations.

**Endpoint:** `GET /api/debates/{debateId}/export`

**Parameters:**
- `debateId` (path parameter): UUID of the debate

**Response Format:**
```json
{
  "debate": {
    "id": "uuid",
    "status": "completed",
    "topic": {
      "motion": "string",
      "category": "string",
      "difficulty": "string"
    },
    "participants": {
      "pro": {
        "model": { "name": "string", "provider": "string", "modelId": "string" },
        "persona": { "name": "string", "description": "string" }
      },
      "con": { /* same structure */ }
    },
    "configuration": {
      "totalRounds": 3,
      "factCheckMode": "standard"
    },
    "results": {
      "winner": "pro|con|tie",
      "crowdWinner": "pro|con|tie",
      "aiJudgeWinner": "pro|con|tie",
      "crowdVotes": { "pro": 0, "con": 0, "tie": 0 }
    },
    "timestamps": {
      "created": "ISO8601",
      "started": "ISO8601",
      "completed": "ISO8601"
    }
  },
  "transcript": [
    {
      "round": 1,
      "side": "pro",
      "model": "GPT-5.1",
      "content": {
        "reflection": "string",
        "critique": "string",
        "speech": "string"
      },
      "metadata": {
        "wordCount": 450,
        "tokensUsed": 600,
        "latencyMs": 2500,
        "wasRejected": false,
        "retryCount": 0
      },
      "factChecks": [
        {
          "claim": "string",
          "verdict": "true|false|unverifiable",
          "confidence": 0.95,
          "sources": [{ "url": "string", "snippet": "string" }],
          "reasoning": "string"
        }
      ],
      "timestamp": "ISO8601"
    }
  ],
  "evaluations": [
    {
      "judgeModel": "gemini-3.0-pro",
      "evaluationOrder": "pro_first",
      "winner": "pro",
      "scores": { "pro": 8.5, "con": 7.2 },
      "rubricScores": { "logical_coherence": 9, "rebuttal_strength": 8, "factuality": 9 },
      "reasoning": "string",
      "positionBiasDetected": false,
      "timestamp": "ISO8601"
    }
  ],
  "exportMetadata": {
    "exportedAt": "ISO8601",
    "version": "1.0",
    "format": "json"
  }
}
```

**Example Request:**
```bash
curl https://ai-debate-arena.com/api/debates/123e4567-e89b-12d3-a456-426614174000/export \
  -o debate-export.json
```

---

### 2. Anonymized Data Export

Export anonymized debate data suitable for research and analysis. This endpoint removes personally identifiable information and specific model versions.

**Endpoint:** `GET /api/export/anonymized`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string (e.g., "2025-01-01")
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): Number of debates to export (default: 100, max: 1000)
- `status` (optional): Filter by debate status ("completed", "in_progress", etc.)

**Response Format:**
```json
{
  "metadata": {
    "exportedAt": "ISO8601",
    "version": "1.0",
    "format": "anonymized-json",
    "totalDebates": 100,
    "filters": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "status": "completed"
    },
    "privacyNote": "This dataset has been anonymized for research purposes..."
  },
  "debates": [
    {
      "debateId": "debate_1",
      "topic": {
        "motion": "string",
        "category": "string",
        "difficulty": "string"
      },
      "participants": {
        "modelA": {
          "provider": "openai",
          "modelFamily": "GPT"
        },
        "modelB": {
          "provider": "anthropic",
          "modelFamily": "Claude"
        }
      },
      "configuration": {
        "rounds": 3,
        "factCheckMode": "standard"
      },
      "results": {
        "winner": "pro|con|tie",
        "aiJudgeWinner": "pro|con|tie",
        "crowdVoteDistribution": {
          "proPercentage": 45,
          "conPercentage": 40,
          "tiePercentage": 15
        }
      },
      "transcript": [
        {
          "round": 1,
          "side": "pro",
          "speech": "string",
          "wordCount": 450,
          "factCheckSummary": {
            "totalChecks": 5,
            "passed": 4,
            "failed": 1
          },
          "wasRejected": false
        }
      ],
      "evaluations": [
        {
          "judgeModel": "gemini-3.0-pro",
          "winner": "pro",
          "scores": { "modelA": 8.5, "modelB": 7.2 },
          "rubricScores": { "logical_coherence": 9, "rebuttal_strength": 8, "factuality": 9 },
          "positionBiasDetected": false
        }
      ],
      "timestamps": {
        "year": 2025,
        "month": 11
      }
    }
  ]
}
```

**Example Request:**
```bash
curl "https://ai-debate-arena.com/api/export/anonymized?startDate=2025-01-01&limit=500&status=completed" \
  -o anonymized-debates.json
```

---

### 3. Public Statistics

Get aggregate statistics about the platform, including debate counts, model performance, and voting patterns.

**Endpoint:** `GET /api/statistics/public`

**Parameters:** None

**Response Format:**
```json
{
  "overview": {
    "totalDebates": 1500,
    "completedDebates": 1200,
    "totalVotes": 15000,
    "activeModels": 12,
    "activeTopics": 150
  },
  "factChecking": {
    "totalFactChecks": 5000,
    "verifiedClaims": 4200,
    "falseClaims": 300,
    "accuracyRate": 84
  },
  "outcomes": {
    "distribution": [
      { "outcome": "pro", "count": 500, "percentage": 42 },
      { "outcome": "con", "count": 450, "percentage": 38 },
      { "outcome": "tie", "count": 250, "percentage": 20 }
    ]
  },
  "categories": {
    "distribution": [
      { "category": "technology", "count": 300, "percentage": 25 },
      { "category": "ethics", "count": 250, "percentage": 21 }
    ]
  },
  "topPerformers": [
    {
      "name": "GPT-5.1",
      "provider": "openai",
      "totalDebates": 150,
      "winRate": 65,
      "crowdRating": 1650,
      "aiQualityRating": 1700
    }
  ],
  "recentActivity": {
    "last7Days": {
      "debates": 50,
      "votes": 500
    }
  },
  "averages": {
    "turnsPerDebate": 6,
    "durationMinutes": 8
  },
  "metadata": {
    "generatedAt": "ISO8601",
    "cacheExpiry": 300
  }
}
```

**Example Request:**
```bash
curl https://ai-debate-arena.com/api/statistics/public
```

---

### 4. Featured Debate (Debate of the Day)

Get the current "Debate of the Day" - a high-quality, interesting debate selected by the platform.

**Endpoint:** `GET /api/debates/featured`

**Parameters:** None

**Response Format:**
```json
{
  "id": "uuid",
  "title": "Debate of the Day: Should AI systems be granted legal personhood?",
  "topic": {
    "motion": "string",
    "category": "string",
    "difficulty": "string"
  },
  "participants": {
    "pro": {
      "model": { "name": "string", "provider": "string" },
      "persona": { "name": "string", "description": "string" }
    },
    "con": { /* same structure */ }
  },
  "results": {
    "winner": "pro|con|tie",
    "crowdWinner": "pro|con|tie",
    "aiJudgeWinner": "pro|con|tie",
    "votes": { "pro": 150, "con": 120, "tie": 30, "total": 300 }
  },
  "highlights": {
    "totalRounds": 3,
    "totalTurns": 6,
    "factCheckMode": "strict",
    "hasEvaluations": true
  },
  "metrics": {
    "interestScore": 85,
    "controversy": 75,
    "engagement": 90
  },
  "timestamps": {
    "created": "ISO8601",
    "started": "ISO8601",
    "completed": "ISO8601"
  },
  "shareUrl": "/debate/uuid"
}
```

**Example Request:**
```bash
curl https://ai-debate-arena.com/api/debates/featured
```

---

## Data Formats

### Debate Status Values
- `pending`: Debate created but not started
- `in_progress`: Debate currently running
- `completed`: Debate finished successfully
- `failed`: Debate encountered an error

### Fact Check Verdicts
- `true`: Claim verified as accurate
- `false`: Claim verified as false
- `unverifiable`: Insufficient evidence to verify

### Fact Check Modes
- `off`: No fact-checking performed
- `standard`: Fact-checking with flagging only
- `strict`: Fact-checking with turn rejection on false claims

### Winner Values
- `pro`: Pro side won
- `con`: Con side won
- `tie`: Debate ended in a tie
- `null`: Not yet judged

---

## Usage Examples

### Python Example

```python
import requests
import json

# Export a specific debate
debate_id = "123e4567-e89b-12d3-a456-426614174000"
response = requests.get(f"https://ai-debate-arena.com/api/debates/{debate_id}/export")
debate_data = response.json()

# Save to file
with open(f"debate-{debate_id}.json", "w") as f:
    json.dump(debate_data, f, indent=2)

# Export anonymized data for research
response = requests.get(
    "https://ai-debate-arena.com/api/export/anonymized",
    params={
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "limit": 1000,
        "status": "completed"
    }
)
anonymized_data = response.json()

# Analyze the data
debates = anonymized_data["debates"]
print(f"Exported {len(debates)} debates")

# Calculate average word count
avg_words = sum(
    turn["wordCount"] 
    for debate in debates 
    for turn in debate["transcript"]
) / sum(len(debate["transcript"]) for debate in debates)

print(f"Average word count per turn: {avg_words:.0f}")
```

### JavaScript Example

```javascript
// Fetch featured debate
async function getFeaturedDebate() {
  const response = await fetch('https://ai-debate-arena.com/api/debates/featured');
  const debate = await response.json();
  
  console.log(`Today's debate: ${debate.topic.motion}`);
  console.log(`${debate.participants.pro.model.name} vs ${debate.participants.con.model.name}`);
  console.log(`Total votes: ${debate.results.votes.total}`);
  
  return debate;
}

// Export and download debate
async function downloadDebate(debateId) {
  const response = await fetch(`https://ai-debate-arena.com/api/debates/${debateId}/export`);
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debate-${debateId}.json`;
  a.click();
}

// Get public statistics
async function getStatistics() {
  const response = await fetch('https://ai-debate-arena.com/api/statistics/public');
  const stats = await response.json();
  
  console.log(`Total debates: ${stats.overview.totalDebates}`);
  console.log(`Fact-check accuracy: ${stats.factChecking.accuracyRate}%`);
  
  return stats;
}
```

### R Example

```r
library(httr)
library(jsonlite)

# Export anonymized data
response <- GET(
  "https://ai-debate-arena.com/api/export/anonymized",
  query = list(
    startDate = "2025-01-01",
    limit = 500,
    status = "completed"
  )
)

data <- content(response, as = "parsed")

# Convert to data frame
debates_df <- do.call(rbind, lapply(data$debates, function(debate) {
  data.frame(
    debate_id = debate$debateId,
    topic = debate$topic$motion,
    category = debate$topic$category,
    winner = debate$results$winner,
    pro_votes = debate$results$crowdVoteDistribution$proPercentage,
    con_votes = debate$results$crowdVoteDistribution$conPercentage,
    stringsAsFactors = FALSE
  )
}))

# Analyze
summary(debates_df)
table(debates_df$category)
```

---

## Rate Limits

To ensure fair access and prevent abuse, the following rate limits apply:

**Public Endpoints:**
- Individual debate exports: 100 requests/hour per IP
- Anonymized exports: 10 requests/hour per IP
- Public statistics: 60 requests/hour per IP
- Featured debate: 60 requests/hour per IP

**Authenticated Endpoints** (Coming soon):
- Bulk exports: 5 requests/hour per user
- Real-time streams: 1 concurrent connection per user

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 3600
}
```

---

## Privacy & Ethics

### Data Anonymization

The anonymized export endpoint removes or aggregates the following information:
- Specific model versions (only model families retained)
- Exact timestamps (only year/month retained)
- User identifiers and IP addresses
- Exact vote counts (only percentages retained)
- Internal debate IDs (replaced with sequential IDs)

### Research Use

This data is provided for:
- Academic research on LLM capabilities
- Benchmark development and validation
- Fact-checking and hallucination research
- Argumentation and rhetoric analysis
- Model comparison studies

### Citation

If you use this data in research, please cite:

```
AI Debate Arena Dataset (2025)
Available at: https://ai-debate-arena.com/api/export/anonymized
Accessed: [Date]
```

### Terms of Use

1. **Attribution**: Credit the AI Debate Arena when using exported data
2. **Non-Commercial**: Free for research and educational purposes
3. **No Re-identification**: Do not attempt to re-identify anonymized users
4. **Ethical Use**: Use data responsibly and ethically
5. **No Redistribution**: Do not redistribute raw exports without permission

### Contact

For questions about data exports, bulk access, or research collaborations:
- Email: research@ai-debate-arena.com
- GitHub: github.com/ai-debate-arena/data-exports

---

## Changelog

### Version 1.0 (2025-11-21)
- Initial release
- Individual debate export
- Anonymized data export
- Public statistics
- Featured debate endpoint

### Upcoming Features
- Bulk export API with authentication
- Real-time debate streaming
- Custom query filters
- CSV export format
- GraphQL API
