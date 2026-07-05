import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

// English-only for now — all public-site copy is already extracted into
// translation keys (src/i18n/locales/en.json), so adding another language
// later is just: drop in a new locale file, register it here, and bring
// back a switcher UI.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
