# AI Debate Arena - LLM Benchmark Platform

A serious, scientifically rigorous benchmark platform that evaluates Large Language Models through adversarial debates, bridging the gap between static benchmarks and real user experience.

## 🎯 Project Vision

Transform LLM evaluation from static tests into dynamic, persona-driven debates that measure both persuasive appeal and logical rigor. This platform identifies models that are genuinely intelligent versus those that are merely charismatic.

## 🔑 Key Innovation

**Dual Scoring System:**
- **Crowd Score** (Elo) - Measures persuasiveness and user appeal
- **AI Quality Score** (Glicko-2) - Measures logical coherence and factuality
- **Charismatic Liar Index** - Identifies models with high crowd appeal but low logical quality

## 🏗️ Architecture

- **Frontend:** Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes with LangGraph multi-agent orchestration
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Cache:** Upstash Redis
- **Auth:** Neon Auth (Stack Auth integration)
- **LLMs:** OpenAI, Google Gemini, xAI Grok, OpenRouter
- **Search:** Tavily API for fact-checking

## 🤖 Multi-Agent System

Built with LangGraph for stateful debate orchestration:

1. **Pro/Con Debater Agents** - Generate arguments using Reflect-Critique-Refine (RCR) prompting
2. **Fact-Checker Agent** - Validates claims against search APIs (hallucination firewall)
3. **Judge Agent** - Evaluates debates using structured rubrics
4. **Moderator Agent** - Enforces rules and manages debate flow
5. **Topic Generator Agent** - Creates balanced debate motions

## 📊 Features

### Core Features
- ✅ Real-time debates between LLM models
- ✅ Persona-driven arguments (historical figures, archetypes)
- ✅ Automatic fact-checking with verification badges
- ✅ Dual scoring (crowd votes + AI judge)
- ✅ Transparent leaderboard with multiple metrics
- ✅ Anonymous voting to prevent brand bias

### Gamification
- 🎮 Prediction market with DebatePoints
- 🏆 Superforecaster badges for accurate predictors
- 📊 Live probability graphs
- 🎯 "Debate of the Day" featured matchups
- 📈 Personal statistics dashboard

### Research Features
- 📝 Complete debate transcript storage
- 🔍 Per-topic performance analysis
- 📉 Model version tracking over time
- 🔬 Controversy index (score divergence detection)
- 📊 Exportable anonymized datasets

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL account
- API keys for LLM providers (OpenAI, Google, xAI, OpenRouter)
- Tavily API key for fact-checking

### Environment Setup

Configure your API keys in `.env` (see `.env` for required variables).

### Installation

```bash
# Install dependencies
npm install

# Initialize Stack Auth
npx @stackframe/init-stack . --no-browser

# Run database migrations
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── debate/           # Debate-specific components
│   └── leaderboard/      # Leaderboard components
├── lib/                   # Core business logic
│   ├── agents/           # LangGraph agents
│   ├── db/               # Database schema & client
│   ├── llm/              # LLM provider clients
│   └── rating/           # Glicko-2 rating engine
├── types/                 # TypeScript type definitions
├── .kiro/                 # Spec and steering docs
│   ├── specs/            # Requirements, design, tasks
│   └── steering/         # Development guidelines
└── archive/               # Old Bolt.new prototype
```

## 📚 Documentation

- **[Requirements](./.kiro/specs/debate-benchmark-platform/requirements.md)** - EARS-compliant requirements
- **[Design](./.kiro/specs/debate-benchmark-platform/design.md)** - Architecture and interfaces
- **[Tasks](./.kiro/specs/debate-benchmark-platform/tasks.md)** - Implementation plan
- **[Project Guide](./.kiro/steering/project-guide.md)** - Development guidelines
- **[MCP Activation Guide](./.kiro/steering/mcp-activation-guide.md)** - Tool usage guide

## 🔬 Research Foundation

This project is based on extensive research into modern LLM evaluation:

- **AI Debate Arena Research** - Benchmark design principles
- **The Dialectic Engine** - Multi-agent architecture

## 🎯 Roadmap

### Phase 1: MVP (Current)
- [ ] Project setup and database schema
- [ ] LLM provider integrations
- [ ] Basic debate engine with LangGraph
- [ ] Simple judge and fact-checker
- [ ] Anonymous voting
- [ ] Basic leaderboard

### Phase 2: Enhanced Features
- [ ] Prediction market with DebatePoints
- [ ] User authentication (Neon Auth)
- [ ] Advanced judge with position bias mitigation
- [ ] Topic generator agent
- [ ] User statistics dashboard

### Phase 3: Research Platform
- [ ] Data export API
- [ ] Advanced analytics
- [ ] Model version tracking
- [ ] Championship rounds
- [ ] Public dataset releases

## 🤝 Contributing

This is currently a solo development project. Contributions will be welcome once the MVP is complete.

## 📄 License

[To be determined]

## 🙏 Acknowledgments

- LMSYS Chatbot Arena for inspiration on crowd-based evaluation
- LangChain/LangGraph for multi-agent orchestration framework
- Neon for serverless PostgreSQL and authentication
- The research community for benchmark methodology insights

---

**Status:** 🚧 In Active Development  
**Current Phase:** Phase 1 - MVP Implementation
