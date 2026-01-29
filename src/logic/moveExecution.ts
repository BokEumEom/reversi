import type { Board, Position, Player } from '../types'
import { copyBoard } from './boardUtils'
import { getAllFlips, isValidMove } from './moveValidation'

export function makeMove(board: Board, pos: Position, player: Player): Board {
  if (!isValidMove(board, pos, player)) {
    return board
  }

  const newBoard = copyBoard(board)
  const flips = getAllFlips(board, pos, player)

  newBoard[pos.row][pos.col] = player

  for (const flip of flips) {
    newBoard[flip.row][flip.col] = player
  }

  return newBoard
}

export function getFlippedPositions(
  board: Board,
  pos: Position,
  player: Player
): ReadonlyArray<Position> {
  return getAllFlips(board, pos, player)
}
