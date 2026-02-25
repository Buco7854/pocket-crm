import { useState, type ReactNode, type ComponentType } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface Props {
  type?: AlertType
  dismissible?: boolean
  children: ReactNode
}

const typeClasses: Record<AlertType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-danger-50 border-danger-200 text-danger-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
}

const typeIcons: Record<AlertType, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

export default function Alert({ type = 'info', dismissible = false, children }: Props) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  const Icon = typeIcons[type]
  return (
    <div className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-4 ${typeClasses[type]}`}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.75} />
      <div className="flex-1 text-sm">{children}</div>
      {dismissible && (
        <button className="cursor-pointer shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors" onClick={() => setVisible(false)}>
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
