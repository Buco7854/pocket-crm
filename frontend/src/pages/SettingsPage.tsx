import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-semibold text-surface-900">{t('nav.settings')}</h1>
    </div>
  )
}
