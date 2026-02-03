import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface HowToPlayScreenProps {
  readonly onClose: () => void
}

export function HowToPlayScreen({ onClose }: HowToPlayScreenProps) {
  const { t } = useTranslation()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(onClose, 250)
  }, [onClose])

  return (
    <div className={`fixed inset-0 z-50 bg-[#111] flex flex-col ${isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-medium">{t('home.howToPlay')}</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Board illustration */}
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-1 p-2 bg-emerald-900/30 rounded-lg">
            {[
              0, 0, 0, 0,
              0, 2, 1, 0,
              0, 1, 2, 0,
              0, 0, 0, 0,
            ].map((cell, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-emerald-800/50 rounded flex items-center justify-center"
              >
                {cell === 1 && (
                  <div className="w-6 h-6 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 50%, #000)' }} />
                )}
                {cell === 2 && (
                  <div className="w-6 h-6 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 50%, #bbb)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Basic Rules */}
        <section>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-xs font-bold">1</span>
            {t('howToPlay.basicTitle')}
          </h2>
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.basic1')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.basic2')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.basic3')}</p>
          </div>
        </section>

        {/* How to Flip */}
        <section>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-xs font-bold">2</span>
            {t('howToPlay.flipTitle')}
          </h2>
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.flip1')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.flip2')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.flip3')}</p>
          </div>
        </section>

        {/* Strategy Tips */}
        <section>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400 text-xs font-bold">3</span>
            {t('howToPlay.strategyTitle')}
          </h2>
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.strategy1')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.strategy2')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.strategy3')}</p>
          </div>
        </section>

        {/* Win Condition */}
        <section>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 text-xs font-bold">4</span>
            {t('howToPlay.endTitle')}
          </h2>
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.end1')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.end2')}</p>
          </div>
        </section>

        {/* Online Play */}
        <section>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-900/50 flex items-center justify-center text-sky-400 text-xs font-bold">5</span>
            {t('howToPlay.onlineTitle')}
          </h2>
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.online1')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.online2')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.online3')}</p>
            <p className="text-neutral-400 text-xs leading-relaxed">{t('howToPlay.online4')}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
