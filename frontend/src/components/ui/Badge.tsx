import type { ReactNode } from 'react'

export type BadgeVariant =
  | 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  | 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'gagne' | 'perdu'

interface Props {
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-blue-50 text-blue-700',
  nouveau: 'bg-indigo-50 text-indigo-700',
  contacte: 'bg-violet-50 text-violet-700',
  qualifie: 'bg-cyan-50 text-cyan-700',
  proposition: 'bg-amber-50 text-amber-700',
  negociation: 'bg-orange-50 text-orange-700',
  gagne: 'bg-emerald-50 text-emerald-700',
  perdu: 'bg-red-50 text-red-700',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-surface-400', primary: 'bg-primary-500', success: 'bg-success-500',
  warning: 'bg-warning-500', danger: 'bg-danger-500', info: 'bg-blue-500',
  nouveau: 'bg-indigo-500', contacte: 'bg-violet-500', qualifie: 'bg-cyan-500',
  proposition: 'bg-amber-500', negociation: 'bg-orange-500', gagne: 'bg-emerald-500', perdu: 'bg-red-500',
}

export default function Badge({ variant = 'default', dot = false, size = 'md', children }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-badge)] ${variantClasses[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
