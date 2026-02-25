import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { XCircle, X, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register, loading, error, clearError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try { await register(email, password, confirmPassword, name) } catch { /* handled in store */ }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mb-4">P</div>
          <h1 className="text-2xl font-semibold text-surface-900">{t('app.name')}</h1>
          <p className="mt-1 text-surface-500 text-sm">{t('app.description')}</p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-6">{t('auth.signUp')}</h2>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="flex-1">{error}</span>
              <button className="shrink-0 p-0.5 rounded hover:bg-danger-100 transition-colors" onClick={clearError}>
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              { label: t('auth.name'), value: name, setter: setName, type: 'text' },
              { label: t('auth.email'), value: email, setter: setEmail, type: 'email' },
              { label: t('auth.password'), value: password, setter: setPassword, type: 'password' },
              { label: t('auth.confirmPassword'), value: confirmPassword, setter: setConfirmPassword, type: 'password' },
            ].map(({ label, value, setter, type }) => (
              <div key={label} className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700">{label}</label>
                <input type={type} required minLength={type === 'password' ? 8 : undefined} value={value} onChange={(e) => setter(e.target.value)} placeholder={label} className="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader2 className="animate-spin h-4 w-4" strokeWidth={2} />}
              {t('auth.signUp')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-surface-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
