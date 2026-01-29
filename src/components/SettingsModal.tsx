import { useTranslation } from 'react-i18next'
import { useAudioSettings } from '../audio/AudioContext'

interface SettingsModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const { settings, toggleSound, setVolume } = useAudioSettings()

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
                ${settings.enabled ? 'bg-emerald-600' : 'bg-neutral-700'}
              `}
              aria-label={t('settings.sound')}
            >
              <div className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Volume */}
          {settings.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-xs">{t('settings.volume')}</span>
                <span className="text-neutral-500 text-xs">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full accent-emerald-500 h-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
