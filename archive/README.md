# Archive: Old Bolt.new Application

This folder contains the original AI Debate Arena prototype built with Bolt.new (Vite + React).

## What's Archived

- **src/** - Original React components and UI
- **vite.config.ts** - Vite configuration
- **package.json** - Old dependencies
- **tsconfig.*.json** - TypeScript configurations
- **tailwind.config.js** - Tailwind CSS config
- **index.html** - Vite entry point
- **ROADMAP.md** - Original roadmap

## Why Archived

The project has been rebuilt from scratch using Next.js 14+ with:
- App Router architecture
- Server Components
- LangGraph multi-agent system
- Neon PostgreSQL database
- Real LLM integrations

## Reusable Components

Some components from this archive can be adapted for the new app:

### UI Components (in src/components/)
- **DebateTranscript.tsx** - Good structure for displaying debate turns
- **PersonaCard.tsx** - Can adapt for persona selection UI
- **ScoreGauge.tsx** - Useful for dual scoring visualization

### Configuration (in src/config/)
- **debate_config.json** - Contains persona and topic data that can be seeded into the database

### Types (in src/types/)
- **debate.ts** - Some type definitions may be reusable

## How to Reference

When implementing new features, you can:
1. Check this archive for UI inspiration
2. Adapt component structures (not direct copy)
3. Extract persona/topic data for database seeding
4. Reference the old logic for comparison

## Note

This was a prototype/novelty app. The new implementation is a serious benchmark platform with:
- Real debates between actual LLM models
- Fact-checking with search APIs
- Dual scoring (crowd + AI judge)
- Transparent leaderboard with Glicko-2 ratings
- Prediction market gamification

---

**Archived on:** 2025-11-19 16:47:49
**New Project:** AI Debate Arena Benchmark Platform (Next.js)
