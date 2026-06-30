import type { ComponentPropsWithoutRef } from 'react'
import { ACCENT_TOKENS, type AccentToken } from '@/lib/design-system/tokens'

/**
 * GlowBlob — decorative ambient accent glow. Wraps the single consolidated
 * `.glow-blob` primitive defined once in `app/globals.css` (Requirement 1.7),
 * which is restricted to the emphasis/accent role and is disabled under
 * `prefers-reduced-motion` there (Requirement 2.5, 2.7).
 *
 * `.glow-blob` intentionally declares no background colour — the colour comes
 * from a Design_System accent token utility class and nothing else
 * (Requirement 1.6). The `accent` prop is constrained to the accent allow-list,
 * so no arbitrary colour can be introduced.
 *
 * Purely decorative: marked `aria-hidden` and given no accessible name.
 * Positioning (size / placement) is supplied by the caller via `className`.
 */
const ACCENT_BG: Record<AccentToken, string> = {
  [ACCENT_TOKENS.primary]: 'bg-accent-primary',
  [ACCENT_TOKENS.supporting[0]]: 'bg-accent-2',
  [ACCENT_TOKENS.supporting[1]]: 'bg-accent-3',
  [ACCENT_TOKENS.supporting[2]]: 'bg-accent-4',
}

interface GlowBlobProps extends Omit<ComponentPropsWithoutRef<'div'>, 'aria-hidden'> {
  /** Which Design_System accent token tints the glow. Defaults to the primary accent. */
  accent?: AccentToken
}

export function GlowBlob({ accent = ACCENT_TOKENS.primary, className, ...rest }: GlowBlobProps) {
  return (
    <div
      aria-hidden="true"
      className={`glow-blob ${ACCENT_BG[accent]} ${className ?? ''}`.trim()}
      {...rest}
    />
  )
}
