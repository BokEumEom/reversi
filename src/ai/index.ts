import type { Board, Position, Player, Difficulty } from '../types'
import { getValidMoves } from '../logic/moveValidation'
import { selectRandomMove } from './randomStrategy'
import { selectGreedyMove } from './greedyStrategy'
import { selectMinimaxMove } from './minimaxStrategy'

export function selectAIMove(
  board: Board,
  player: Player,
  difficulty: Difficulty
): Position | null {
  const validMoves = getValidMoves(board, player)

  if (validMoves.length === 0) {
    return null
  }

  switch (difficulty) {
    case 'easy':
      return selectRandomMove(validMoves)
    case 'medium':
      return selectGreedyMove(board, player, validMoves)
    case 'hard':
      return selectMinimaxMove(board, player, 4)
    default:
      return selectRandomMove(validMoves)
  }
}
