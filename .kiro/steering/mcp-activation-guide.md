---
inclusion: always
---

# MCP Server Activation Guide

This guide helps you activate only the MCP servers needed for specific tasks, reducing token costs and improving performance.

## Quick Reference: Task → MCP Servers

| Task Category | Required MCP Servers | Optional MCP Servers |
|--------------|---------------------|---------------------|
| Database Setup & Schema | **Neon** | - |
| LLM Integration | **Context7** (for API docs) | - |
| Frontend Development | **Shadcn** (for UI components) | Chrome DevTools (for testing) |
| API Development | **Neon**, **Context7** | - |
| Testing & Debugging | **Chrome DevTools**, **Neon** | - |
| Documentation | **Fetch** (for external docs) | - |
| Deployment | **Neon** | - |

## Detailed Task-Specific Guidance

### Tasks 1.x: Project Setup & Database

**Activate:**
- ✅ **Neon** - Essential for database operations
  - Creating schema
  - Running migrations
  - Seeding data
  - Testing connections

**Deactivate:**
- ❌ Chrome DevTools (not needed yet)
- ❌ Shadcn (no UI work yet)

**Why:** Database setup is pure backend work. Neon MCP provides direct database management without manual SQL files.

**Example Usage:**
`
."
"Seed 10 personas into the Neon database"
"Create a database branch for testing schema changes"
`

---

### Tasks 2.x: LLM Provider Integration

**Activate:**
- ✅ **Context7** - For up-to-date API documentation
  - OpenAI SDK usage
  - Anthropic SDK usage
  - Google Gemini SDK usage
  - Token counting methods

**Deactivate:**
- ❌ Neon (no database work in this phase)
- ❌ Chrome DevTools (no UI testing yet)
- ❌ Shadcn (no UI components yet)

**Why:** You need current API documentation for LLM providers. Context7 provides the latest SDK docs.

**Example Usage:**
`
"Show me the latest OpenAI streaming API documentation"
"How do I use Anthropic's Claude 4.5 with streaming?"
"What's the token counting method for Gemini 3.0?"
`

---

### Tasks 3.x: Debate Engine Core

**Activate:**
- ✅ **Neon** - For debate persistence
- ✅ **Context7** - For LangChain/LangGraph docs

**Deactivate:**
- ❌ Chrome DevTools (no UI yet)
- ❌ Shadcn (no UI yet)

**Why:** Building the debate engine requires database operations and understanding LangChain patterns.

**Example Usage:**
`
"Store this debate session in Neon with all turns"
"Show me LangChain documentation for state persistence"
"Create a checkpoint recovery system using Neon"
`

---

### Tasks 4.x: LangGraph Multi-Agent System

**Activate:**
- ✅ **Context7** - Critical for LangGraph documentation
- ✅ **Neon** - For state persistence

**Deactivate:**
- ❌ Chrome DevTools (backend work)
- ❌ Shadcn (backend work)

**Why:** LangGraph is complex and requires up-to-date documentation. Context7 provides the latest patterns.

**Example Usage:**
`
"Show me LangGraph documentation for cyclic graphs"
"How do I implement conditional edges in LangGraph?"
"What's the best way to persist LangGraph state to PostgreSQL?"
`

---

### Tasks 5.x: Judge Agent System

**Activate:**
- ✅ **Context7** - For prompt engineering best practices
- ✅ **Neon** - For storing evaluations

**Deactivate:**
- ❌ Chrome DevTools (backend work)
- ❌ Shadcn (backend work)

**Why:** Building effective judge prompts requires current best practices from LLM documentation.

**Example Usage:**
`
"Show me best practices for structured JSON output from LLMs"
"How do I reduce position bias in LLM evaluations?"
"What's the latest guidance on chain-of-thought prompting?"
`

---

### Tasks 6.x: Rating Engine (Glicko-2)

**Activate:**
- ✅ **Neon** - For rating storage and updates
- ✅ **Fetch** - For Glicko-2 algorithm documentation

**Deactivate:**
- ❌ Chrome DevTools (backend work)
- ❌ Shadcn (backend work)
- ❌ Context7 (no LLM APIs needed)

**Why:** Glicko-2 is a mathematical algorithm, not an LLM feature. Fetch can retrieve algorithm documentation.

**Example Usage:**
`
"Fetch the Glicko-2 algorithm specification from Wikipedia"
"Store updated ratings in Neon after batch processing"
"Query the leaderboard from Neon sorted by rating"
`

---

### Tasks 7.x: API Endpoints

**Activate:**
- ✅ **Neon** - For data operations
- ✅ **Context7** - For Next.js API route documentation

**Deactivate:**
- ❌ Chrome DevTools (API testing can be done with tools like curl)
- ❌ Shadcn (backend work)

**Why:** Building APIs requires database access and understanding Next.js patterns.

**Example Usage:**
`
"Show me Next.js 14 API route documentation with streaming"
"How do I implement rate limiting in Next.js API routes?"
"Query debate data from Neon for the leaderboard endpoint"
`

---

### Tasks 8.x: Frontend Debate Viewer

**Activate:**
- ✅ **Shadcn** - For UI components
- ✅ **Context7** - For React/Next.js documentation
- ⚠️ **Chrome DevTools** - Optional but recommended for testing

