import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-surface-900">{t('nav.dashboard')}</h1>
      <p className="mt-1 text-surface-500 text-sm">{t('dashboard.welcome')}</p>
    </div>
  )
}
