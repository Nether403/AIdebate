'use client'

import Image from 'next/image'
import { useState } from 'react'
import { BRAND_IMAGES } from '@/lib/design-system/manifest'

/**
 * Infographic — the debate-benchmarking-flow visual anchor.
 *
 * Renders through `next/image` (optimized AVIF/WebP per next.config) with the
 * descriptive alt from the Design_System manifest. Constrained to its
 * container with intrinsic sizing (max-width:100%, height:auto, container-
 * scoped overflow) so an oversized asset never expands the page width. On a
 * fetch error it renders the alt text as a visible text fallback (a paragraph,
 * never a broken-image element).
 *
 * Requirements: 2.3 (infographic anchor), 7.7 (constrain to container width),
 * 8.1 (descriptive informational alt), 11.2 (optimized image scaled near
 * display dimensions), 11.5 (text fallback on image-fetch failure).
 */

// ponytail: index-independent lookup so a manifest reorder can't swap the asset.
const INFOGRAPHIC = BRAND_IMAGES.find((img) => img.src === '/infographic.jpg') ?? BRAND_IMAGES[1]

/**
 * Pure text-fallback source (Requirement 11.5): the visible alternative shown
 * in place of the image on a fetch error is exactly the manifest's descriptive
 * alt — never a broken-image element. Exported so task 4.6 can assert the
 * fallback text equals the manifest alt without a DOM render.
 */
export function infographicFallbackText(): string {
  return INFOGRAPHIC.alt
}

// Intrinsic dimensions of the asset (1024×558, ~1.83:1) — given to next/image
// so it reserves the correct aspect-ratio box (zero layout shift, Req 11.3).
const INTRINSIC_WIDTH = 1024
const INTRINSIC_HEIGHT = 558

interface InfographicProps {
  /** Prioritize loading when used above the fold. */
  priority?: boolean
  className?: string
  /**
   * Responsive `sizes` hint. Defaults to full-width on mobile and a capped
   * display width on desktop so the optimizer serves a variant within ~1.0–1.5x
   * of the rendered dimensions (Req 11.2).
   */
  sizes?: string
}

export function Infographic({
  priority = false,
  className,
  sizes = '(min-width: 1024px) 768px, 100vw',
}: InfographicProps) {
  const [errored, setErrored] = useState(false)

  // Req 11.5: show the alt text as a visible fallback instead of a broken image.
  if (errored) {
    return (
      <p
        className={`block w-full max-w-full ${className ?? ''}`}
        style={{
          color: 'var(--color-text-muted)',
          background: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-lg)',
        }}
      >
        {infographicFallbackText()}
      </p>
    )
  }

  return (
    <span
      className={`block w-full max-w-full overflow-hidden ${className ?? ''}`}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <Image
        src={INFOGRAPHIC.src}
        alt={INFOGRAPHIC.alt}
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        priority={priority}
        sizes={sizes}
        onError={() => setErrored(true)}
        style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
      />
    </span>
  )
}
