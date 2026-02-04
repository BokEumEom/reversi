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

// Allowed origins for CORS/security
const ALLOWED_ORIGINS = new Set([
  'https://reversi-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  // Allow any *.vercel.app subdomain for Vercel preview deployments
  if (origin.endsWith('.vercel.app')) return true
  return ALLOWED_ORIGINS.has(origin)
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS.values().next().value as string
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// UUID v4 format validation for session tokens
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidSessionToken(token: string): boolean {
  return UUID_REGEX.test(token)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const corsHeaders = getCorsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/api/rating') {
      const rawToken = url.searchParams.get('token')?.slice(0, 64) ?? ''
      // Validate token format
      const token = isValidSessionToken(rawToken) ? rawToken : ''
      const id = env.RATING_TRACKER.idFromName('global')
      const tracker = env.RATING_TRACKER.get(id)
      const res = await tracker.fetch(new Request(`http://internal/rating?token=${encodeURIComponent(token)}`))
      const data = await res.text()
      return new Response(data, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/api/leaderboard') {
      const limit = url.searchParams.get('limit') || '50'
      const id = env.RATING_TRACKER.idFromName('global')
      const tracker = env.RATING_TRACKER.get(id)
      const res = await tracker.fetch(new Request(`http://internal/leaderboard?limit=${encodeURIComponent(limit)}`))
      const data = await res.text()
      return new Response(data, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/api/set-nickname' && request.method === 'POST') {
      // Validate origin for POST requests
      if (!isAllowedOrigin(origin)) {
        return new Response('Forbidden', { status: 403, headers: corsHeaders })
      }
      const id = env.RATING_TRACKER.idFromName('global')
      const tracker = env.RATING_TRACKER.get(id)
      const res = await tracker.fetch(new Request('http://internal/set-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: request.body,
      }))
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
      // Origin validation is handled in Matchmaking DO
      const id = env.MATCHMAKING.idFromName('global')
      const stub = env.MATCHMAKING.get(id)
      return stub.fetch(request)
    }

    // WebSocket connection to game room
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.split('/')[2]

      if (!roomId) {
        return new Response('Room ID required', { status: 400, headers: corsHeaders })
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
