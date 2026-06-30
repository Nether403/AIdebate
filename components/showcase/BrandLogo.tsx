import Image from 'next/image'
import { BRAND_IMAGES } from '@/lib/design-system/manifest'

/**
 * BrandLogo — persistent visual anchor for the Showcase_Experience.
 *
 * Renders the brand logo through `next/image` (optimized AVIF/WebP per
 * next.config) using src/alt from the Design_System manifest. Sized for reuse
 * in the navigation shell and footers. The logo asset is 1024×1024 (1:1), so a
 * single `size` drives both dimensions and aspect ratio is preserved.
 *
 * Requirements: 2.2 (persistent logo anchor), 8.1 (informational alt), 11.2
 * (optimized image scaled near display dimensions).
 */

// ponytail: index-independent lookup so a manifest reorder can't swap the asset.
const LOGO = BRAND_IMAGES.find((img) => img.src === '/logo.jpg') ?? BRAND_IMAGES[0]

interface BrandLogoProps {
  /** Rendered square size in CSS pixels (asset is 1:1). */
  size?: number
  /** Prioritize loading (use for the above-the-fold nav logo). */
  priority?: boolean
  className?: string
}

export function BrandLogo({ size = 40, priority = false, className }: BrandLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden ${className ?? ''}`}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <Image
        src={LOGO.src}
        alt={LOGO.alt}
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        style={{ width: size, height: 'auto' }}
      />
    </span>
  )
}
