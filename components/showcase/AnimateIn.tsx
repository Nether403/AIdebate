'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { buildVariant, type MotionSpec, type VariantKind } from '@/lib/design-system/motion'

interface AnimateInProps {
  /** Which motion discipline to apply. Defaults to a one-shot entrance. */
  kind?: VariantKind
  children: ReactNode
  className?: string
}

/**
 * Maps a pure {@link MotionSpec} (opacity/y/scale tuples) onto Framer Motion's
 * `initial`/`animate` frames. Absent fields are simply omitted so that under
 * reduced motion — where `buildVariant` returns an opacity-only spec — no
 * positional or scale change is ever emitted (Requirement 9.1).
 */
function toFrames(spec: MotionSpec): {
  initial: Record<string, number>
  animate: Record<string, number>
} {
  const initial: Record<string, number> = {}
  const animate: Record<string, number> = {}
  if (spec.opacity) {
    initial.opacity = spec.opacity[0]
    animate.opacity = spec.opacity[1]
  }
  if (spec.y) {
    initial.y = spec.y[0]
    animate.y = spec.y[1]
  }
  if (spec.scale) {
    initial.scale = spec.scale[0]
    animate.scale = spec.scale[1]
  }
  return { initial, animate }
}

/**
 * One-shot entrance wrapper. Sources its variant from the design-system's pure
 * `buildVariant` builder gated on `useReducedMotion()`, so all motion discipline
 * (entrance <=600ms, reduced-motion opacity-only <=200ms) is guaranteed upstream
 * (Requirements 9.1, 9.6, 9.7). The duration is read straight off the resolved
 * spec — `durationMs / 1000` — because Framer expresses transition duration in
 * seconds.
 */
export function AnimateIn({ kind = 'entrance', children, className }: AnimateInProps) {
  const reducedMotion = useReducedMotion() ?? false
  const spec = buildVariant(kind, reducedMotion)
  const { initial, animate } = toFrames(spec)

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={{ duration: spec.durationMs / 1000 }}
    >
      {children}
    </motion.div>
  )
}
