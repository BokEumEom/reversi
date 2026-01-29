import { DurableObject } from 'cloudflare:workers'
import {
  createInitialGameState,
  applyMove,
  getValidMoves,
  type GameState,
  type Player,
  type Position,
  type Board,
} from './gameLogic'

const TURN_TIMEOUT_MS = 30_000
const RECONNECT_GRACE_MS = 30_000

interface PlayerInfo {
  id: string
  nickname: string
}

interface Session {
  playerId: string
  nickname: string
  color: Player | null
}

interface RoomState {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  players: {
    black: PlayerInfo | null
    white: PlayerInfo | null
  }
  board: Board
  currentPlayer: Player
  scores: { black: number; white: number }
  isGameOver: boolean
  winner: Player | 'tie' | null
  turnTimer: number
  turnStartedAt: number
}

type ClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; nickname?: string }
  | { type: 'MAKE_MOVE'; position: Position }
  | { type: 'LEAVE_ROOM' }
  | { type: 'REMATCH_REQUEST' }
  | { type: 'PING' }

type ServerMessage =
  | { type: 'ROOM_JOINED'; roomId: string; color: Player }
  | { type: 'WAITING_FOR_OPPONENT' }
  | { type: 'GAME_START'; state: RoomState; yourColor: Player }
  | { type: 'MOVE_MADE'; position: Position; state: RoomState }
  | { type: 'INVALID_MOVE'; reason: string }
  | { type: 'OPPONENT_DISCONNECTED'; reconnectDeadline: number }
  | { type: 'OPPONENT_RECONNECTED' }
  | { type: 'OPPONENT_LEFT' }
  | { type: 'GAME_OVER'; state: RoomState }
  | { type: 'TURN_TIMEOUT'; state: RoomState }
  | { type: 'REMATCH_REQUESTED' }
  | { type: 'REMATCH_ACCEPTED'; state: RoomState }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' }

export class GameRoom extends DurableObject {
  private sessions: Map<WebSocket, Session> = new Map()
  private gameState: GameState | null = null
  private roomId: string = ''
  private turnTimerAlarm: number | null = null
  private disconnectedPlayers: Map<string, { color: Player; nickname: string; deadline: number }> = new Map()
  private rematchVotes: Set<string> = new Set()

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    this.roomId = url.searchParams.get('roomId') || ''

    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    this.ctx.acceptWebSocket(server)

    const playerId = crypto.randomUUID()
    this.sessions.set(server, { playerId, nickname: 'Player', color: null })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return

    const session = this.sessions.get(ws)
    if (!session) return

