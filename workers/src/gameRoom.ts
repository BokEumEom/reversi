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
const MAX_MESSAGE_SIZE = 1024
const RATE_LIMIT_WINDOW_MS = 1_000
const RATE_LIMIT_MAX = 10

function sanitizeNickname(raw: string): string {
  return raw
    .replace(/[<>&"'`]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 20) || 'Player'
}

function isValidPosition(pos: unknown): pos is Position {
  if (typeof pos !== 'object' || pos === null) return false
  const { row, col } = pos as Record<string, unknown>
  return (
    typeof row === 'number' && typeof col === 'number' &&
    Number.isInteger(row) && Number.isInteger(col) &&
    row >= 0 && row <= 7 && col >= 0 && col <= 7
  )
}

function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MAX_MESSAGE_SIZE) return null

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null
  const msg = data as Record<string, unknown>

  switch (msg.type) {
    case 'JOIN_ROOM': {
      const roomId = typeof msg.roomId === 'string' ? msg.roomId.slice(0, 20) : ''
      const nickname = typeof msg.nickname === 'string' ? msg.nickname : undefined
      const sessionToken = typeof msg.sessionToken === 'string' ? msg.sessionToken.slice(0, 64) : undefined
      return { type: 'JOIN_ROOM', roomId, nickname, sessionToken }
    }
    case 'MAKE_MOVE':
      if (!isValidPosition(msg.position)) return null
      return { type: 'MAKE_MOVE', position: { row: msg.position.row, col: msg.position.col } }
    case 'LEAVE_ROOM':
      return { type: 'LEAVE_ROOM' }
    case 'REMATCH_REQUEST':
      return { type: 'REMATCH_REQUEST' }
    case 'PING':
      return { type: 'PING' }
    default:
      return null
  }
}

interface GameRoomEnv {
  PENALTY_TRACKER: DurableObjectNamespace
  RATING_TRACKER: DurableObjectNamespace
}

interface PlayerInfo {
  id: string
  nickname: string
}

interface Session {
  playerId: string
  sessionToken: string
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
  serverTime: number
}

type ClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; nickname?: string; sessionToken?: string }
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
  | { type: 'OPPONENT_FORFEITED'; winner: Player; state: RoomState }
  | { type: 'GAME_OVER'; state: RoomState }
  | { type: 'TURN_TIMEOUT'; state: RoomState }
  | { type: 'REMATCH_REQUESTED' }
  | { type: 'REMATCH_ACCEPTED'; state: RoomState }
  | { type: 'RATING_UPDATE'; rating: number; delta: number; ratingBefore: number; opponentRating: number }
  | { type: 'PENALTY_ACTIVE'; cooldownUntil: number }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' }

export class GameRoom extends DurableObject<GameRoomEnv> {
  private sessions: Map<WebSocket, Session> = new Map()
  private gameState: GameState | null = null
  private roomId: string = ''
  private turnTimerAlarm: number | null = null
  private disconnectedPlayers: Map<string, { color: Player; nickname: string; sessionToken: string; deadline: number }> = new Map()
  private rematchVotes: Set<string> = new Set()
  private messageTimestamps: Map<WebSocket, number[]> = new Map()

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
    this.sessions.set(server, { playerId, sessionToken: '', nickname: 'Player', color: null })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return

    const session = this.sessions.get(ws)
    if (!session) return

    // Rate limiting
    const now = Date.now()
    const timestamps = this.messageTimestamps.get(ws) ?? []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
    if (recent.length >= RATE_LIMIT_MAX) {
      this.send(ws, { type: 'ERROR', message: 'Too many messages' })
      return
    }
    this.messageTimestamps.set(ws, [...recent, now])

    // Validate & parse
    const data = parseClientMessage(message)
    if (!data) {
      this.send(ws, { type: 'ERROR', message: 'Invalid message format' })
      return
    }

    switch (data.type) {
      case 'JOIN_ROOM':
        if (data.nickname) {
          session.nickname = sanitizeNickname(data.nickname)
        }
        if (data.sessionToken) {
          session.sessionToken = data.sessionToken
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
  }

  async webSocketClose(ws: WebSocket) {
    const session = this.sessions.get(ws)
    if (!session) return

    if (session.color && this.gameState && !this.gameState.isGameOver) {
      const deadline = Date.now() + RECONNECT_GRACE_MS
      this.disconnectedPlayers.set(session.playerId, {
        color: session.color,
        nickname: session.nickname,
        sessionToken: session.sessionToken,
        deadline,
      })

      this.broadcast({ type: 'OPPONENT_DISCONNECTED', reconnectDeadline: deadline }, ws)

      await this.ctx.storage.setAlarm(deadline)
    } else if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
    }

    this.sessions.delete(ws)
    this.messageTimestamps.delete(ws)
  }

