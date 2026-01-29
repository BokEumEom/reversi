import type { Board, Position, Player } from '../types'
import { getFlippedPositions } from '../logic/moveExecution'

export function selectGreedyMove(
  board: Board,
  player: Player,
  validMoves: ReadonlyArray<Position>
): Position | null {
  if (validMoves.length === 0) return null

  let bestMove = validMoves[0]
  let maxFlips = 0

  for (const move of validMoves) {
    const flips = getFlippedPositions(board, move, player).length
    if (flips > maxFlips) {
      maxFlips = flips
      bestMove = move
    }
  }

  return bestMove
}
