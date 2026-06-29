'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Gavel, GitPullRequest, MessagesSquare, Database, BarChart3, FlaskConical } from 'lucide-react'

const demos = [
  {
    href: '/showcase/live-debate',
    icon: Gavel,
    title: 'Live Debate Viewer',
    blurb: 'The core artifact: two models argue, get fact-checked, and a bias-aware judge decides. See the reasoning, the sources, and the persuasion-vs-truth signal.',
    tag: 'Flagship · real artifact',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/showcase/regression-gate',
    icon: GitPullRequest,
    title: 'Model Regression Gate',
    blurb: 'A CI check that runs a debate benchmark when you upgrade a model, and blocks the deploy if the new model wins more by being persuasively wrong.',
    tag: 'Embeds in your ML pipeline',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/showcase/steelman',
    icon: MessagesSquare,
    title: 'Steelman Widget',
    blurb: 'A drop-in panel for any product: pick a contested question and get a sourced two-sided analysis with a reasoned verdict. Shown inside a mock host app.',
    tag: 'Embeds as a component',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    href: '/showcase/synthetic-data',
    icon: Database,
    title: 'Synthetic Data Generator',
    blurb: 'Turn one debate into training data: preference pairs with rationales and process-supervision traces, exported as ready-to-use JSONL.',
    tag: 'Feeds your fine-tuning pipeline',
    color: 'from-amber-500 to-orange-500',
  },
  {
    href: '/showcase/eval-report',
    icon: BarChart3,
    title: 'Eval-as-a-Service Report',
    blurb: 'A shareable model-vs-model scorecard: win rates, factuality, and charismatic-liar flags across a benchmark run.',
    tag: 'Embeds as a report API',
    color: 'from-rose-500 to-pink-500',
  },
]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial="hidden" animate="visible" variants={container} className="text-center mb-14 space-y-5">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-sm font-medium">
            <FlaskConical className="w-4 h-4" />
            <span>Showcase</span>
          </motion.div>
          <motion.h1 variants={item} className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            One debate engine, many surfaces
          </motion.h1>
          <motion.p variants={item} className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The same engine that produces inspectable debate artifacts can power evaluation, data generation, and
            product features. Each demo below is interactive and ends with the snippet that shows how it embeds into a
            real application or workflow.
          </motion.p>
          <motion.p variants={item} className="text-sm text-slate-500">
            Demos run on a curated sample artifact so they load instantly — no live model calls required.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={container} className="grid sm:grid-cols-2 gap-6">
          {demos.map((d) => {
            const Icon = d.icon
            return (
              <motion.div key={d.href} variants={item}>
                <Link
                  href={d.href}
                  className="group block h-full rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur p-6 hover:border-slate-500 hover:bg-slate-800 transition-all"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${d.color} mb-4 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">{d.title}</h3>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{d.blurb}</p>
                  <span className="text-xs font-medium text-slate-300 bg-slate-700/60 px-2.5 py-1 rounded-full">{d.tag}</span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
