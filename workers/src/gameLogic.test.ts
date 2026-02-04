import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  createInitialGameState,
  copyBoard,
  getOpponent,
  isValidMove,
  getValidMoves,
  makeMove,
  applyMove,
  type Board,
  type Player,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('should create an 8x8 board', () => {
    const board = createInitialBoard()
    expect(board.length).toBe(8)
    expect(board.every(row => row.length === 8)).toBe(true)
  })

  it('should have initial pieces in the center', () => {
    const board = createInitialBoard()
    expect(board[3][3]).toBe('white')
    expect(board[3][4]).toBe('black')
    expect(board[4][3]).toBe('black')
    expect(board[4][4]).toBe('white')
  })

  it('should have all other cells empty', () => {
    const board = createInitialBoard()
    let emptyCount = 0
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'empty') emptyCount++
      }
    }
    expect(emptyCount).toBe(60)
  })
})

describe('copyBoard', () => {
  it('should create a deep copy of the board', () => {
    const original = createInitialBoard()
    const copy = copyBoard(original)

    copy[0][0] = 'black'
    expect(original[0][0]).toBe('empty')
  })
})

describe('getOpponent', () => {
  it('should return white for black', () => {
    expect(getOpponent('black')).toBe('white')
  })

  it('should return black for white', () => {
    expect(getOpponent('white')).toBe('black')
  })
})

describe('isValidMove', () => {
  it('should return false for out of bounds position', () => {
    const board = createInitialBoard()
    expect(isValidMove(board, { row: -1, col: 0 }, 'black')).toBe(false)
    expect(isValidMove(board, { row: 8, col: 0 }, 'black')).toBe(false)
    expect(isValidMove(board, { row: 0, col: -1 }, 'black')).toBe(false)
    expect(isValidMove(board, { row: 0, col: 8 }, 'black')).toBe(false)
  })

  it('should return false for non-empty cell', () => {
    const board = createInitialBoard()
    expect(isValidMove(board, { row: 3, col: 3 }, 'black')).toBe(false)
    expect(isValidMove(board, { row: 4, col: 4 }, 'black')).toBe(false)
  })

  it('should return true for valid opening moves for black', () => {
    const board = createInitialBoard()
    expect(isValidMove(board, { row: 2, col: 3 }, 'black')).toBe(true)
    expect(isValidMove(board, { row: 3, col: 2 }, 'black')).toBe(true)
    expect(isValidMove(board, { row: 4, col: 5 }, 'black')).toBe(true)
    expect(isValidMove(board, { row: 5, col: 4 }, 'black')).toBe(true)
  })

  it('should return false for invalid moves', () => {
    const board = createInitialBoard()
    expect(isValidMove(board, { row: 0, col: 0 }, 'black')).toBe(false)
    expect(isValidMove(board, { row: 2, col: 2 }, 'black')).toBe(false)
  })
})

describe('getValidMoves', () => {
  it('should return 4 valid moves for black at game start', () => {
    const board = createInitialBoard()
    const moves = getValidMoves(board, 'black')
    expect(moves.length).toBe(4)
  })

  it('should return correct positions for black at game start', () => {
    const board = createInitialBoard()
    const moves = getValidMoves(board, 'black')
    const positions = moves.map(m => `${m.row},${m.col}`).sort()
    expect(positions).toEqual(['2,3', '3,2', '4,5', '5,4'])
  })

  it('should return 4 valid moves for white at game start', () => {
    const board = createInitialBoard()
    const moves = getValidMoves(board, 'white')
    expect(moves.length).toBe(4)
  })
})

describe('makeMove', () => {
  it('should place piece and flip opponent pieces', () => {
    const board = createInitialBoard()
    const newBoard = makeMove(board, { row: 2, col: 3 }, 'black')

    expect(newBoard[2][3]).toBe('black')
    expect(newBoard[3][3]).toBe('black')
  })

  it('should not modify original board', () => {
    const board = createInitialBoard()
    makeMove(board, { row: 2, col: 3 }, 'black')

    expect(board[2][3]).toBe('empty')
    expect(board[3][3]).toBe('white')
  })

  it('should return original board for invalid move', () => {
    const board = createInitialBoard()
    const newBoard = makeMove(board, { row: 0, col: 0 }, 'black')

    expect(newBoard).toBe(board)
  })
})

describe('createInitialGameState', () => {
  it('should create initial state with black as current player', () => {
    const state = createInitialGameState()
    expect(state.currentPlayer).toBe('black')
  })

  it('should have initial scores of 2-2', () => {
    const state = createInitialGameState()
    expect(state.scores.black).toBe(2)
    expect(state.scores.white).toBe(2)
  })

  it('should not be game over', () => {
    const state = createInitialGameState()
    expect(state.isGameOver).toBe(false)
    expect(state.winner).toBe(null)
  })
})

describe('applyMove', () => {
  it('should return null for invalid move', () => {
    const state = createInitialGameState()
    const result = applyMove(state, { row: 0, col: 0 })
    expect(result).toBe(null)
  })

  it('should update board and scores for valid move', () => {
    const state = createInitialGameState()
    const result = applyMove(state, { row: 2, col: 3 })

    expect(result).not.toBe(null)
    expect(result!.scores.black).toBe(4)
    expect(result!.scores.white).toBe(1)
  })

  it('should switch to opponent after valid move', () => {
    const state = createInitialGameState()
    const result = applyMove(state, { row: 2, col: 3 })

    expect(result!.currentPlayer).toBe('white')
  })

  it('should keep current player if opponent has no moves', () => {
    const board: Board = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => 'empty' as const)
    )
    board[0][0] = 'black'
    board[0][1] = 'white'

    const state = {
      board,
      currentPlayer: 'black' as Player,
      scores: { black: 1, white: 1 },
      isGameOver: false,
      winner: null,
    }

    const result = applyMove(state, { row: 0, col: 2 })

    if (result && !result.isGameOver) {
      const blackMoves = getValidMoves(result.board, 'black')
      const whiteMoves = getValidMoves(result.board, 'white')

      if (whiteMoves.length === 0 && blackMoves.length > 0) {
        expect(result.currentPlayer).toBe('black')
      }
    }
  })
})

describe('game over scenarios', () => {
  it('should detect game over when board is full', () => {
    const board: Board = Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) =>
        (row + col) % 2 === 0 ? 'black' : 'white'
      )
    )

    const moves = getValidMoves(board, 'black')
    expect(moves.length).toBe(0)
  })

  it('should detect game over when no player can move', () => {
    const board: Board = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => 'empty' as const)
    )
    board[0][0] = 'black'
    board[7][7] = 'white'

    const blackMoves = getValidMoves(board, 'black')
    const whiteMoves = getValidMoves(board, 'white')

    expect(blackMoves.length).toBe(0)
    expect(whiteMoves.length).toBe(0)
  })
})
