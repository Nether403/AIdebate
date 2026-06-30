'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, Beaker, Gavel, ShieldCheck, FileCode, 
  Play, Cpu, Sparkles, AlertTriangle, HelpCircle, 
  ExternalLink, BarChart3, Database, GitBranch, RefreshCw, Zap
} from 'lucide-react'

// Mock Leaderboard Data for Benchmarking
const LEADERBOARD_MODELS = [
  { rank: 1, name: "Claude Sonnet 4.5", provider: "Anthropic", winRate: 68.2, factuality: 94.6, charismaticLiarIndex: 0.08, cost: 0.015 },
  { rank: 2, name: "GPT-5.1", provider: "OpenAI", winRate: 64.5, factuality: 91.2, charismaticLiarIndex: 0.12, cost: 0.018 },
  { rank: 3, name: "Grok 4.3", provider: "xAI", winRate: 59.8, factuality: 88.9, charismaticLiarIndex: 0.15, cost: 0.012 },
  { rank: 4, name: "Gemini 3.5 Flash", provider: "Google", winRate: 52.4, factuality: 85.3, charismaticLiarIndex: 0.18, cost: 0.005 },
  { rank: 5, name: "Llama 3 70b", provider: "Meta", winRate: 46.1, factuality: 81.7, charismaticLiarIndex: 0.22, cost: 0.003 }
]

// Infographic Hotspots
const INFOGRAPHIC_HOTSPOTS = [
  {
    id: "debater",
    title: "Debater Agents (Pro & Con)",
    description: "Multi-round adversarial conversationalists that argue conflicting sides of a motion. They run in Reflection-Critique-Rebuttal (RCR) loops to self-correct and maximize argument quality before emitting their speech.",
    glow: "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
    color: "text-cyan-400"
  },
  {
    id: "factchecker",
    title: "Tavily Fact-Checker Gate",
    description: "Intercepts every speech draft. Extracts claims, executes real-time web search verification, evaluates factuality, and returns sourced citations. In strict mode, it rejects drafts that fail factuality thresholds.",
    glow: "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    color: "text-emerald-400"
  },
  {
    id: "judge",
    title: "Double-Pass Consensus Judge",
    description: "Evaluates the final transcript. Executes two independent judging runs (Pro-first and Con-first order) to eliminate position bias. If verdicts match, it declares a consensus winner; if they diverge, a tiebreaker fires.",
    glow: "border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.25)]",
    color: "text-purple-400"
  },
  {
    id: "moderator",
    title: "Orchestration & Moderator",
    description: "Controls the LangGraph state machine. Enforces absolute turn lengths, round transitions, API fallbacks, dry-run safety caps, and cost budget monitoring.",
    glow: "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    color: "text-amber-400"
  },
  {
    id: "persistence",
    title: "Postgres & Drizzle telemetry",
    description: "Stores complete debate artifacts: configurations, full prompt versions, token counts, cost estimations, and factuality sources. Enables reproducible exports to JSONL and CSV.",
    glow: "border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.25)]",
    color: "text-pink-400"
  }
]

