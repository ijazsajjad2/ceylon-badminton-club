import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import si from './locales/si.json'
import ta from './locales/ta.json'

// English, Sinhala and Tamil for the public site. Sinhala/Tamil copy is a
// best-effort machine-assisted translation (see src/i18n/locales/*.json) —
// flagged for a native speaker on the team to review and refine.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'si', 'ta'],
    load: 'languageOnly', // normalize browser locales like "en-US" -> "en"
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cbc.lang',
    },
  })

export default i18n
