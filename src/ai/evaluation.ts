import type { Board, Player } from '../types'
import { BOARD_SIZE, POSITION_WEIGHTS } from '../config/constants'
import { getOpponent } from '../logic/boardUtils'
import { getValidMoves } from '../logic/moveValidation'

export function evaluateBoard(board: Board, player: Player): number {
  const opponent = getOpponent(player)
  let score = 0

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col]
      const weight = POSITION_WEIGHTS[row][col]

      if (cell === player) {
        score += weight
      } else if (cell === opponent) {
        score -= weight
      }
    }
  }

  const playerMobility = getValidMoves(board, player).length
  const opponentMobility = getValidMoves(board, opponent).length
  score += (playerMobility - opponentMobility) * 5

  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 7 },
    { row: 7, col: 0 },
    { row: 7, col: 7 },
  ]

  for (const corner of corners) {
    const cell = board[corner.row][corner.col]
    if (cell === player) {
      score += 25
    } else if (cell === opponent) {
      score -= 25
    }
  }

  return score
}
