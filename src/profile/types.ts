import type { Difficulty } from '../types'

export type GameMode = 'local' | 'ai' | 'online'
export type GameResult = 'win' | 'loss' | 'tie'

export interface GameRecord {
  readonly id: string
  readonly timestamp: string
  readonly mode: GameMode
  readonly difficulty?: Difficulty
  readonly result: GameResult
  readonly playerColor: 'black' | 'white'
  readonly scores: {
    readonly black: number
    readonly white: number
  }
  readonly opponentName: string
  // Online-specific fields
  readonly ratingBefore?: number
  readonly ratingAfter?: number
  readonly opponentRating?: number
  readonly forfeit?: boolean
}

export interface ModeStats {
  readonly totalGames: number
  readonly wins: number
  readonly losses: number
  readonly ties: number
}

export interface GameStats {
  readonly totalGames: number
  readonly wins: number
  readonly losses: number
  readonly ties: number
  readonly winRate: number
  readonly byMode: {
    readonly local: ModeStats
    readonly ai: ModeStats
    readonly online: ModeStats
  }
}

export interface RecordGameParams {
  readonly mode: GameMode
  readonly difficulty?: Difficulty
  readonly result: GameResult
  readonly playerColor: 'black' | 'white'
  readonly scores: {
    readonly black: number
    readonly white: number
  }
  readonly opponentName: string
  // Online-specific fields
  readonly ratingBefore?: number
  readonly ratingAfter?: number
  readonly opponentRating?: number
  readonly forfeit?: boolean
}
