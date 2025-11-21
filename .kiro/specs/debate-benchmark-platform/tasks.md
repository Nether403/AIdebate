# Implementation Plan

This document outlines the step-by-step implementation tasks for building the AI Debate Arena benchmark platform. Each task is designed to be actionable by a coding agent and builds incrementally on previous work.

## Task Execution Guidelines

- Tasks marked with * are optional (e.g., unit tests, documentation)
- Core implementation tasks are never marked as optional
- Each task references specific requirements from requirements.md
- All context documents (requirements.md, design.md) are available during implementation

---

- [x] 1. Set up project structure and core infrastructure





  - Create Next.js project with TypeScript and Tailwind CSS
  - Configure ESLint and Prettier
  - Set up folder structure: /app, /components, /lib, /types, /agents
  - _Requirements: All_

- [x] 1.1 Configure Neon database connection


  - Install Neon serverless driver and Drizzle ORM
  - Create database connection utility in /lib/db
  - Set up environment variables for Neon connection string
  - _Requirements: 9_

- [x] 1.2 Create database schema with Drizzle


  - Define schema for models, debates, debate_turns, fact_checks, debate_evaluations, user_votes, model_ratings, topics, personas tables
  - Generate migration files
  - Run initial migration to create tables
  - _Requirements: 9, 14_


- [x] 1.3 Set up Redis cache connection

  - Install Upstash Redis client
  - Create cache utility in /lib/cache
  - Configure environment variables for Redis
  - _Requirements: 8_

- [x] 1.4 Create database seed data


  - Seed initial personas (10 distinct characters)
  - Seed initial topics (100 debate motions across categories)
  - Seed initial models (GPT-5.1, Claude 4.5, Gemini 3.0, Grok 4.1, legacy models)
  - _Requirements: 2, 12, 14_

- [x] 2. Implement LLM provider integrations





  - Create unified LLM client interface in /lib/llm/client.ts
  - Implement OpenAI provider adapter
  - Implement Anthropic provider adapter
  - Implement Google Gemini provider adapter
  - Implement xAI Grok provider adapter
  - Add retry logic with exponential backoff
  - Add token counting and cost tracking
  - _Requirements: 3_

- [x] 2.1 Create streaming response handler


  - Implement SSE (Server-Sent Events) for streaming LLM responses
  - Add timeout handling (120 seconds)
  - Create response parser for extracting RCR phases
  - _Requirements: 3, 11_

- [x] 2.2 Update LLM providers to use latest frontier models





  - Update OpenAI provider to use GPT-5.1 (gpt-5.1) with Instant and Thinking modes
  - Update Anthropic provider to use Claude 4.5 Sonnet (claude-sonnet-4-5-20250929)
  - Update Google provider to use Gemini 3.0 Pro (gemini-3.0-pro) and Gemini 2.5 Flash (gemini-2.5-flash)
  - Update xAI provider to use Grok 4.1 (grok-4.1) and Grok 4.1 Fast (grok-4.1-fast)
  - Add OpenRouter as fallback provider for additional models
  - Update model pricing in cost tracking for new models
  - Update streaming implementations to use latest SDK patterns
  - _Requirements: 3_

- [x] 2.3 Add LLM client error handling tests




  - Test retry logic with mock failures
  - Test timeout scenarios
  - Test token counting accuracy
  - _Requirements: 3_

- [x] 3. Build Debate Engine core





  - Create DebateEngine class in /lib/debate/engine.ts
  - Implement debate initialization logic
  - Create debate state management
  - Add debate persistence to database
  - Implement checkpoint/recovery system
  - _Requirements: 1, 3_


- [x] 3.1 Implement debate configuration builder

  - Create DebateConfig interface and validator
  - Add model selection logic
  - Add persona assignment logic
  - Add topic selection (random or manual)
  - _Requirements: 1, 2, 12_



- [x] 3.2 Create debate transcript manager

  - Implement turn storage and retrieval
  - Add transcript formatting utilities
  - Create transcript export functionality
  - _Requirements: 1, 9_

- [x] 3.3 Write debate engine unit tests


  - Test debate initialization
  - Test state persistence
  - Test recovery from checkpoint
  - _Requirements: 1, 3_

- [x] 4. Implement LangGraph multi-agent orchestration





  - Install LangGraph and LangChain dependencies
  - Create debate graph definition in /lib/agents/graph.ts
  - Define shared state interface
  - Implement state persistence with Neon
  - _Requirements: 1, 3_

- [x] 4.1 Create Moderator Agent node


  - Implement round announcement logic
  - Add word count enforcement
  - Add turn validation
  - _Requirements: 1_

- [x] 4.2 Create Debater Agent node


  - Implement RCR prompt generation
  - Add persona injection logic
  - Create speech generation with streaming
  - Parse reflection, critique, and speech from response
  - _Requirements: 2, 11_

- [x] 4.3 Create Fact-Checker Agent node


  - Integrate Tavily Search API
  - Implement claim extraction logic
  - Create claim verification function
  - Add fact-check result storage
  - Implement strict mode loop-back logic
  - _Requirements: 4_

