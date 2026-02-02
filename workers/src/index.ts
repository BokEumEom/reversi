import { GameRoom } from './gameRoom'
import { Matchmaking } from './matchmaking'
import { PenaltyTracker } from './penaltyTracker'
import { RatingTracker } from './ratingTracker'

export { GameRoom, Matchmaking, PenaltyTracker, RatingTracker }

interface Env {
  GAME_ROOM: DurableObjectNamespace
  MATCHMAKING: DurableObjectNamespace
  PENALTY_TRACKER: DurableObjectNamespace
  RATING_TRACKER: DurableObjectNamespace
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/api/rating') {
      const token = url.searchParams.get('token')?.slice(0, 64) ?? ''
      const id = env.RATING_TRACKER.idFromName('global')
      const tracker = env.RATING_TRACKER.get(id)
      const res = await tracker.fetch(new Request(`http://internal/rating?token=${encodeURIComponent(token)}`))
      const data = await res.text()
      return new Response(data, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/api/create-room') {
      const roomId = generateRoomId()
      return new Response(JSON.stringify({ roomId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Quick match WebSocket
    if (url.pathname === '/matchmaking') {
      const id = env.MATCHMAKING.idFromName('global')
      const stub = env.MATCHMAKING.get(id)
      return stub.fetch(request)
    }

    // WebSocket connection to game room
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.split('/')[2]

      if (!roomId) {
        return new Response('Room ID required', { status: 400 })
      }

      const id = env.GAME_ROOM.idFromName(roomId)
      const stub = env.GAME_ROOM.get(id)

      const newUrl = new URL(request.url)
      newUrl.searchParams.set('roomId', roomId)

      return stub.fetch(new Request(newUrl.toString(), request))
    }

    return new Response('Not found', { status: 404, headers: corsHeaders })
  },
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
