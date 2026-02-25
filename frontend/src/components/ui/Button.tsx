import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm shadow-primary-600/20',
  secondary: 'bg-surface-0 text-surface-700 border border-surface-200 hover:bg-surface-50 active:bg-surface-100 shadow-sm',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-sm shadow-danger-600/20',
  ghost: 'text-surface-600 hover:bg-surface-100 active:bg-surface-200',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  children,
  className = '',
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium rounded-[var(--radius-button)] transition-all duration-200 focus-ring select-none ${variantClasses[variant]} ${sizeClasses[size]} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin h-4 w-4" strokeWidth={2} /> : icon}
      {children}
    </button>
  )
}