    try {
      const data = JSON.parse(message) as ClientMessage

      switch (data.type) {
        case 'JOIN_ROOM':
          if (data.nickname) {
            session.nickname = data.nickname.slice(0, 20)
          }
          await this.handleJoin(ws, session)
          break
        case 'MAKE_MOVE':
          await this.handleMove(ws, session, data.position)
          break
        case 'LEAVE_ROOM':
          await this.handleLeave(ws, session)
          break
        case 'REMATCH_REQUEST':
          await this.handleRematch(ws, session)
          break
        case 'PING':
          this.send(ws, { type: 'PONG' })
          break
      }
    } catch {
      this.send(ws, { type: 'ERROR', message: 'Invalid message format' })
    }
  }

  async webSocketClose(ws: WebSocket) {
    const session = this.sessions.get(ws)
    if (!session) return

    if (session.color && this.gameState && !this.gameState.isGameOver) {
      const deadline = Date.now() + RECONNECT_GRACE_MS
      this.disconnectedPlayers.set(session.playerId, {
        color: session.color,
        nickname: session.nickname,
        deadline,
      })

      this.broadcast({ type: 'OPPONENT_DISCONNECTED', reconnectDeadline: deadline }, ws)

      await this.ctx.storage.setAlarm(deadline)
    } else if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
    }

    this.sessions.delete(ws)
  }

  async alarm() {
    const now = Date.now()

    for (const [playerId, info] of this.disconnectedPlayers) {
      if (now >= info.deadline) {
        this.disconnectedPlayers.delete(playerId)
        this.broadcast({ type: 'OPPONENT_LEFT' })
      }
    }

    if (this.turnTimerAlarm && now >= this.turnTimerAlarm && this.gameState && !this.gameState.isGameOver) {
      this.turnTimerAlarm = null
      await this.handleTurnTimeout()
    }
  }

  private send(ws: WebSocket, message: ServerMessage) {
    try {
      ws.send(JSON.stringify(message))
    } catch {
      // Connection might be closed
    }
  }

  private broadcast(message: ServerMessage, exclude?: WebSocket) {
    for (const [ws] of this.sessions) {
      if (ws !== exclude) {
        this.send(ws, message)
      }
    }
  }

  private getPlayerInfo(color: Player): PlayerInfo | null {
    for (const [, session] of this.sessions) {
      if (session.color === color) {
        return { id: session.playerId, nickname: session.nickname }
      }
    }
    for (const [id, info] of this.disconnectedPlayers) {
      if (info.color === color) {
        return { id, nickname: info.nickname }
      }
    }
    return null
  }

  private getRoomState(): RoomState {
    const state = this.gameState || createInitialGameState()

    return {
      roomId: this.roomId,
      status: this.gameState ? (this.gameState.isGameOver ? 'finished' : 'playing') : 'waiting',
      players: {
        black: this.getPlayerInfo('black'),
        white: this.getPlayerInfo('white'),
      },
      board: state.board,
      currentPlayer: state.currentPlayer,
      scores: state.scores,
      isGameOver: state.isGameOver,
      winner: state.winner,
      turnTimer: TURN_TIMEOUT_MS,
      turnStartedAt: Date.now(),
    }
  }

  private async startTurnTimer() {
    const deadline = Date.now() + TURN_TIMEOUT_MS
    this.turnTimerAlarm = deadline
    await this.ctx.storage.setAlarm(deadline)
  }

  private async handleTurnTimeout() {
    if (!this.gameState || this.gameState.isGameOver) return

    const opponent: Player = this.gameState.currentPlayer === 'black' ? 'white' : 'black'
    const opponentMoves = getValidMoves(this.gameState.board, opponent)

    if (opponentMoves.length > 0) {
      this.gameState = {
        ...this.gameState,
        currentPlayer: opponent,
      }
    }

    const roomState = this.getRoomState()
    this.broadcast({ type: 'TURN_TIMEOUT', state: roomState })
    await this.startTurnTimer()
  }

  private async handleJoin(ws: WebSocket, session: Session) {
    // Check reconnection
    for (const [playerId, info] of this.disconnectedPlayers) {
      // Allow reconnection if nickname matches or within deadline
      if (Date.now() < info.deadline) {
        session.color = info.color
        session.playerId = playerId
        this.disconnectedPlayers.delete(playerId)

        this.send(ws, { type: 'ROOM_JOINED', roomId: this.roomId, color: session.color })

        if (this.gameState) {
          const roomState = this.getRoomState()
          this.send(ws, { type: 'GAME_START', state: roomState, yourColor: session.color })
        }

        this.broadcast({ type: 'OPPONENT_RECONNECTED' }, ws)
        return
      }
    }

    const takenColors = [...this.sessions.values()]
      .filter(s => s.color !== null)
      .map(s => s.color)

    if (takenColors.length >= 2) {
      this.send(ws, { type: 'ERROR', message: 'Room is full' })
      return
    }

    if (!takenColors.includes('black')) {
      session.color = 'black'
    } else {
      session.color = 'white'
    }

    this.send(ws, { type: 'ROOM_JOINED', roomId: this.roomId, color: session.color })

    const playersWithColor = [...this.sessions.values()].filter(s => s.color !== null)

    if (playersWithColor.length === 2) {
      this.gameState = createInitialGameState()
      this.rematchVotes.clear()
      const roomState = this.getRoomState()

      for (const [clientWs, clientSession] of this.sessions) {
        if (clientSession.color) {
          this.send(clientWs, {
            type: 'GAME_START',
            state: roomState,
            yourColor: clientSession.color,
          })
        }
      }

      await this.startTurnTimer()
    } else {
      this.send(ws, { type: 'WAITING_FOR_OPPONENT' })
    }
  }

  private async handleMove(ws: WebSocket, session: Session, position: Position) {
    if (!this.gameState) {
      this.send(ws, { type: 'ERROR', message: 'Game not started' })
      return
    }

    if (session.color !== this.gameState.currentPlayer) {
      this.send(ws, { type: 'INVALID_MOVE', reason: 'Not your turn' })
      return
    }

    const newState = applyMove(this.gameState, position)

    if (!newState) {
      this.send(ws, { type: 'INVALID_MOVE', reason: 'Invalid position' })
      return
    }

    this.gameState = newState
    const roomState = this.getRoomState()

    this.broadcast({ type: 'MOVE_MADE', position, state: roomState })

    if (this.gameState.isGameOver) {
      this.broadcast({ type: 'GAME_OVER', state: roomState })
      this.turnTimerAlarm = null
    } else {
      await this.startTurnTimer()
    }
  }

  private async handleRematch(ws: WebSocket, session: Session) {
    if (!session.playerId) return

    this.rematchVotes.add(session.playerId)

    const activePlayers = [...this.sessions.values()].filter(s => s.color !== null)
    const allVoted = activePlayers.every(s => this.rematchVotes.has(s.playerId))

    if (allVoted && activePlayers.length === 2) {
      for (const [, s] of this.sessions) {
        if (s.color === 'black') s.color = 'white'
        else if (s.color === 'white') s.color = 'black'
      }

      this.gameState = createInitialGameState()
      this.rematchVotes.clear()
      const roomState = this.getRoomState()

      for (const [clientWs, clientSession] of this.sessions) {
        if (clientSession.color) {
          this.send(clientWs, {
            type: 'REMATCH_ACCEPTED',
            state: roomState,
          })
        }
      }

      await this.startTurnTimer()
    } else {
      this.broadcast({ type: 'REMATCH_REQUESTED' }, ws)
    }
  }

  private async handleLeave(ws: WebSocket, session: Session) {
    if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
      this.disconnectedPlayers.delete(session.playerId)
    }
    session.color = null
    ws.close()
  }
}
