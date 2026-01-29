import { useTranslation } from 'react-i18next'
import type { Player, Scores } from '../types'

interface GameOverModalProps {
  readonly winner: Player | 'tie'
  readonly scores: Scores
  readonly onPlayAgain: () => void
  readonly onBackToHome?: () => void
}

export function GameOverModal({ winner, scores, onPlayAgain, onBackToHome }: GameOverModalProps) {
  const { t } = useTranslation()

  const getWinnerText = () => {
    if (winner === 'tie') return t('game.tie')
    return winner === 'black' ? t('game.blackWins') : t('game.whiteWins')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center max-w-xs w-full">
        <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
          {t('game.gameOver')}
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">{getWinnerText()}</h2>

        {/* Scores */}
        <div className="flex justify-center gap-10 mb-8">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 50%, #000)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            />
            <span className="text-2xl font-bold text-white tabular-nums">{scores.black}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 50%, #bbb)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />
            <span className="text-2xl font-bold text-white tabular-nums">{scores.white}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {t('game.playAgain')}
          </button>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full py-2.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {t('backToHome')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
