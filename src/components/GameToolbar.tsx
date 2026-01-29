import { useTranslation } from 'react-i18next'
import type { GameMode, Difficulty } from '../types'

interface GameToolbarProps {
  readonly gameMode: GameMode
  readonly difficulty?: Difficulty
  readonly onNewGame: () => void
  readonly onBackToHome: () => void
}

export function GameToolbar({
  gameMode,
  difficulty,
  onNewGame,
  onBackToHome,
}: GameToolbarProps) {
  const { t } = useTranslation()

  const getModeLabel = () => {
    if (gameMode === 'local') return t('gameMode.local')
    if (gameMode === 'ai') return `${t('gameMode.ai')} · ${t(`difficulty.${difficulty}`)}`
    return t('gameMode.online')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Mode badge */}
      <span className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 text-xs">
        {getModeLabel()}
      </span>

      {/* New Game */}
      <button
        onClick={onNewGame}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t('game.newGame')}
      </button>

      {/* Back to Home */}
      <button
        onClick={onBackToHome}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('backToHome')}
      </button>
    </div>
  )
}
