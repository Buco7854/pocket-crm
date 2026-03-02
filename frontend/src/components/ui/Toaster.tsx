import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/hooks/useToast'

const config: Record<ToastVariant, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  error:   { icon: XCircle,      classes: 'bg-danger-50 border-danger-200 text-danger-900' },
  warning: { icon: AlertTriangle, classes: 'bg-warning-50 border-warning-200 text-warning-900' },
  info:    { icon: Info,          classes: 'bg-primary-50 border-primary-200 text-primary-900' },
}

export default function Toaster() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const { icon: Icon, classes } = config[toast.variant]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 shadow-lg text-sm animate-in slide-in-from-right-4 fade-in duration-200 ${classes}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span className="flex-1">{toast.message}</span>
            <button
              className="cursor-pointer shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
              onClick={() => remove(toast.id)}
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
