import { useReducer, useCallback } from 'react'
import type { GameState, Position, GameMode, Difficulty, Player } from '../types'
import { createInitialBoard, getOpponent } from '../logic/boardUtils'
import { getValidMoves, hasValidMoves } from '../logic/moveValidation'
import { makeMove } from '../logic/moveExecution'
import { isGameOver, determineWinner, calculateScores } from '../logic/gameState'

type GameAction =
  | { type: 'MAKE_MOVE'; payload: Position }
  | { type: 'NEW_GAME' }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_AI_THINKING'; payload: boolean }

function createInitialState(mode: GameMode, difficulty: Difficulty): GameState {
  const board = createInitialBoard()
  const currentPlayer: Player = 'black'
  const validMoves = getValidMoves(board, currentPlayer)
  const scores = calculateScores(board)

  return {
    board,
    currentPlayer,
    validMoves,
    scores,
    isGameOver: false,
    winner: null,
    gameMode: mode,
    difficulty,
    isAIThinking: false,
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_MOVE': {
      const pos = action.payload
      const newBoard = makeMove(state.board, pos, state.currentPlayer)

      if (newBoard === state.board) {
        return state
      }

      const opponent = getOpponent(state.currentPlayer)
      const opponentCanMove = hasValidMoves(newBoard, opponent)
      const currentCanMove = hasValidMoves(newBoard, state.currentPlayer)

      let nextPlayer: Player
      if (opponentCanMove) {
        nextPlayer = opponent
      } else if (currentCanMove) {
        nextPlayer = state.currentPlayer
      } else {
        nextPlayer = opponent
      }

      const gameOver = isGameOver(newBoard)
      const nextValidMoves = gameOver ? [] : getValidMoves(newBoard, nextPlayer)

      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        validMoves: nextValidMoves,
        scores: calculateScores(newBoard),
        isGameOver: gameOver,
        winner: gameOver ? determineWinner(newBoard) : null,
        isAIThinking: false,
      }
    }

    case 'NEW_GAME':
      return createInitialState(state.gameMode, state.difficulty)

    case 'SET_MODE': {
      const newState = createInitialState(action.payload, state.difficulty)
      return {
        ...newState,
        gameMode: action.payload,
      }
    }

    case 'SET_DIFFICULTY':
      return {
        ...createInitialState(state.gameMode, action.payload),
        difficulty: action.payload,
      }

    case 'SET_AI_THINKING':
      return {
        ...state,
        isAIThinking: action.payload,
      }

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(
    gameReducer,
    { mode: 'local' as GameMode, difficulty: 'medium' as Difficulty },
    ({ mode, difficulty }) => createInitialState(mode, difficulty)
  )

  const handleMove = useCallback((pos: Position) => {
    dispatch({ type: 'MAKE_MOVE', payload: pos })
  }, [])

  const startNewGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const setGameMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode })
  }, [])

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty })
  }, [])

  const setAIThinking = useCallback((isThinking: boolean) => {
    dispatch({ type: 'SET_AI_THINKING', payload: isThinking })
  }, [])

  return {
    ...state,
    handleMove,
    startNewGame,
    setGameMode,
    setDifficulty,
    setAIThinking,
  }
}
