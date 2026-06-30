'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

/**
 * NeuralBackground — the SINGLE global Decorative_Animation for the Showcase_Experience.
 *
 * Decorative-animation budget (Requirement 2.4): a single viewport may run at most THREE
 * concurrent Decorative_Animations. This canvas is the one global decorative animation and
 * therefore consumes exactly ONE of those slots on every viewport, leaving headroom for at
 * most TWO additional page-local decorative animations per viewport. Page surfaces must not
 * exceed that remaining budget of two.
 *
 * Reduced motion (Requirement 2.7): under `prefers-reduced-motion: reduce` the
 * requestAnimationFrame loop never starts — and is stopped immediately if the preference is
 * toggled on at runtime. A single static frame is still painted so the layered-depth neon
 * anchor stays visible, just without any motion. The media-query listener and any pending
 * RAF are cleaned up on unmount.
 *
 * Zero layout shift (Requirement 11.3): the canvas is `position: fixed`, pulled out of normal
 * document flow behind content (z-0, pointer-events-none) and sized to the viewport, so
 * animating it causes no positional displacement of surrounding elements — cumulative layout
 * shift stays at 0.
 */
export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number | null = null
    let particles: Particle[] = []
    const particleCount = 45
    const connectionDistance = 120
    const colors = [
      'rgba(0, 242, 254, 0.4)',  // cyan
      'rgba(139, 92, 246, 0.3)', // violet
      'rgba(236, 72, 153, 0.3)', // pink
      'rgba(245, 158, 11, 0.25)'  // amber
    ]

    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 180
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const initParticles = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    // Advance particle positions one step (motion). Skipped entirely under reduced motion.
    const stepParticles = () => {
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Boundary check
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        // Mouse attraction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius
            p.x += (dx / dist) * force * 0.5
            p.y += (dy / dist) * force * 0.5
          }
        }
      })
    }

    // Paint the current particle positions. Used both per animation frame and for the
    // single static frame rendered under reduced motion.
    const paint = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      })

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      stepParticles()
      paint()
      animationFrameId = requestAnimationFrame(animate)
    }

    const stop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    // Start the loop, or — under reduced motion — paint a single static frame and stay put.
    const start = () => {
      stop()
      if (reducedMotionQuery.matches) {
        paint()
      } else {
        animate()
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
      // Reflow the static frame immediately when reduced motion is active; the running loop
      // repaints on its own.
      if (reducedMotionQuery.matches) paint()
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    // Start/stop the loop whenever the reduced-motion preference changes at runtime.
    const handleMotionPreferenceChange = () => {
      start()
    }

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange)

    resizeCanvas()
    start()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      reducedMotionQuery.removeEventListener('change', handleMotionPreferenceChange)
      stop()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  )
}
