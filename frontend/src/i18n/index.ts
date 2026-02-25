import { createI18n } from 'vue-i18n'
import fr from './fr.json'
import en from './en.json'

export type SupportedLocale = 'fr' | 'en'

const savedLocale = (localStorage.getItem('pocket-crm-locale') as SupportedLocale) || 'fr'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: { fr, en },
})

export default i18n
