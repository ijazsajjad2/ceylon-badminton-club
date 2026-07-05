import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/config.js'

/** Compact EN / සිංහල / தமிழ் switcher. Choice persists via i18next-browser-languagedetector (localStorage). */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'en'

  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label="Language">
      {SUPPORTED_LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-switch-btn ${current === l.code ? 'active' : ''}`}
          aria-pressed={current === l.code}
          onClick={() => i18n.changeLanguage(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
