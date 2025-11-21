#!/bin/bash

# AI Debate Arena - Dependency Installation Script
# This script installs all missing dependencies identified in the tech stack analysis

echo "🚀 Installing AI Debate Arena Dependencies..."
echo ""

# Phase 1: Critical Dependencies (Required for Tasks 2-4)
echo "📦 Phase 1: Installing Critical Dependencies..."
echo "   - LangChain ecosystem"
echo "   - Validation libraries"
echo "   - Utilities"
echo ""

npm install \
  @langchain/langgraph \
  @langchain/core \
  langchain \
  @langchain/openai \
  @langchain/google-genai \
  zod \
  uuid

npm install -D @types/uuid

echo ""
echo "✅ Phase 1 Complete!"
echo ""

# Phase 2: UI/UX Enhancements (For Tasks 8-10)
echo "📦 Phase 2: Installing UI/UX Dependencies..."
echo "   - Animations"
echo "   - Data visualization"
echo ""

npm install \
  framer-motion \
  recharts

echo ""
echo "✅ Phase 2 Complete!"
echo ""

# Phase 3: Authentication (For Task 9+)
echo "📦 Phase 3: Installing Authentication..."
echo "   - Stack Auth (Neon Auth)"
echo ""

npm install @stackframe/stack

echo ""
echo "🎉 All dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npx @stackframe/init-stack . --no-browser"
echo "   2. Review TECH_STACK_ANALYSIS.md for details"
echo "   3. Proceed with Task 2: LLM Provider Integration"
echo ""
