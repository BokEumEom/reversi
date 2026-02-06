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

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidSessionToken(token: string): boolean {
  return UUID_REGEX.test(token)
}

// Allowed origins for CORS/security
const ALLOWED_ORIGINS = new Set([
  'https://reversi-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  // Allow only reversi project Vercel deployments
  if (/^https:\/\/reversi(-[a-z0-9]+)?\.vercel\.app$/.test(origin)) return true
  return ALLOWED_ORIGINS.has(origin)
}

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
      const rawToken = typeof msg.sessionToken === 'string' ? msg.sessionToken.slice(0, 64) : undefined
      // Only accept valid UUID v4 format tokens
      const sessionToken = rawToken && isValidSessionToken(rawToken) ? rawToken : undefined
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
  | { type: 'REMATCH_ACCEPTED'; state: RoomState; yourColor: Player }
  | { type: 'RATING_UPDATE'; rating: number; delta: number; ratingBefore: number; opponentRating: number }
  | { type: 'PENALTY_ACTIVE'; cooldownUntil: number }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' }

// Storage keys for persisting state across hibernation
const STORAGE_KEYS = {
  TURN_TIMER_DEADLINE: 'turnTimerDeadline',
  TURN_STARTED_AT: 'turnStartedAt',
  GAME_STATE: 'gameState',
  ROOM_ID: 'roomId',
  DISCONNECTED_PLAYERS: 'disconnectedPlayers',
} as const

interface DisconnectedPlayerInfo {
  color: Player
  nickname: string
  sessionToken: string
  deadline: number
}

export class GameRoom extends DurableObject<GameRoomEnv> {
  private gameState: GameState | null = null
  private roomId: string = ''
  private turnTimerAlarm: number | null = null
  private turnStartedAtTime: number = 0
  private disconnectedPlayers: Map<string, DisconnectedPlayerInfo> = new Map()
  private rematchVotes: Set<string> = new Set()
  private messageTimestamps: Map<WebSocket, number[]> = new Map()

  // Session management via WebSocket attachments (survives DO hibernation)
  private getSession(ws: WebSocket): Session | null {
    return ws.deserializeAttachment() as Session | null
  }

  private setSession(ws: WebSocket, session: Session) {
    ws.serializeAttachment(session)
  }

  private getAllSessions(): Array<[WebSocket, Session]> {
    const result: Array<[WebSocket, Session]> = []
    for (const ws of this.ctx.getWebSockets()) {
      const session = this.getSession(ws)
      if (session) {
        result.push([ws, session])
      }
    }
    return result
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    this.roomId = url.searchParams.get('roomId') || ''
    await this.ctx.storage.put(STORAGE_KEYS.ROOM_ID, this.roomId)

    // Origin validation for WebSocket upgrade
    const origin = request.headers.get('Origin')
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden origin', { status: 403 })
    }

    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    this.ctx.acceptWebSocket(server)

    const playerId = crypto.randomUUID()
    this.setSession(server, { playerId, sessionToken: '', nickname: 'Player', color: null })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return

    const session = this.getSession(ws)
    if (!session) return

    // Load state from storage in case of hibernation recovery
    await this.loadStateFromStorage()

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
        this.setSession(ws, session)
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
    const session = this.getSession(ws)
    if (!session) return

    // Load state in case of hibernation
    await this.loadStateFromStorage()

    if (session.color && this.gameState && !this.gameState.isGameOver) {
      const deadline = Date.now() + RECONNECT_GRACE_MS
      this.disconnectedPlayers.set(session.playerId, {
        color: session.color,
        nickname: session.nickname,
        sessionToken: session.sessionToken,
        deadline,
      })

      await this.saveDisconnectedPlayers()
      this.broadcast({ type: 'OPPONENT_DISCONNECTED', reconnectDeadline: deadline }, ws)

      await this.scheduleNextAlarm()
    } else if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
    }

    this.messageTimestamps.delete(ws)
  }

  async alarm() {
    const now = Date.now()

    // Load all state from storage (survives hibernation)
    await this.loadStateFromStorage()

    // Handle disconnected players
    let disconnectedPlayersChanged = false
    for (const [playerId, info] of this.disconnectedPlayers) {
      if (now >= info.deadline) {
        this.disconnectedPlayers.delete(playerId)
        disconnectedPlayersChanged = true
        await this.forfeitGame(info.color, info.sessionToken)
      }
    }
    if (disconnectedPlayersChanged) {
      await this.saveDisconnectedPlayers()
    }

    // Handle turn timeout
    if (this.turnTimerAlarm && now >= this.turnTimerAlarm && this.gameState && !this.gameState.isGameOver) {
      this.turnTimerAlarm = null
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_TIMER_DEADLINE)
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_STARTED_AT)
      await this.handleTurnTimeout()
    }

    // Reschedule alarm for next earliest deadline
    await this.scheduleNextAlarm()
  }

  private async scheduleNextAlarm() {
    const deadlines: number[] = []

    // Collect all pending deadlines
    if (this.turnTimerAlarm) {
      deadlines.push(this.turnTimerAlarm)
    }
    for (const [, info] of this.disconnectedPlayers) {
      deadlines.push(info.deadline)
    }

    // Schedule alarm for the earliest deadline
    if (deadlines.length > 0) {
      const nextDeadline = Math.min(...deadlines)
      await this.ctx.storage.setAlarm(nextDeadline)
    }
  }

  // Persist gameState to Durable Storage (survives hibernation)
  private async saveGameState() {
    if (this.gameState) {
      await this.ctx.storage.put(STORAGE_KEYS.GAME_STATE, this.gameState)
    } else {
      await this.ctx.storage.delete(STORAGE_KEYS.GAME_STATE)
    }
  }

  // Load gameState from Durable Storage after hibernation
  private async loadGameState() {
    if (!this.gameState) {
      const stored = await this.ctx.storage.get<GameState>(STORAGE_KEYS.GAME_STATE)
      if (stored) {
        this.gameState = stored
      }
    }
  }

  // Persist disconnectedPlayers to Durable Storage
  private async saveDisconnectedPlayers() {
    if (this.disconnectedPlayers.size > 0) {
      const data: Record<string, DisconnectedPlayerInfo> = Object.fromEntries(this.disconnectedPlayers)
      await this.ctx.storage.put(STORAGE_KEYS.DISCONNECTED_PLAYERS, data)
    } else {
      await this.ctx.storage.delete(STORAGE_KEYS.DISCONNECTED_PLAYERS)
    }
  }

  // Load disconnectedPlayers from Durable Storage after hibernation
  private async loadDisconnectedPlayers() {
    if (this.disconnectedPlayers.size === 0) {
      const data = await this.ctx.storage.get<Record<string, DisconnectedPlayerInfo>>(STORAGE_KEYS.DISCONNECTED_PLAYERS)
      if (data) {
        this.disconnectedPlayers = new Map(Object.entries(data))
      }
    }
  }

  // Load all state from storage after hibernation
  private async loadStateFromStorage() {
    if (!this.roomId) {
      this.roomId = await this.ctx.storage.get<string>(STORAGE_KEYS.ROOM_ID) || ''
    }
    await this.loadGameState()
    await this.loadDisconnectedPlayers()

    // Load timer state
    const storedDeadline = await this.ctx.storage.get<number>(STORAGE_KEYS.TURN_TIMER_DEADLINE)
    if (storedDeadline && !this.turnTimerAlarm) {
      this.turnTimerAlarm = storedDeadline
      this.turnStartedAtTime = await this.ctx.storage.get<number>(STORAGE_KEYS.TURN_STARTED_AT) || (storedDeadline - TURN_TIMEOUT_MS)
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
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== exclude) {
        this.send(ws, message)
      }
    }
  }

  private getPlayerInfo(color: Player): PlayerInfo | null {
    for (const [, session] of this.getAllSessions()) {
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
      turnStartedAt: this.turnStartedAtTime || now,
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
      for (const [ws, session] of this.getAllSessions()) {
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
    this.turnStartedAtTime = Date.now()
    const deadline = this.turnStartedAtTime + TURN_TIMEOUT_MS
    this.turnTimerAlarm = deadline
    // Persist to storage to survive hibernation
    await this.ctx.storage.put(STORAGE_KEYS.TURN_TIMER_DEADLINE, deadline)
    await this.ctx.storage.put(STORAGE_KEYS.TURN_STARTED_AT, this.turnStartedAtTime)
    await this.scheduleNextAlarm()
  }

  private async forfeitGame(loserColor: Player, loserSessionToken?: string) {
    if (!this.gameState || this.gameState.isGameOver) return

    const winner: Player = loserColor === 'black' ? 'white' : 'black'
    this.gameState = {
      ...this.gameState,
      isGameOver: true,
      winner,
    }
    this.turnTimerAlarm = null
    // Clear timer and save game state to storage
    await this.ctx.storage.delete(STORAGE_KEYS.TURN_TIMER_DEADLINE)
    await this.ctx.storage.delete(STORAGE_KEYS.TURN_STARTED_AT)
    await this.saveGameState()

    // Find loser's sessionToken if not provided
    const token = loserSessionToken ?? this.findSessionToken(loserColor)
    if (token) {
      await this.recordForfeit(token)
    }

    const roomState = this.getRoomState()
    this.broadcast({ type: 'OPPONENT_FORFEITED', winner, state: roomState })
    await this.handleGameEndRatings()
  }

  private findSessionToken(color: Player): string | undefined {
    for (const [, session] of this.getAllSessions()) {
      if (session.color === color && session.sessionToken) return session.sessionToken
    }
    for (const [, info] of this.disconnectedPlayers) {
      if (info.color === color && info.sessionToken) return info.sessionToken
    }
    return undefined
  }

  private async handleTurnTimeout() {
    if (!this.gameState || this.gameState.isGameOver) return

    const current = this.gameState.currentPlayer
    const opponent: Player = current === 'black' ? 'white' : 'black'

    const currentMoves = getValidMoves(this.gameState.board, current)
    const opponentMoves = getValidMoves(this.gameState.board, opponent)

    // If neither player has valid moves, end the game
    if (currentMoves.length === 0 && opponentMoves.length === 0) {
      const { scores } = this.gameState
      const winner: Player | 'tie' = scores.black > scores.white ? 'black'
                                   : scores.white > scores.black ? 'white'
                                   : 'tie'
      this.gameState = {
        ...this.gameState,
        isGameOver: true,
        winner,
      }
      this.turnTimerAlarm = null
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_TIMER_DEADLINE)
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_STARTED_AT)
      await this.saveGameState()

      const roomState = this.getRoomState()
      this.broadcast({ type: 'GAME_OVER', state: roomState })
      await this.handleGameEndRatings()
      return
    }

    // Switch to opponent if they have valid moves
    if (opponentMoves.length > 0) {
      this.gameState = {
        ...this.gameState,
        currentPlayer: opponent,
      }
      await this.saveGameState()
    }
    // If opponent has no moves but current player does, keep the turn (will timeout again)

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
        this.setSession(ws, { ...session, color: info.color, playerId })
        this.disconnectedPlayers.delete(playerId)
        await this.saveDisconnectedPlayers()

        this.send(ws, { type: 'ROOM_JOINED', roomId: this.roomId, color: info.color })

        if (this.gameState) {
          const roomState = this.getRoomState()
          this.send(ws, { type: 'GAME_START', state: roomState, yourColor: info.color })
        }

        this.broadcast({ type: 'OPPONENT_RECONNECTED' }, ws)
        return
      }
    }

    const takenColors = this.getAllSessions()
      .map(([, s]) => s.color)
      .filter((c): c is Player => c !== null)

    if (takenColors.length >= 2) {
      this.send(ws, { type: 'ERROR', message: 'Room is full' })
      return
    }

    const color: Player = !takenColors.includes('black') ? 'black' : 'white'
    this.setSession(ws, { ...session, color })

    this.send(ws, { type: 'ROOM_JOINED', roomId: this.roomId, color })

    const playersWithColor = this.getAllSessions().filter(([, s]) => s.color !== null)

    if (playersWithColor.length === 2) {
      this.gameState = createInitialGameState()
      this.rematchVotes.clear()
      await this.saveGameState()
      const roomState = this.getRoomState()

      for (const [clientWs, clientSession] of playersWithColor) {
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
    await this.saveGameState()
    const roomState = this.getRoomState()

    this.broadcast({ type: 'MOVE_MADE', position, state: roomState })

    if (this.gameState.isGameOver) {
      this.broadcast({ type: 'GAME_OVER', state: roomState })
      this.turnTimerAlarm = null
      // Clear timer from storage
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_TIMER_DEADLINE)
      await this.ctx.storage.delete(STORAGE_KEYS.TURN_STARTED_AT)
      await this.handleGameEndRatings()
    } else {
      await this.startTurnTimer()
    }
  }

  private async handleRematch(ws: WebSocket, session: Session) {
    if (!session.playerId) return

    this.rematchVotes.add(session.playerId)

    const activeSessions = this.getAllSessions().filter(([, s]) => s.color !== null)
    const allVoted = activeSessions.every(([, s]) => this.rematchVotes.has(s.playerId))

    if (allVoted && activeSessions.length === 2) {
      // Swap colors and persist to WebSocket attachments
      for (const [clientWs, clientSession] of activeSessions) {
        const newColor: Player = clientSession.color === 'black' ? 'white' : 'black'
        this.setSession(clientWs, { ...clientSession, color: newColor })
      }

      this.gameState = createInitialGameState()
      this.rematchVotes.clear()
      await this.saveGameState()
      const roomState = this.getRoomState()

      // Re-read sessions after color swap to get updated colors
      for (const [clientWs, clientSession] of this.getAllSessions()) {
        if (clientSession.color) {
          this.send(clientWs, {
            type: 'REMATCH_ACCEPTED',
            state: roomState,
            yourColor: clientSession.color,
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
      await this.forfeitGame(session.color, session.sessionToken)
      this.disconnectedPlayers.delete(session.playerId)
      await this.saveDisconnectedPlayers()
    } else if (session.color) {
      this.broadcast({ type: 'OPPONENT_LEFT' }, ws)
    }
    this.setSession(ws, { ...session, color: null })
    ws.close()
  }
}