- [x] 4.4 Create Round Transition node


  - Implement round completion check
  - Add debate termination logic
  - Create final state preparation
  - _Requirements: 1_

- [x] 4.5 Wire graph edges and conditional routing


  - Connect moderator to debaters
  - Add fact-checker conditional edges
  - Implement loop-back for strict mode
  - Add round transition routing
  - _Requirements: 1, 4_

- [x] 4.6 Test LangGraph execution flow


  - Test complete 3-round debate flow
  - Test fact-checker loop-back in strict mode
  - Test state persistence and recovery
  - _Requirements: 1, 4_

- [x] 5. Build Judge Agent system





  - Create JudgeAgent class in /lib/agents/judge.ts
  - Implement structured rubric evaluation prompt
  - Add JSON output parsing
  - Create fallacy detection logic
  - _Requirements: 5_

- [x] 5.1 Implement position bias mitigation


  - Create dual evaluation function (pro-first, con-first)
  - Add consensus checking logic
  - Implement tiebreaker judge invocation
  - _Requirements: 5_

- [x] 5.2 Create judge calibration system


  - Define Gold Standard dataset structure
  - Implement calibration validation function
  - Add agreement rate calculation
  - Create calibration report generator
  - _Requirements: 5_

- [x] 5.3 Write judge evaluation tests


  - Test rubric scoring with known debates
  - Test position bias detection
  - Test consensus logic
  - _Requirements: 5_

- [x] 6. Implement Rating Engine with Glicko-2





  - Install or implement Glicko-2 algorithm library
  - Create RatingEngine class in /lib/rating/engine.ts
  - Implement rating initialization for new models
  - Add rating update function for debate results
  - Create batch update scheduler (24-hour periods)
  - _Requirements: 6, 8_

- [x] 6.1 Build leaderboard calculation logic


  - Create leaderboard query with sorting options
  - Implement controversy index calculation
  - Add filtering for controversial models
  - Cache leaderboard results in Redis
  - _Requirements: 6, 8_

- [x] 6.2 Implement dual scoring system


  - Separate crowd rating from AI rating
  - Create Charismatic Liar Index calculation
  - Add score divergence detection
  - _Requirements: 6_

- [x] 6.3 Test rating calculations


  - Test Glicko-2 updates with known scenarios
  - Test controversy index edge cases
  - Test leaderboard sorting accuracy
  - _Requirements: 6, 8_

- [x] 7. Create API endpoints





  - Set up Next.js API routes in /app/api
  - Implement /api/debate/run endpoint
  - Implement /api/debate/judge endpoint
  - Implement /api/debate/vote endpoint
  - Implement /api/leaderboard endpoint
  - Add request validation middleware
  - Add rate limiting middleware
  - _Requirements: 1, 5, 7, 8, 15_

- [x] 7.1 Add streaming support for debates


  - Implement SSE endpoint for live debate streaming
  - Add turn-by-turn updates
  - Include RCR phase visibility
  - _Requirements: 1, 11_

- [x] 7.2 Implement authentication for voting


  - Add OAuth integration (Google, GitHub)
  - Create JWT token generation
  - Add session management
  - Implement anonymous voting with session tracking
  - _Requirements: 7, 15_

- [x] 7.3 Write API endpoint tests


  - Test debate creation with valid/invalid configs
  - Test vote submission with duplicate prevention
  - Test rate limiting enforcement
  - _Requirements: 1, 7, 15_

- [x] 8. Build frontend debate viewer





  - Create DebateOrchestrator component
  - Create DebateTranscript component with turn display
  - Add RCR phase accordion (Thinking section)
  - Implement fact-check indicator badges (Red Flag, Verified)
  - Add streaming response display
  - _Requirements: 1, 4, 11_

- [x] 8.1 Create debate configuration UI


  - Build model selection interface
  - Add persona selection dropdown
  - Create topic selection (random or manual)
  - Add debate settings (rounds, word limit, fact-checking, strict mode)
  - _Requirements: 1, 2, 12_

- [x] 8.2 Implement anonymous voting interface


  - Display models as "Model A" and "Model B"
  - Create vote buttons (A, B, Tie)
  - Add identity reveal after vote submission
  - Implement vote confirmation feedback
  - _Requirements: 7_

- [x] 8.3 Add live probability graph


  - Install Recharts or similar charting library
  - Create real-time probability line chart
  - Update probabilities as debate progresses
  - Display current odds for prediction market
  - _Requirements: 10_

- [x] 9. Build prediction market system





  - Create DebatePoints virtual currency system
  - Implement betting interface with odds display
  - Add dynamic odds calculation based on bet pool
  - Create payout calculation logic
  - Store bets in user_votes table with wager amounts
  - _Requirements: 10_

- [x] 9.1 Create user statistics dashboard


  - Display total DebatePoints balance
  - Show prediction accuracy percentage
  - Add Superforecaster badge for >80% accuracy
  - Create personal betting history
  - _Requirements: 10_



