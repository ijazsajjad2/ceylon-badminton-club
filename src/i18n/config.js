import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

// Public-site languages.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: {translation:{joinModal:{title:'🏸 طلب الانضمام إلى النادي',nameLabel:'اسمك',nameOptional:'(اختياري)',namePlaceholder:'اكتب اسمك',levelLabel:'مستواك',levelBeginner:'مبتدئ',levelImprover:'في طور التحسن',levelIntermediate:'متوسط',levelAdvanced:'متقدم',dayLabel:'أي حصة تناسبك؟',dayWed:'مساء الأربعاء (٨–١٠ مساءً)',daySat:'صباح السبت (٨–١٠ صباحاً)',dayEither:'كلاهما مناسب',previewLabel:'معاينة الرسالة:',messageWithName:'🏸 مرحباً! اسمي {{name}} وأرغب في الانضمام إلى نادي سيلان للريشة الطائرة في الرياض.\n• المستوى: {{level}}\n• الموعد المفضل: {{day}}\nهل يمكنكم تأكيد مكاني والرسوم؟',messageNoName:'🏸 مرحباً! أرغب في الانضمام إلى نادي سيلان للريشة الطائرة في الرياض.\n• المستوى: {{level}}\n• الموعد المفضل: {{day}}\nهل يمكنكم تأكيد مكاني والرسوم؟',cancel:'إلغاء'},nav:{memberLogin:'دخول الأعضاء'},faq:{q1:'هل يمكن للمبتدئين الانضمام؟',a1:'نعم، جميع المستويات مرحب بها. أخبرنا بمستواك عند التواصل.',q2:'هل أحتاج إلى شريك؟',a2:'لا، نغيّر الشركاء في مباريات الزوجي.',q3:'ما رسوم الحصة؟',q4:'ماذا أحضر معي؟',q5:'كيف أنضم؟',a5:'تواصل مع النادي لتأكيد حجزك قبل الحضور.'}}},
  },
  lng: (() => { try { return localStorage.getItem('cbc-language') === 'ar' ? 'ar' : 'en' } catch { return 'en' } })(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n

const direction=language=>{document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';try{localStorage.setItem('cbc-language',language)}catch{}}
i18n.on('languageChanged',direction)
direction(i18n.language)
