'use client'

import Link from 'next/link'
import { ArrowRight, Beaker, FileCode, Gavel, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  const capabilities = [
    {
      icon: Beaker,
      title: 'Benchmark Runs',
      description: 'Group debates under a fixed config, judge, and prompt version for reproducible comparisons.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Gavel,
      title: 'Inspectable Judging',
      description: 'Structured judge output with parse status, position-swap consensus, and explicit evaluation failures.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: ShieldCheck,
      title: 'Fact-Check Annotations',
      description: 'Per-claim verdicts and sources persisted alongside every turn for downstream analysis.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: FileCode,
      title: 'Dataset Exports',
      description: 'JSONL artifacts with a run manifest, covering configuration, transcripts, judging, and provider telemetry.',
      color: 'from-amber-500 to-orange-500',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <motion.div
          className="text-center space-y-6 mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-sm font-medium"
          >
            <span>Revival MVP</span>
            <span className="opacity-60">·</span>
            <span>not production-ready</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight"
          >
            AI Debate Workbench
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4"
          >
            A lean LLM debate benchmarking and alignment-research tool. It generates reliable, inspectable debate
            artifacts between language models with enough metadata, judging, fact-check annotations, and export
            support to compare models under a fixed configuration.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-6"
          >
            <Link
              href="/debate/new"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
            >
              <span>Start a debate</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://github.com/Nether403/AIdebate/blob/main/docs/REVIVAL_ROADMAP.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 text-slate-100 font-semibold rounded-lg hover:bg-slate-700 transition-all border border-slate-700"
            >
              <span>Read the roadmap</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Capabilities */}
        <motion.div
          className="grid sm:grid-cols-2 gap-6 mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {capabilities.map((capability) => {
            const Icon = capability.icon
            return (
              <motion.div
                key={capability.title}
                variants={itemVariants}
                className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${capability.color} mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{capability.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{capability.description}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Scope note */}
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 text-sm text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="leading-relaxed">
            Out of scope for the revival MVP: prediction markets, DebatePoints, Superforecaster badges, public
            leaderboards, personal betting dashboards, and social-sharing mechanics. See{' '}
            <code className="text-slate-200">docs/REVIVAL_ROADMAP.md</code> for the current direction.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
