# AI Debate Arena - Dependency Installation Script (PowerShell)
# This script installs all missing dependencies identified in the tech stack analysis

Write-Host "🚀 Installing AI Debate Arena Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Critical Dependencies (Required for Tasks 2-4)
Write-Host "📦 Phase 1: Installing Critical Dependencies..." -ForegroundColor Yellow
Write-Host "   - LangChain ecosystem"
Write-Host "   - Validation libraries"
Write-Host "   - Utilities"
Write-Host ""

npm install `
  @langchain/langgraph `
  @langchain/core `
  langchain `
  @langchain/openai `
  @langchain/google-genai `
  zod `
  uuid

npm install -D @types/uuid

Write-Host ""
Write-Host "✅ Phase 1 Complete!" -ForegroundColor Green
Write-Host ""

# Phase 2: UI/UX Enhancements (For Tasks 8-10)
Write-Host "📦 Phase 2: Installing UI/UX Dependencies..." -ForegroundColor Yellow
Write-Host "   - Animations"
Write-Host "   - Data visualization"
Write-Host ""

npm install `
  framer-motion `
  recharts

Write-Host ""
Write-Host "✅ Phase 2 Complete!" -ForegroundColor Green
Write-Host ""

# Phase 3: Authentication (For Task 9+)
Write-Host "📦 Phase 3: Installing Authentication..." -ForegroundColor Yellow
Write-Host "   - Stack Auth (Neon Auth)"
Write-Host ""

npm install @stackframe/stack

Write-Host ""
Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npx @stackframe/init-stack . --no-browser"
Write-Host "   2. Review TECH_STACK_ANALYSIS.md for details"
Write-Host "   3. Proceed with Task 2: LLM Provider Integration"
Write-Host ""