**Deactivate:**
- ❌ Neon (frontend doesn't directly access database)

**Why:** Building UI requires component libraries and testing in the browser.

**Example Usage:**
`
"Add a shadcn accordion component for the RCR thinking section"
"Show me React Query documentation for data fetching"
"Test the debate viewer in Chrome DevTools and take a screenshot"
`

---

### Tasks 9.x: Prediction Market System

**Activate:**
- ✅ **Neon** - For storing bets and points
- ✅ **Shadcn** - For betting UI components
- ⚠️ **Chrome DevTools** - For testing betting flow

**Deactivate:**
- ❌ Context7 (unless you need specific library docs)

**Why:** Prediction market needs database operations and interactive UI testing.

**Example Usage:**
`
"Store user bets in Neon with wager amounts"
"Add a shadcn chart component for the probability graph"
"Test the betting flow in Chrome DevTools and verify odds calculation"
`

---

### Tasks 10.x: Leaderboard Display

**Activate:**
- ✅ **Shadcn** - For table and card components
- ✅ **Neon** - For querying leaderboard data
- ⚠️ **Chrome DevTools** - For testing sorting and filtering

**Deactivate:**
- ❌ Context7 (unless you need specific library docs)

**Why:** Leaderboard is primarily UI work with database queries.

**Example Usage:**
`
"Add a shadcn data table component for the leaderboard"
"Query model statistics from Neon for the leaderboard"
"Test leaderboard sorting in Chrome DevTools"
`

---

### Tasks 11.x: Topic Generator Agent

**Activate:**
- ✅ **Context7** - For prompt engineering
- ✅ **Neon** - For storing topics

**Deactivate:**
- ❌ Chrome DevTools (backend work)
- ❌ Shadcn (backend work initially)

**Why:** Topic generation is an LLM task requiring good prompts and database storage.

**Example Usage:**
`
"Show me best practices for creative text generation with LLMs"
"Store generated topics in Neon with categorization"
"How do I validate topic balance using an LLM?"
`

---

### Tasks 12.x: Security & Abuse Prevention

**Activate:**
- ✅ **Neon** - For logging and flagging
- ✅ **Context7** - For Next.js security best practices

**Deactivate:**
- ❌ Chrome DevTools (backend security work)
- ❌ Shadcn (backend work)

**Why:** Security implementation is backend-focused with database logging.

**Example Usage:**
`
"Show me Next.js rate limiting middleware documentation"
"Store suspicious voting patterns in Neon for analysis"
"How do I implement IP-based rate limiting in Next.js?"
`

---

### Tasks 13.x: Data Export & Transparency

**Activate:**
- ✅ **Neon** - For data export queries
- ✅ **Shadcn** - For share buttons and UI

**Deactivate:**
- ❌ Chrome DevTools (unless testing share functionality)
- ❌ Context7 (unless you need specific library docs)

**Why:** Data export is database-heavy with some UI for sharing.

**Example Usage:**
`
"Export all debate transcripts from Neon as JSON"
"Add shadcn share buttons for social media"
"Query aggregate statistics from Neon for the public dashboard"
`

---

### Tasks 14.x: UI/UX Polish & Performance

**Activate:**
- ✅ **Shadcn** - For polished components
- ✅ **Chrome DevTools** - Essential for performance testing
- ✅ **Context7** - For Framer Motion and optimization docs

**Deactivate:**
- ❌ Neon (unless optimizing queries)

**Why:** Polish phase requires extensive browser testing and animation libraries.

**Example Usage:**
`
"Test page load performance in Chrome DevTools"
"Add Framer Motion animations to debate transitions"
"Take screenshots of responsive design in Chrome DevTools"
`

---

### Tasks 15.x: Deployment

**Activate:**
- ✅ **Neon** - For production database setup
- ✅ **Context7** - For Render deployment docs and Next.js configuration
- ✅ **Fetch** - For Render documentation and best practices

**Deactivate:**
- ❌ Chrome DevTools (deployment is infrastructure work)
- ❌ Shadcn (no UI changes)

**Why:** Deployment requires database configuration, platform-specific knowledge, and understanding Render's deployment model.

**Example Usage:**
`
"Create a production database in Neon with connection pooling"
"Show me Render deployment documentation for Next.js applications"
"Fetch Render's guide for environment variable configuration"
"Set up Neon connection pooling for Render deployment"
"How do I configure health checks in Render?"
`

---

## General Guidelines

### When to Keep MCP Servers Active

**Always Active (Minimal Token Cost):**
- **Neon** - If doing any database work
- **Context7** - If looking up API documentation

**Activate When Needed:**
- **Shadcn** - Only during UI component work
- **Chrome DevTools** - Only during browser testing
- **Fetch** - Only when retrieving external documentation

### When to Deactivate MCP Servers

**Deactivate if:**
- Not using the functionality in current task
- Token budget is limited
- Working on unrelated code (e.g., don't need Shadcn for backend work)

### Cost Optimization Tips

1. **Batch similar tasks** - Do all database work together with Neon active
2. **Deactivate between sessions** - Turn off unused servers when switching task types
3. **Use Context7 strategically** - Look up docs once, then deactivate while implementing
4. **Chrome DevTools last** - Only activate when ready to test in browser

## Quick Activation Commands

To activate a server, you can tell me:
- "Activate Neon MCP for database work"
- "Enable Chrome DevTools for testing"
- "Turn on Shadcn for UI components"

To deactivate:
- "Deactivate Chrome DevTools to save tokens"
- "Turn off Shadcn, we're done with UI"

## Current Project Phase Recommendations

**Phase 1 (Tasks 1-6): Backend Foundation**
- Keep active: Neon, Context7
- Deactivate: Chrome DevTools, Shadcn

**Phase 2 (Tasks 7-10): Frontend & API**
- Keep active: Neon, Shadcn, Context7
- Activate as needed: Chrome DevTools

**Phase 3 (Tasks 11-13): Advanced Features**
- Keep active: Neon, Context7
- Activate as needed: Shadcn, Chrome DevTools

**Phase 4 (Tasks 14-15): Polish & Deploy**
- Keep active: Chrome DevTools, Neon
- Activate as needed: Shadcn, Context7
