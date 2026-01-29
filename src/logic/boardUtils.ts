import type { Board, CellState, Player } from '../types'
import { BOARD_SIZE } from '../config/constants'

export function createInitialBoard(): Board {
  const board: CellState[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'empty' as CellState)
  )

  const mid = BOARD_SIZE / 2
  board[mid - 1][mid - 1] = 'white'
  board[mid - 1][mid] = 'black'
  board[mid][mid - 1] = 'black'
  board[mid][mid] = 'white'

  return board
}

export function copyBoard(board: Board): CellState[][] {
  return board.map(row => [...row])
}

export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black'
}

export function countPieces(board: Board): { black: number; white: number } {
  let black = 0
  let white = 0

  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') black++
      else if (cell === 'white') white++
    }
  }

  return { black, white }
}