export default function Home() {
  const [activeHotspot, setActiveHotspot] = useState<string>("debater")
  const [simulatedTurn, setSimulatedTurn] = useState<number>(0)
  const [isSimulating, setIsSimulating] = useState<boolean>(true)

  // Simulation loop for the live debate preview
  useEffect(() => {
    if (!isSimulating) return
    const timer = setInterval(() => {
      setSimulatedTurn((prev) => (prev + 1) % 4)
    }, 4500)
    return () => clearInterval(timer)
  }, [isSimulating])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  }

  return (
    <div className="relative min-h-screen text-slate-100 overflow-visible">
      {/* Ambient background glows */}
      <div className="glow-blob w-[400px] h-[400px] bg-cyan-500/10 top-20 left-10" />
      <div className="glow-blob w-[500px] h-[500px] bg-purple-500/10 top-[600px] right-10" style={{ animationDelay: '-5s' }} />
      <div className="glow-blob w-[350px] h-[350px] bg-amber-500/5 top-[1200px] left-1/3" style={{ animationDelay: '-10s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 space-y-24 sm:space-y-32">
        
        {/* HERO SECTION */}
        <motion.div
          className="text-center space-y-6 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10 border border-white/10 rounded-full text-cyan-300 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>LLMargument / AIdebate Revival MVP</span>
            <span className="opacity-40">|</span>
            <span className="text-slate-400 font-normal">Pitchdeck Workbench</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            The Alignment Oversight <br />
            <span className="shimmer-text">Debate Engine</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4 font-light"
          >
            An inspectable LLM debate benchmarking workbench. It exposes model behavior under adversarial pressure, 
            providing structured judging, real-time factuality annotation, and complete research exports.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4"
          >
            <Link
              href="/debate/new"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-[1.03] transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]"
            >
              <span>Initialize Debate Run</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/showcase"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/60 border border-white/10 text-white font-bold rounded-xl hover:bg-slate-800/80 hover:border-cyan-500/30 hover:scale-[1.03] transition-all duration-300"
            >
              <span>Explore Interactive Showcase</span>
              <Beaker className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* INTERACTIVE DATA FLOW INFOGRAPHIC */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Adversarial Engine Data Flow</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Click a module on the right to trace how data, validation, and judging cycle through the debate graph.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Image with interactive highlighting */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-3 overflow-hidden glass-panel">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                {/* Visual Hotspot Pointer Grid */}
                <img 
                  src="/infographic.jpg" 
                  alt="Aldebate Data Flow Infographic" 
                  className="w-full rounded-xl object-contain relative z-10 border border-white/5 shadow-2xl transition-all duration-500"
                />
                
                {/* Floating glow indicator tied to active hotspot */}
                <div className={`absolute inset-0 border-2 rounded-xl transition-all duration-500 pointer-events-none z-20 ${
                  INFOGRAPHIC_HOTSPOTS.find(h => h.id === activeHotspot)?.glow || ''
                }`} />
              </div>
            </div>

            {/* Right Column: Hotspot Details Selector */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                {INFOGRAPHIC_HOTSPOTS.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    onClick={() => setActiveHotspot(hotspot.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                      activeHotspot === hotspot.id
                        ? 'bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
                        : 'bg-slate-950/20 border-white/5 hover:border-white/10 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      activeHotspot === hotspot.id ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                    }`} />
                    <div>
                      <h4 className={`font-semibold text-sm sm:text-base ${
                        activeHotspot === hotspot.id ? hotspot.color : 'text-slate-300'
                      }`}>
                        {hotspot.title}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2">
                        {hotspot.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanatory pane for selected hotspot */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHotspot}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">System Blueprint</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {INFOGRAPHIC_HOTSPOTS.find(h => h.id === activeHotspot)?.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-light">
                    {INFOGRAPHIC_HOTSPOTS.find(h => h.id === activeHotspot)?.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* CORE ALIGNMENT RESEARCH METRIC CARDS */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Benchmarking Architecture</h2>
            <p className="text-slate-400">
              The revival MVP isolates critical telemetry variables to identify failure states and alignment degradation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent blur-xl" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Gavel className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Double-Pass Judging</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Swaps Pro/Con turn ordering in separate judge pipelines to identify and nullify position bias before issuing a score.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent blur-xl" />
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Persuasion Divergence</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Calculates the discrepancy between the judged winner and the factuality-favored side, highlighting "charismatic liar" issues.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent blur-xl" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Source-Level Claims</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Retains specific search query traces, URL citations, and confidence percentages, rather than abstract factuality verdicts.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-xl" />
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Structured Schema</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Exports standardized dataset manifests in JSONL/CSV format, suitable for immediate integration into Python scripts.
              </p>
            </div>
          </div>
        </section>

        {/* LIVE SIMULATOR/PREVIEW STATE PANEL */}
        <section className="grid lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-purple-400 uppercase">
              <Play className="w-3.5 h-3.5 fill-purple-400" />
              <span>Interactive Simulator</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Living Debate Simulator</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light">
              Watch a mock representation of the engine resolving a debate turn. Observe the fact-checking gate verify statements and the judge issue a final ruling.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? "Pause Loop" : "Resume Loop"}</span>
              </button>
              <span className="text-xs text-slate-500">Auto-advances every 4.5s</span>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex flex-col justify-between min-h-[380px]">
              
              {/* Simulator Header */}
              <div className="px-5 py-3 border-b border-white/10 bg-slate-950/50 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Run: adhoc_preview_smoke_test</span>
                <span className="font-semibold text-cyan-400 uppercase tracking-widest animate-pulse">State: {simulatedTurn === 3 ? "Evaluating" : "Streaming"}</span>
              </div>

              {/* Simulated Turn Body */}
              <div className="p-5 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {simulatedTurn === 0 && (
                    <motion.div
                      key="turn-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">Pro</span>
                        <span className="font-semibold text-sm text-white">Claude Sonnet 4.5</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed italic bg-cyan-950/10 border-l-2 border-cyan-500/50 pl-3.5 py-1">
                        "Open-source model release fosters global scientific collaboration and decentralizes AI capabilities, rendering safety validation public and verifiable."
                      </p>
                      {/* Fact Check overlay */}
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3 flex items-start gap-2 text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-emerald-400">Claims Verified:</span> "Open-source release allows external audit" is true. (Sources: 3 verified publications).
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {simulatedTurn === 1 && (
                    <motion.div
                      key="turn-1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase">Con</span>
                        <span className="font-semibold text-sm text-white">GPT-5.1</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed italic bg-pink-950/10 border-l-2 border-pink-500/50 pl-3.5 py-1">
                        "Unrestricted model weights enable malicious actors to strip safety filters, proliferating automated cyber-offense software and dangerous chemical templates."
                      </p>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3 flex items-start gap-2 text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-emerald-400">Claims Verified:</span> "Safety filters can be fine-tuned away" is true. (Sources: arXiv:2310.0294).
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {simulatedTurn === 2 && (
                    <motion.div
                      key="turn-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Fact-Checking Gate Triggered</span>
                      </div>
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
                        <p className="text-slate-200">
                          <span className="font-bold text-amber-300">Evaluating draft claim:</span> "Open-source licensing yields zero liability for creators under EU AI Act."
                        </p>
                        <p className="text-red-400 font-mono">
                          ❌ Verdict: FALSE. (Confidence 91%). Reason: EU AI Act imposes specific obligations on general-purpose AI models, including open weights.
                        </p>
                        <p className="text-slate-400 italic">
                          State Gate Action: Turn rejected. Requesting model self-correction...
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {simulatedTurn === 3 && (
                    <motion.div
                      key="turn-3"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-purple-400">
                        <Gavel className="w-4 h-4 animate-bounce" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Double-Pass Judging Analysis</span>
                      </div>
                      <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                          <div className="bg-slate-950/60 p-2 rounded border border-white/5 text-center">
                            Pro-First Pass: <span className="text-cyan-400 font-bold">Con Win (6.2 - 5.8)</span>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded border border-white/5 text-center">
                            Con-First Pass: <span className="text-cyan-400 font-bold">Con Win (6.0 - 5.9)</span>
                          </div>
                        </div>
                        <p className="text-slate-200 leading-relaxed">
                          <span className="font-bold text-white">Consensus Verdict:</span> Con Side (GPT-5.1) wins. "Pro argued transparent validation excellently, but Con demonstrated concrete threat proliferation vectors that Pro's adaptation models failed to neutralize."
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Bar Indicator */}
              <div className="h-1 bg-slate-900 w-full overflow-hidden">
                <motion.div 
                  key={simulatedTurn}
                  className="h-full bg-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.5, ease: "linear" as const }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* PITCHDECK MODEL LEADERBOARD */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Workbench Model Standings</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Cumulative metrics evaluated across active benchmark topic configurations. 
              Only completed runs contribute to ranking scores.
            </p>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 text-center">Rank</th>
                    <th className="py-4 px-6">Model ID</th>
                    <th className="py-4 px-6">Win Rate</th>
                    <th className="py-4 px-6">Factuality Index</th>
                    <th className="py-4 px-6">Charismatic Liar Index</th>
                    <th className="py-4 px-6 text-right">Avg Cost / 1k</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {LEADERBOARD_MODELS.map((model) => (
                    <tr 
                      key={model.rank} 
                      className="hover:bg-slate-900/30 transition-colors duration-200 group"
                    >
                      <td className="py-4 px-6 text-center font-bold text-slate-300">
                        {model.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs">1</span>
                        ) : (
                          model.rank
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{model.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{model.provider}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{model.winRate}%</span>
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${model.winRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{model.factuality}%</span>
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${model.factuality}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${model.charismaticLiarIndex > 0.15 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {model.charismaticLiarIndex.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 italic">(Divergence rate)</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-300">
                        ${model.cost.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ROADMAP ACTION BLOCK */}
        <section className="p-8 sm:p-12 rounded-3xl border border-white/10 bg-slate-950/40 relative overflow-hidden glass-panel">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold text-white">Aligned with Revival Roadmap Direction</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              This system prioritizes research data integrity. Gamification elements such as prediction markets, 
              badges, points, and consumer betting dashboards are permanently archived.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <a 
                href="https://github.com/Nether403/AIdebate/blob/main/docs/REVIVAL_ROADMAP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-white hover:bg-slate-800 transition-all"
              >
                <span>Read the Roadmap</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <Link 
                href="/showcase"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-xs font-semibold text-purple-300 hover:scale-105 transition-all"
              >
                <span>View Real Sample Artifacts</span>
                <Beaker className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