  async alarm() {
    const now = Date.now()

    for (const [playerId, info] of this.disconnectedPlayers) {
      if (now >= info.deadline) {
        this.disconnectedPlayers.delete(playerId)
        this.forfeitGame(info.color, info.sessionToken)
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
    const now = Date.now()

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
      turnStartedAt: now,
      serverTime: now,
    }
  }

  private getPenaltyTracker() {
    const id = this.env.PENALTY_TRACKER.idFromName('global')
    return this.env.PENALTY_TRACKER.get(id)
  }

  private async checkPenalty(sessionToken: string): Promise<{ allowed: boolean; cooldownUntil: number }> {
    try {
      const tracker = this.getPenaltyTracker()
      const res = await tracker.fetch(new Request(`http://internal/check?token=${encodeURIComponent(sessionToken)}`))
      return (await res.json()) as { allowed: boolean; cooldownUntil: number }
    } catch {
      return { allowed: true, cooldownUntil: 0 }
    }
  }

  private getRatingTracker() {
    const id = this.env.RATING_TRACKER.idFromName('global')
    return this.env.RATING_TRACKER.get(id)
  }

  private async updateRatings(winnerToken: string, loserToken: string, isDraw: boolean): Promise<void> {
    try {
      const tracker = this.getRatingTracker()

      // Get old ratings first
      const [winnerRes, loserRes] = await Promise.all([
        tracker.fetch(new Request(`http://internal/rating?token=${encodeURIComponent(winnerToken)}`)),
        tracker.fetch(new Request(`http://internal/rating?token=${encodeURIComponent(loserToken)}`)),
      ])
      const oldWinner = (await winnerRes.json()) as { rating: number }
      const oldLoser = (await loserRes.json()) as { rating: number }

      // Update ratings
      const res = await tracker.fetch(new Request('http://internal/update', {
        method: 'POST',
        body: JSON.stringify({ winnerToken, loserToken, isDraw }),
        headers: { 'Content-Type': 'application/json' },
      }))
      const data = (await res.json()) as {
        winner: { rating: number }
        loser: { rating: number }
      }

      // Send rating updates to each player
      for (const [ws, session] of this.sessions) {
        if (session.sessionToken === winnerToken) {
          this.send(ws, {
            type: 'RATING_UPDATE',
            rating: data.winner.rating,
            delta: data.winner.rating - oldWinner.rating,
            ratingBefore: oldWinner.rating,
            opponentRating: oldLoser.rating,
          })
        }
        if (session.sessionToken === loserToken) {
          this.send(ws, {
            type: 'RATING_UPDATE',
            rating: data.loser.rating,
            delta: data.loser.rating - oldLoser.rating,
            ratingBefore: oldLoser.rating,
            opponentRating: oldWinner.rating,
          })
        }
      }
    } catch {
      // Best-effort
    }
  }

  private async handleGameEndRatings(): Promise<void> {
    if (!this.gameState?.isGameOver) return

    const blackToken = this.findSessionToken('black')
    const whiteToken = this.findSessionToken('white')
    if (!blackToken || !whiteToken) return

    const { winner } = this.gameState
    const isDraw = winner === 'tie'
    const winnerToken = isDraw ? blackToken : (winner === 'black' ? blackToken : whiteToken)
    const loserToken = isDraw ? whiteToken : (winner === 'black' ? whiteToken : blackToken)

    await this.updateRatings(winnerToken, loserToken, isDraw)
  }

  private async recordForfeit(sessionToken: string): Promise<void> {
    try {
      const tracker = this.getPenaltyTracker()
      await tracker.fetch(new Request('http://internal/record', {
        method: 'POST',
        body: JSON.stringify({ sessionToken }),
        headers: { 'Content-Type': 'application/json' },
      }))
    } catch {
      // Best-effort
    }
  }

  private async startTurnTimer() {
    const deadline = Date.now() + TURN_TIMEOUT_MS
    this.turnTimerAlarm = deadline
    await this.ctx.storage.setAlarm(deadline)
  }

  private forfeitGame(loserColor: Player, loserSessionToken?: string) {
    if (!this.gameState || this.gameState.isGameOver) return

    const winner: Player = loserColor === 'black' ? 'white' : 'black'
    this.gameState = {
      ...this.gameState,
      isGameOver: true,
      winner,
    }
    this.turnTimerAlarm = null

    // Find loser's sessionToken if not provided
    const token = loserSessionToken ?? this.findSessionToken(loserColor)
    if (token) {
      void this.recordForfeit(token)
    }

    const roomState = this.getRoomState()
    this.broadcast({ type: 'OPPONENT_FORFEITED', winner, state: roomState })
    void this.handleGameEndRatings()
  }

  private findSessionToken(color: Player): string | undefined {
    for (const [, session] of this.sessions) {
      if (session.color === color && session.sessionToken) return session.sessionToken
    }
    for (const [, info] of this.disconnectedPlayers) {
      if (info.color === color && info.sessionToken) return info.sessionToken
    }
    return undefined
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
    // Check penalty before allowing join
    if (session.sessionToken) {
      const penalty = await this.checkPenalty(session.sessionToken)
      if (!penalty.allowed) {
        this.send(ws, { type: 'PENALTY_ACTIVE', cooldownUntil: penalty.cooldownUntil })
        return
      }
    }

    // Check reconnection — only allow if sessionToken matches
    for (const [playerId, info] of this.disconnectedPlayers) {
      if (Date.now() < info.deadline && session.sessionToken && session.sessionToken === info.sessionToken) {
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
      void this.handleGameEndRatings()
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
    if (session.color && this.gameState && !this.gameState.isGameOver) {
      this.forfeitGame(session.color, session.sessionToken)
      this.disconnectedPlayers.delete(session.playerId)
    } else if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
    }
    session.color = null
    ws.close()
  }
}
