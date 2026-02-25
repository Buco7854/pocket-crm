import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  children: ReactNode
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, size = 'md', footer, children }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full rounded-xl bg-surface-0 shadow-modal overflow-hidden ${sizeClasses[size]}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
            <button
              className="cursor-pointer flex items-center justify-center h-8 w-8 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [overflow-wrap:anywhere]">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
