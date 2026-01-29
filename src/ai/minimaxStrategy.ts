import type { Board, Position, Player } from '../types'
import { getOpponent } from '../logic/boardUtils'
import { getValidMoves } from '../logic/moveValidation'
import { makeMove } from '../logic/moveExecution'
import { isGameOver } from '../logic/gameState'
import { evaluateBoard } from './evaluation'

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: Player
): number {
  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board, aiPlayer)
  }

  const currentPlayer = maximizingPlayer ? aiPlayer : getOpponent(aiPlayer)
  const validMoves = getValidMoves(board, currentPlayer)

  if (validMoves.length === 0) {
    return minimax(board, depth - 1, alpha, beta, !maximizingPlayer, aiPlayer)
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity

    for (const move of validMoves) {
      const newBoard = makeMove(board, move, currentPlayer)
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer)
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }

    return maxEval
  } else {
    let minEval = Infinity

    for (const move of validMoves) {
      const newBoard = makeMove(board, move, currentPlayer)
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer)
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }

    return minEval
  }
}

export function selectMinimaxMove(
  board: Board,
  player: Player,
  depth: number = 4
): Position | null {
  const validMoves = getValidMoves(board, player)

  if (validMoves.length === 0) return null

  let bestMove = validMoves[0]
  let bestScore = -Infinity

  for (const move of validMoves) {
    const newBoard = makeMove(board, move, player)
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player)

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}
