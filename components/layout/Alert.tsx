import { ReactNode } from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react'

interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  onClose?: () => void
  className?: string
}

export function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  }

  const variantClasses = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  }

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {icons[variant]}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-semibold mb-1 text-sm">
            {title}
          </h3>
        )}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
