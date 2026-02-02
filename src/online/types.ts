import type { Board, Player, Position, Scores } from '../types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface PlayerInfo {
  readonly id: string
  readonly nickname: string
}

export interface RoomState {
  readonly roomId: string
  readonly status: RoomStatus
  readonly players: {
    readonly black: PlayerInfo | null
    readonly white: PlayerInfo | null
  }
  readonly board: Board
  readonly currentPlayer: Player
  readonly scores: Scores
  readonly isGameOver: boolean
  readonly winner: Player | 'tie' | null
  readonly turnTimer?: number
  readonly turnStartedAt?: number
}

// WebSocket Messages (Client -> Server)
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; nickname: string; sessionToken: string }
  | { type: 'MAKE_MOVE'; position: Position }
  | { type: 'LEAVE_ROOM' }
  | { type: 'REMATCH_REQUEST' }
  | { type: 'QUICK_MATCH'; nickname: string; sessionToken: string }
  | { type: 'PING' }

// WebSocket Messages (Server -> Client)
export type ServerMessage =
  | { type: 'ROOM_JOINED'; roomId: string; color: Player }
  | { type: 'WAITING_FOR_OPPONENT' }
  | { type: 'GAME_START'; state: RoomState; yourColor: Player }
  | { type: 'GAME_STATE'; state: RoomState }
  | { type: 'MOVE_MADE'; position: Position; state: RoomState }
  | { type: 'INVALID_MOVE'; reason: string }
  | { type: 'OPPONENT_DISCONNECTED'; reconnectDeadline: number }
  | { type: 'OPPONENT_RECONNECTED' }
  | { type: 'OPPONENT_LEFT' }
  | { type: 'OPPONENT_FORFEITED'; winner: Player; state: RoomState }
  | { type: 'GAME_OVER'; state: RoomState }
  | { type: 'TURN_TIMEOUT'; state: RoomState }
  | { type: 'REMATCH_REQUESTED' }
  | { type: 'REMATCH_ACCEPTED'; state: RoomState }
  | { type: 'MATCHED'; roomId: string }
  | { type: 'RATING_UPDATE'; rating: number; delta: number }
  | { type: 'PENALTY_ACTIVE'; cooldownUntil: number }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' }
