import { DurableObject } from 'cloudflare:workers'

interface MatchmakingEnv {
  RATING_TRACKER: DurableObjectNamespace
}

interface WaitingPlayer {
  ws: WebSocket
  nickname: string
  sessionToken: string
  rating: number
  joinedAt: number
}

const MAX_MESSAGE_SIZE = 512
const RATING_RANGE_INITIAL = 100
const RATING_RANGE_EXPAND_PER_SEC = 10
const RATING_RANGE_MAX = 500

function sanitizeNickname(raw: string): string {
  return raw
    .replace(/[<>&"'`]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 20) || 'Player'
}

export class Matchmaking extends DurableObject<MatchmakingEnv> {
  private queue: WaitingPlayer[] = []

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return
    if (message.length > MAX_MESSAGE_SIZE) return

    let data: Record<string, unknown>
    try {
      const parsed = JSON.parse(message)
      if (typeof parsed !== 'object' || parsed === null) return
      data = parsed as Record<string, unknown>
    } catch {
      return
    }

    if (data.type === 'QUICK_MATCH') {
      const nickname = typeof data.nickname === 'string' ? sanitizeNickname(data.nickname) : 'Player'
      const sessionToken = typeof data.sessionToken === 'string' ? data.sessionToken.slice(0, 64) : ''
      const rating = await this.fetchRating(sessionToken)
      this.addToQueue(ws, nickname, sessionToken, rating)
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.queue = this.queue.filter(p => p.ws !== ws)
  }

  private async fetchRating(sessionToken: string): Promise<number> {
    if (!sessionToken) return 1200
    try {
      const id = this.env.RATING_TRACKER.idFromName('global')
      const tracker = this.env.RATING_TRACKER.get(id)
      const res = await tracker.fetch(new Request(`http://internal/rating?token=${encodeURIComponent(sessionToken)}`))
      const data = (await res.json()) as { rating: number }
      return data.rating
    } catch {
      return 1200
    }
  }

  private addToQueue(ws: WebSocket, nickname: string, sessionToken: string, rating: number) {
    const now = Date.now()
    // Clean stale entries (older than 60s)
    this.queue = this.queue.filter(p => now - p.joinedAt < 60000)

    // Find best match within acceptable rating range
    const bestMatch = this.findBestMatch(rating, now, sessionToken)

    if (bestMatch) {
      this.queue = this.queue.filter(p => p.ws !== bestMatch.ws)
      const roomId = this.generateRoomId()

      this.sendTo(bestMatch.ws, { type: 'MATCHED', roomId })
      this.sendTo(ws, { type: 'MATCHED', roomId })
    } else {
      this.queue.push({ ws, nickname, sessionToken, rating, joinedAt: now })
      this.sendTo(ws, { type: 'WAITING_FOR_OPPONENT' })
    }
  }

  private findBestMatch(rating: number, now: number, sessionToken: string): WaitingPlayer | null {
    let bestPlayer: WaitingPlayer | null = null
    let bestDiff = Infinity

    for (const player of this.queue) {
      if (sessionToken && player.sessionToken === sessionToken) continue

      const waitSeconds = (now - player.joinedAt) / 1000
      const allowedRange = Math.min(
        RATING_RANGE_INITIAL + waitSeconds * RATING_RANGE_EXPAND_PER_SEC,
        RATING_RANGE_MAX,
      )
      const diff = Math.abs(player.rating - rating)

      if (diff <= allowedRange && diff < bestDiff) {
        bestDiff = diff
        bestPlayer = player
      }
    }

    return bestPlayer
  }

  private sendTo(ws: WebSocket, message: Record<string, unknown>) {
    try {
      ws.send(JSON.stringify(message))
    } catch {
      // Connection closed
    }
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}
