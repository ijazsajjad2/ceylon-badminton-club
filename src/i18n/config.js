import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  supportedLngs: ['en'],
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Reset language preferences saved by earlier bilingual versions.
document.documentElement.lang = 'en'
document.documentElement.dir = 'ltr'
try { localStorage.removeItem('cbc-language') } catch {}

export default i18n
