import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ 
  children, 
  className = '', 
  hover = false,
  onClick,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const baseClasses = `bg-slate-800 dark:bg-slate-800 rounded-lg border border-slate-700 dark:border-slate-700 ${paddingClasses[padding]}`
  const hoverClasses = hover ? 'hover:border-slate-600 transition-all cursor-pointer' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''

  if (hover || onClick) {
    return (
      <motion.div
        className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
        onClick={onClick}
        whileHover={hover ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  )
}
