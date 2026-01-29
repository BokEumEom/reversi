export type CellState = 'empty' | 'black' | 'white'

export type Player = 'black' | 'white'

export type Board = ReadonlyArray<ReadonlyArray<CellState>>

export type GameMode = 'local' | 'ai' | 'online'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Position {
  readonly row: number
  readonly col: number
}

export interface Direction {
  readonly dRow: number
  readonly dCol: number
}

export interface Scores {
  readonly black: number
  readonly white: number
}

export interface GameState {
  readonly board: Board
  readonly currentPlayer: Player
  readonly validMoves: ReadonlyArray<Position>
  readonly scores: Scores
  readonly isGameOver: boolean
  readonly winner: Player | 'tie' | null
  readonly gameMode: GameMode
  readonly difficulty: Difficulty
  readonly isAIThinking: boolean
  readonly lastMove: Position | null
  readonly flippedPositions: ReadonlyArray<Position>
}
