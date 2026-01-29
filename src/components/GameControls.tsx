import { useTranslation } from 'react-i18next'
import type { GameMode, Difficulty } from '../types'

interface GameControlsProps {
  readonly gameMode: GameMode
  readonly difficulty: Difficulty
  readonly onModeChange: (mode: GameMode) => void
  readonly onDifficultyChange: (difficulty: Difficulty) => void
  readonly onNewGame: () => void
  readonly onOnlineClick?: () => void
}

export function GameControls({
  gameMode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onNewGame,
  onOnlineClick,
}: GameControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => onModeChange('local')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            gameMode === 'local'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {t('gameMode.local')}
        </button>
        <button
          onClick={() => onModeChange('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            gameMode === 'ai'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {t('gameMode.ai')}
        </button>
        {onOnlineClick && (
          <button
            onClick={onOnlineClick}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              gameMode === 'online'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {t('gameMode.online')}
          </button>
        )}
      </div>

      {gameMode === 'ai' && (
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                difficulty === diff
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t(`difficulty.${diff}`)}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onNewGame}
        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
      >
        {t('game.newGame')}
      </button>
    </div>
  )
}
