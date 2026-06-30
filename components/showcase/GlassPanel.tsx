import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

/**
 * GlassPanel — thin wrapper around the single consolidated `.glass-panel`
 * primitive defined once in `app/globals.css` (Requirement 1.7). It adds no
 * styling of its own (no colors / blur / shadow); it only references the shared
 * class and merges any caller-supplied `className`.
 *
 * `.glass-panel` is an elevation-only surface — it carries no glow, keeping glow
 * confined to accent/emphasis roles (Requirement 2.5).
 *
 * Server component: no interactivity, so no `'use client'`.
 */
export const GlassPanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function GlassPanel({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={`glass-panel ${className ?? ''}`.trim()} {...rest}>
        {children}
      </div>
    )
  }
)
