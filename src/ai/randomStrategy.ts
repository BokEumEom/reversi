import type { Position } from '../types'

export function selectRandomMove(
  validMoves: ReadonlyArray<Position>
): Position | null {
  if (validMoves.length === 0) return null
  const index = Math.floor(Math.random() * validMoves.length)
  return validMoves[index]
}
