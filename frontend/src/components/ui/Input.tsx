import { useId, type ReactNode, type InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  error?: string
  helper?: string
  icon?: ReactNode
}

export default function Input({ label, error, helper, icon, className = '', required, disabled, ...props }: Props) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-surface-700">
          {label}
          {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{icon}</div>}
        <input
          id={id}
          required={required}
          disabled={disabled}
          className={`w-full h-9 rounded-[var(--radius-input)] border text-sm transition-all duration-200 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface-0 text-surface-900 ${icon ? 'pl-10 pr-3' : 'px-3'} ${error ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500' : 'border-surface-200 hover:border-surface-300'} ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {!error && helper && <p className="text-xs text-surface-500">{helper}</p>}
    </div>
  )
}
