import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase'
import { XCircle, X, Loader2, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.resetError'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-surface-200 bg-surface-0 shadow-card p-6 text-center">
          <p className="text-sm text-surface-700">{t('auth.invalidResetToken')}</p>
          <Link to="/login" className="mt-4 inline-block text-primary-600 font-medium text-sm hover:text-primary-700">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
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
          <h2 className="text-lg font-semibold text-surface-900 mb-6">{t('auth.resetPassword')}</h2>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-success-600" strokeWidth={1.5} />
              <p className="text-sm text-surface-700">{t('auth.passwordResetSuccess')}</p>
              <Link to="/login" className="text-primary-600 font-medium text-sm hover:text-primary-700">
                {t('auth.signIn')}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
                  <XCircle className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span className="flex-1">{error}</span>
                  <button className="shrink-0 p-0.5 rounded hover:bg-danger-100 transition-colors" onClick={() => setError(null)}>
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-surface-700">{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.newPassword')}
                    className="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-surface-700">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder={t('auth.confirmPassword')}
                    className="w-full h-9 rounded-lg border border-surface-200 bg-surface-0 px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin h-4 w-4" strokeWidth={2} />}
                  {t('auth.resetPassword')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
