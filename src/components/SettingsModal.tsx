import { useTranslation } from 'react-i18next'
import { useAudioSettings } from '../audio/AudioContext'
import { useThemeSettings, THEME_PRESETS, THEME_OPTIONS } from '../theme'

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'Français' },
] as const

interface SettingsModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation()
  const { settings: audioSettings, toggleSound, setVolume } = useAudioSettings()
  const { settings: themeSettings, setTheme } = useThemeSettings()

  const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) || LANGUAGES[0]

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-2xl p-6 max-w-sm w-full border border-neutral-800 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 text-sm">{t('settings.sound')}</span>
            <button
              onClick={toggleSound}
              className={`
                w-11 h-6 rounded-full transition-colors relative
                ${audioSettings.enabled ? 'bg-emerald-600' : 'bg-neutral-700'}
              `}
              aria-label={t('settings.sound')}
            >
              <div className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                ${audioSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Volume */}
          {audioSettings.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-xs">{t('settings.volume')}</span>
                <span className="text-neutral-500 text-xs">{Math.round(audioSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(audioSettings.volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full accent-emerald-500 h-1"
              />
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-neutral-800" />

          {/* Language */}
          <div className="space-y-3">
            <span className="text-neutral-300 text-sm">{t('settings.language')}</span>
            <div className="grid grid-cols-5 gap-1.5">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => i18n.changeLanguage(code)}
                  className={`
                    py-2 rounded-lg text-xs font-medium transition-all
                    ${currentLang.code === code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }
                  `}
                >
                  {label.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-800" />

          {/* Board Theme */}
          <div className="space-y-3">
            <span className="text-neutral-300 text-sm">{t('settings.boardTheme')}</span>
            <div className="grid grid-cols-5 gap-2">
              {THEME_OPTIONS.map(({ id, labelKey }) => {
                const previewTheme = THEME_PRESETS[id]
                const isActive = themeSettings.themeId === id
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`
                      p-2 rounded-lg transition-all flex flex-col items-center gap-1
                      ${isActive
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-neutral-900'
                        : 'hover:bg-neutral-800'
                      }
                    `}
                    title={t(labelKey)}
                  >
                    <div
                      className="w-8 h-8 rounded-md border border-neutral-600"
                      style={{ backgroundColor: previewTheme.cellNormal }}
                    />
                    <span className="text-[10px] text-neutral-400 truncate w-full text-center">
                      {t(labelKey)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
