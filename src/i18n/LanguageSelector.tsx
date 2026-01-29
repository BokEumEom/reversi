import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
] as const

export function LanguageSelector() {
  const { i18n } = useTranslation()

  const currentLang = languages.find(l => i18n.language.startsWith(l.code)) || languages[0]

  return (
    <select
      value={currentLang.code}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs px-2.5 py-1.5 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer focus:outline-none"
    >
      {languages.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  )
}
