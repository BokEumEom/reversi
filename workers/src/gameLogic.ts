// Shared game logic for server-side validation

export type CellState = 'empty' | 'black' | 'white'
export type Player = 'black' | 'white'
export type Board = CellState[][]

export interface Position {
  row: number
  col: number
}

export interface GameState {
  board: Board
  currentPlayer: Player
  scores: { black: number; white: number }
  isGameOver: boolean
  winner: Player | 'tie' | null
}

const BOARD_SIZE = 8

const DIRECTIONS = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 0 },
  { dRow: -1, dCol: 1 },
  { dRow: 0, dCol: -1 },
  { dRow: 0, dCol: 1 },
  { dRow: 1, dCol: -1 },
  { dRow: 1, dCol: 0 },
  { dRow: 1, dCol: 1 },
]

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'empty' as CellState)
  )
  const mid = BOARD_SIZE / 2
  board[mid - 1][mid - 1] = 'white'
  board[mid - 1][mid] = 'black'
  board[mid][mid - 1] = 'black'
  board[mid][mid] = 'white'
  return board
}

export function copyBoard(board: Board): Board {
  return board.map(row => [...row])
}

export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black'
}

function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE
}

function getFlipsInDirection(
  board: Board,
  pos: Position,
  direction: { dRow: number; dCol: number },
  player: Player
): Position[] {
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

function getAllFlips(board: Board, pos: Position, player: Player): Position[] {
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

export function getValidMoves(board: Board, player: Player): Position[] {
  const moves: Position[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, { row, col }, player)) {
        moves.push({ row, col })
      }
    }
  }
  return moves
}

function hasValidMoves(board: Board, player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, { row, col }, player)) {
        return true
      }
    }
  }
  return false
}

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

function countPieces(board: Board): { black: number; white: number } {
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

function isGameOver(board: Board): boolean {
  return !hasValidMoves(board, 'black') && !hasValidMoves(board, 'white')
}

function determineWinner(board: Board): Player | 'tie' {
  const { black, white } = countPieces(board)
  if (black > white) return 'black'
  if (white > black) return 'white'
  return 'tie'
}

export function createInitialGameState(): GameState {
  const board = createInitialBoard()
  return {
    board,
    currentPlayer: 'black',
    scores: countPieces(board),
    isGameOver: false,
    winner: null,
  }
}

export function applyMove(state: GameState, pos: Position): GameState | null {
  if (!isValidMove(state.board, pos, state.currentPlayer)) {
    return null
  }

  const newBoard = makeMove(state.board, pos, state.currentPlayer)
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

  return {
    board: newBoard,
    currentPlayer: nextPlayer,
    scores: countPieces(newBoard),
    isGameOver: gameOver,
    winner: gameOver ? determineWinner(newBoard) : null,
  }
}