- [x] 9.2 Test prediction market mechanics




  - Test odds calculation with various bet distributions
  - Test payout accuracy
  - Test DebatePoints balance updates
  - _Requirements: 10_

- [x] 10. Implement leaderboard display





  - Create Leaderboard page component
  - Display models with dual scores (Crowd, AI Quality)
  - Add sorting options (win rate, crowd score, AI score, factuality)
  - Show model statistics (debates, wins, losses, ties)
  - Highlight controversial models with divergent scores
  - Add legacy model indicators
  - _Requirements: 8, 14_

- [x] 10.1 Create model detail pages


  - Show complete model statistics
  - Display recent debate history
  - Add per-topic performance breakdown
  - Show progress chart for model versions
  - _Requirements: 8, 14_

- [x] 10.2 Add leaderboard filtering


  - Filter by model provider
  - Filter by model type (SOTA vs legacy)
  - Filter for controversial models
  - Filter by topic category performance
  - _Requirements: 8_

- [x] 11. Build Topic Generator Agent





  - Create TopicGeneratorAgent in /lib/agents/topic-generator.ts
  - Implement topic generation prompt
  - Add side-balance validation logic
  - Create topic categorization (domain, difficulty)
  - Implement automatic topic pool replenishment
  - _Requirements: 16_



- [x] 11.1 Add topic management interface
  - Create admin page for topic review
  - Add topic approval/rejection workflow
  - Implement topic retirement for unbalanced motions
  - Add user topic submission form
  - _Requirements: 12, 16_

- [x] 11.2 Test topic generation quality
  - Generate 50 topics and manually review balance
  - Test categorization accuracy
  - Test replenishment trigger logic
  - _Requirements: 16_

- [x] 12. Implement security and abuse prevention





  - Add IP-based rate limiting (20 votes/hour)
  - Implement session fingerprinting
  - Create anomalous voting pattern detection
  - Add admin dashboard for flagging suspicious users
  - Implement daily spending cap for API costs
  - Add cost monitoring alerts
  - _Requirements: 15_

- [x] 12.1 Create admin monitoring dashboard


  - Display real-time debate metrics
  - Show API usage and costs
  - Add user voting pattern analysis
  - Create manual review queue for flagged content
  - _Requirements: 15_

- [x] 12.2 Test security measures


  - Test rate limiting with rapid requests
  - Test duplicate vote prevention
  - Test cost cap enforcement
  - _Requirements: 15_

- [x] 13. Add data export and transparency features





  - Create API endpoint for debate transcript export
  - Implement anonymized data export (JSON format)
  - Build public statistics dashboard
  - Add debate sharing functionality
  - Create "Debate of the Day" feature
  - _Requirements: 9, 10_

- [x] 13.1 Implement social sharing


  - Add share buttons for interesting debates
  - Generate shareable debate links
  - Create debate preview cards for social media
  - _Requirements: 10_

- [x] 13.2 Create data export documentation


  - Document export API endpoints
  - Provide example data formats
  - Add usage guidelines for researchers
  - _Requirements: 9_

- [x] 14. Polish UI/UX and add animations





  - Add Framer Motion animations for transitions
  - Implement loading states for all async operations
  - Add error boundaries and user-friendly error messages
  - Create responsive design for mobile devices
  - Add dark mode support
  - _Requirements: All_

- [x] 14.1 Optimize performance


  - Implement code splitting for large components
  - Add image optimization
  - Optimize database queries with indexes
  - Add caching for frequently accessed data
  - _Requirements: All_

- [x] 14.2 Conduct user testing


  - Test debate viewing experience
  - Test voting flow
  - Test prediction market usability
  - Gather feedback on UI clarity
  - _Requirements: 7, 10_

- [x] 15. Deploy to production


  - Set up Render web service for Next.js application
  - Configure environment variables in Render dashboard
  - Set up Neon production database with connection pooling
  - Configure Upstash Redis production instance
  - Set up monitoring with Render metrics and custom logging
  - Configure error tracking (Sentry or similar)
  - Set up custom domain and SSL certificates
  - _Requirements: All_

- [ ] 15.1 Create deployment documentation
  - Document environment variable requirements for Render
  - Add deployment checklist specific to Render platform
  - Create runbook for common Render deployment issues
  - Document monitoring and alerting setup with Render
  - Document database connection pooling configuration
  - Add guide for Render build and start commands
  - _Requirements: All_

- [ ] 15.2 Set up CI/CD pipeline
  - Configure GitHub Actions for automated testing
  - Add automated linting and type checking
  - Set up Render staging environment (preview deploys)
  - Configure automated deployment to production via Render
  - Set up Render deploy hooks for automatic deployments
  - Configure health check endpoints for Render monitoring
  - _Requirements: All_

---

## Notes

- Start with tasks 1-3 to establish the foundation
- Tasks 4-6 build the core debate and evaluation logic
- Tasks 7-10 create the user-facing features
- Tasks 11-13 add advanced features and polish
- Tasks 14-15 prepare for production deployment

Each task should be completed and verified before moving to the next. The optional tasks marked with * can be skipped for an MVP but are recommended for a production-ready system.
