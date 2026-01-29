import type { Board, Position, Direction, Player } from '../types'
import { BOARD_SIZE, DIRECTIONS } from '../config/constants'
import { getOpponent } from './boardUtils'

export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE
}

export function getFlipsInDirection(
  board: Board,
  pos: Position,
  direction: Direction,
  player: Player
): ReadonlyArray<Position> {
  const opponent = getOpponent(player)
  const flips: Position[] = []

  let currentRow = pos.row + direction.dRow
  let currentCol = pos.col + direction.dCol

  while (isInBounds({ row: currentRow, col: currentCol })) {
    const cell = board[currentRow][currentCol]

    if (cell === opponent) {
      flips.push({ row: currentRow, col: currentCol })
    } else if (cell === player) {
      return flips
    } else {
      return []
    }

    currentRow += direction.dRow
    currentCol += direction.dCol
  }

  return []
}

export function getAllFlips(
  board: Board,
  pos: Position,
  player: Player
): ReadonlyArray<Position> {
  const allFlips: Position[] = []

  for (const direction of DIRECTIONS) {
    const flips = getFlipsInDirection(board, pos, direction, player)
    allFlips.push(...flips)
  }

  return allFlips
}

export function isValidMove(board: Board, pos: Position, player: Player): boolean {
  if (!isInBounds(pos)) return false
  if (board[pos.row][pos.col] !== 'empty') return false

  return getAllFlips(board, pos, player).length > 0
}

export function getValidMoves(board: Board, player: Player): ReadonlyArray<Position> {
  const moves: Position[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pos = { row, col }
      if (isValidMove(board, pos, player)) {
        moves.push(pos)
      }
    }
  }

  return moves
}

export function hasValidMoves(board: Board, player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, { row, col }, player)) {
        return true
      }
    }
  }
  return false
}
