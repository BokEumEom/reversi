import { DurableObject } from 'cloudflare:workers'

interface Env {
  GAME_ROOM: DurableObjectNamespace
}

interface WaitingPlayer {
  ws: WebSocket
  nickname: string
  joinedAt: number
}

export class Matchmaking extends DurableObject {
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

    try {
      const data = JSON.parse(message)

      if (data.type === 'QUICK_MATCH') {
        const nickname = (data.nickname as string) || 'Player'
        this.addToQueue(ws, nickname)
      }
    } catch {
      // Invalid message
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.queue = this.queue.filter(p => p.ws !== ws)
  }

  private addToQueue(ws: WebSocket, nickname: string) {
    // Clean stale entries (older than 60s)
    const now = Date.now()
    this.queue = this.queue.filter(p => now - p.joinedAt < 60000)

    if (this.queue.length > 0) {
      const opponent = this.queue.shift()!
      const roomId = this.generateRoomId()

      // Notify both players
      this.sendTo(opponent.ws, { type: 'MATCHED', roomId })
      this.sendTo(ws, { type: 'MATCHED', roomId })
    } else {
      this.queue.push({ ws, nickname, joinedAt: now })
      this.sendTo(ws, { type: 'WAITING_FOR_OPPONENT' })
    }
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
