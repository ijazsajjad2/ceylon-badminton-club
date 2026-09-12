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
    ar: {translation:{nav:{memberLogin:'دخول الأعضاء'},faq:{q1:'هل يمكن للمبتدئين الانضمام؟',a1:'نعم، جميع المستويات مرحب بها. أخبرنا بمستواك عند التواصل.',q2:'هل أحتاج إلى شريك؟',a2:'لا، نغيّر الشركاء في مباريات الزوجي.',q3:'ما رسوم الحصة؟',q4:'ماذا أحضر معي؟',q5:'كيف أنضم؟',a5:'تواصل مع النادي لتأكيد حجزك قبل الحضور.'}}},
  },
  lng: localStorage.getItem('cbc-language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n

const direction=language=>{document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';try{localStorage.setItem('cbc-language',language)}catch{}}
i18n.on('languageChanged',direction)
direction(i18n.language)
