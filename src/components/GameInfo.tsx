import { useTranslation } from 'react-i18next'
import type { Player, Scores } from '../types'

interface GameInfoProps {
  readonly scores: Scores
  readonly currentPlayer: Player
  readonly isGameOver: boolean
  readonly winner: Player | 'tie' | null
  readonly isAIThinking: boolean
}

export function GameInfo({ scores, currentPlayer, isGameOver, winner, isAIThinking }: GameInfoProps) {
  const { t } = useTranslation()

  const getWinnerText = () => {
    if (winner === 'tie') return t('game.tie')
    if (winner === 'black') return t('game.blackWins')
    if (winner === 'white') return t('game.whiteWins')
    return ''
  }

  const getCurrentPlayerText = () => {
    if (isAIThinking) return t('game.aiThinking')
    return currentPlayer === 'black' ? t('game.blackTurn') : t('game.whiteTurn')
  }

  return (
    <div className="text-center mb-6">
      <div className="flex justify-center gap-8 mb-4">
        <div className={`px-4 py-2 rounded-lg ${currentPlayer === 'black' && !isGameOver ? 'bg-gray-700 ring-2 ring-yellow-400' : 'bg-gray-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-600" />
            <span className="text-xl font-bold">{scores.black}</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg ${currentPlayer === 'white' && !isGameOver ? 'bg-gray-700 ring-2 ring-yellow-400' : 'bg-gray-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300" />
            <span className="text-xl font-bold">{scores.white}</span>
          </div>
        </div>
      </div>
      <div className="text-lg">
        {isGameOver ? (
          <span className="text-yellow-400 font-bold text-2xl">{getWinnerText()}</span>
        ) : (
          <span className={isAIThinking ? 'text-blue-400 animate-pulse' : 'text-gray-300'}>
            {getCurrentPlayerText()}
          </span>
        )}
      </div>
    </div>
  )
}
