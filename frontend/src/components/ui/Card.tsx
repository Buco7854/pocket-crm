import type { ReactNode } from 'react'

interface Props {
  hoverable?: boolean
  padding?: boolean
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export default function Card({ hoverable = false, padding = true, header, footer, children, className = '' }: Props) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-surface-200 bg-surface-0 shadow-card transition-all duration-200 ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${className}`}>
      {header && <div className="px-5 py-4 border-b border-surface-100">{header}</div>}
      <div className={padding ? 'px-5 py-4' : ''}>{children}</div>
      {footer && <div className="px-5 py-3 border-t border-surface-100 bg-surface-50 rounded-b-[var(--radius-card)]">{footer}</div>}
    </div>
  )
}
