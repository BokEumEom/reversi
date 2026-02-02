import { DurableObject } from 'cloudflare:workers'

const PENALTY_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const COOLDOWNS_MS = [30_000, 120_000, 300_000, 900_000] // 30s, 2m, 5m, 15m

interface ForfeitRecord {
  readonly sessionToken: string
  readonly timestamp: number
}

export class PenaltyTracker extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/record' && request.method === 'POST') {
      const body = (await request.json()) as { sessionToken?: string }
      const token = typeof body.sessionToken === 'string' ? body.sessionToken.slice(0, 64) : ''
      if (!token) return new Response('Missing token', { status: 400 })

      await this.recordForfeit(token)
      return new Response('OK')
    }

    if (url.pathname === '/check') {
      const token = url.searchParams.get('token')?.slice(0, 64) ?? ''
      if (!token) return new Response(JSON.stringify({ allowed: true, cooldownUntil: 0 }))

      const result = await this.checkPenalty(token)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  }

  private async recordForfeit(sessionToken: string): Promise<void> {
    const now = Date.now()
    const records = await this.getRecentForfeits(sessionToken)
    const updated: readonly ForfeitRecord[] = [...records, { sessionToken, timestamp: now }]
    await this.ctx.storage.put(`forfeits:${sessionToken}`, JSON.stringify(updated))
  }

  private async checkPenalty(sessionToken: string): Promise<{ allowed: boolean; cooldownUntil: number }> {
    const now = Date.now()
    const records = await this.getRecentForfeits(sessionToken)

    if (records.length === 0) {
      return { allowed: true, cooldownUntil: 0 }
    }

    const lastForfeit = records[records.length - 1]
    const cooldownIndex = Math.min(records.length - 1, COOLDOWNS_MS.length - 1)
    const cooldownMs = COOLDOWNS_MS[cooldownIndex]
    const cooldownUntil = lastForfeit.timestamp + cooldownMs

    if (now < cooldownUntil) {
      return { allowed: false, cooldownUntil }
    }

    return { allowed: true, cooldownUntil: 0 }
  }

  private async getRecentForfeits(sessionToken: string): Promise<readonly ForfeitRecord[]> {
    const now = Date.now()
    const raw = await this.ctx.storage.get<string>(`forfeits:${sessionToken}`)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as readonly ForfeitRecord[]
      if (!Array.isArray(parsed)) return []
      // Only keep forfeits within the penalty window
      const recent = parsed.filter(r => now - r.timestamp < PENALTY_WINDOW_MS)
      // Clean up stale data
      if (recent.length !== parsed.length) {
        if (recent.length === 0) {
          await this.ctx.storage.delete(`forfeits:${sessionToken}`)
        } else {
          await this.ctx.storage.put(`forfeits:${sessionToken}`, JSON.stringify(recent))
        }
      }
      return recent
    } catch {
      return []
    }
  }
}
