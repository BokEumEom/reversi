import type { Board, Player } from '../types'
import { countPieces } from './boardUtils'
import { hasValidMoves } from './moveValidation'

export function isGameOver(board: Board): boolean {
  return !hasValidMoves(board, 'black') && !hasValidMoves(board, 'white')
}

export function determineWinner(board: Board): Player | 'tie' {
  const { black, white } = countPieces(board)

  if (black > white) return 'black'
  if (white > black) return 'white'
  return 'tie'
}

export function calculateScores(board: Board): { black: number; white: number } {
  return countPieces(board)
}

export function shouldPassTurn(board: Board, player: Player): boolean {
  return !hasValidMoves(board, player)
}
