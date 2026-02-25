import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { XCircle, X, Loader2 } from 'lucide-react'

interface OAuthProvider { name: string; displayName: string }

const providerIcons: Record<string, string> = {
  google: 'M21.35 11.1h-9.18v2.73h5.51c-.24 1.27-.98 2.34-2.09 3.06v2.54h3.39c1.98-1.82 3.12-4.51 3.12-7.58 0-.52-.05-1.02-.14-1.5z M12.18 22c2.84 0 5.22-.94 6.96-2.57l-3.39-2.54c-.94.63-2.15 1-3.57 1-2.74 0-5.06-1.85-5.89-4.34H2.75v2.62C4.48 19.78 8.03 22 12.18 22z M6.29 13.55a5.87 5.87 0 010-3.1V7.83H2.75a9.97 9.97 0 000 8.34l3.54-2.62z M12.18 5.98c1.55 0 2.94.53 4.03 1.57l3.02-3.02C17.38 2.79 15.01 1.8 12.18 1.8c-4.15 0-7.7 2.22-9.43 5.83l3.54 2.62c.83-2.49 3.15-4.27 5.89-4.27z',
  github: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { login, loginWithProvider, listAuthProviders, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [providers, setProviders] = useState<OAuthProvider[]>([])

  useEffect(() => {
    listAuthProviders().then(setProviders)
  }, [listAuthProviders])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try { await login(email, password) } catch { /* handled in store */ }
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
          <h2 className="text-lg font-semibold text-surface-900 mb-6">{t('auth.signIn')}</h2>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="flex-1">{error}</span>
              <button className="shrink-0 p-0.5 rounded hover:bg-danger-100 transition-colors" onClick={clearError}>
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {providers.length > 0 && (
            <div className="space-y-2 mb-5">
              {providers.map((p) => (
                <button
                  key={p.name}
                  disabled={loading}
                  className="w-full h-10 rounded-lg border border-surface-200 bg-surface-0 text-sm font-medium text-surface-700 hover:bg-surface-50 active:bg-surface-100 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => loginWithProvider(p.name)}
                >
                  {providerIcons[p.name] && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d={providerIcons[p.name]} />
                    </svg>
                  )}
                  {t('auth.continueWith', { provider: p.displayName })}
                </button>
              ))}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-0 px-3 text-surface-400">{t('auth.orEmail')}</span>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">{t('auth.email')}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.email')} className="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">{t('auth.password')}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.password')} className="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <Loader2 className="animate-spin h-4 w-4" strokeWidth={2} />}
              {t('auth.signIn')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-surface-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">{t('auth.signUp')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
