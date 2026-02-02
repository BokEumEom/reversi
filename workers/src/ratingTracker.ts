import { DurableObject } from 'cloudflare:workers'

const DEFAULT_RATING = 1200
const K_FACTOR = 32

interface PlayerRating {
  readonly rating: number
  readonly gamesPlayed: number
}

function calculateElo(
  winnerRating: number,
  loserRating: number,
  isDraw: boolean,
): { winner: number; loser: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
  const expectedLoser = 1 - expectedWinner

  if (isDraw) {
    return {
      winner: Math.round(winnerRating + K_FACTOR * (0.5 - expectedWinner)),
      loser: Math.round(loserRating + K_FACTOR * (0.5 - expectedLoser)),
    }
  }

  return {
    winner: Math.round(winnerRating + K_FACTOR * (1 - expectedWinner)),
    loser: Math.round(loserRating + K_FACTOR * (0 - expectedLoser)),
  }
}

export class RatingTracker extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/rating') {
      const token = url.searchParams.get('token')?.slice(0, 64) ?? ''
      if (!token) {
        return this.json({ rating: DEFAULT_RATING, gamesPlayed: 0 })
      }
      const data = await this.getRating(token)
      return this.json(data)
    }

    if (url.pathname === '/update' && request.method === 'POST') {
      const body = (await request.json()) as {
        winnerToken?: string
        loserToken?: string
        isDraw?: boolean
      }
      const winnerToken = typeof body.winnerToken === 'string' ? body.winnerToken.slice(0, 64) : ''
      const loserToken = typeof body.loserToken === 'string' ? body.loserToken.slice(0, 64) : ''
      const isDraw = body.isDraw === true

      if (!winnerToken || !loserToken) {
        return new Response('Missing tokens', { status: 400 })
      }

      const result = await this.updateRatings(winnerToken, loserToken, isDraw)
      return this.json(result)
    }

    return new Response('Not found', { status: 404 })
  }

  private async getRating(token: string): Promise<PlayerRating> {
    const raw = await this.ctx.storage.get<string>(`rating:${token}`)
    if (!raw) return { rating: DEFAULT_RATING, gamesPlayed: 0 }

    try {
      const parsed = JSON.parse(raw) as PlayerRating
      return {
        rating: typeof parsed.rating === 'number' ? parsed.rating : DEFAULT_RATING,
        gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
      }
    } catch {
      return { rating: DEFAULT_RATING, gamesPlayed: 0 }
    }
  }

  private async saveRating(token: string, data: PlayerRating): Promise<void> {
    await this.ctx.storage.put(`rating:${token}`, JSON.stringify(data))
  }

  private async updateRatings(
    winnerToken: string,
    loserToken: string,
    isDraw: boolean,
  ): Promise<{ winner: PlayerRating; loser: PlayerRating }> {
    const winnerData = await this.getRating(winnerToken)
    const loserData = await this.getRating(loserToken)

    const newElo = calculateElo(winnerData.rating, loserData.rating, isDraw)

    const updatedWinner: PlayerRating = {
      rating: Math.max(100, newElo.winner),
      gamesPlayed: winnerData.gamesPlayed + 1,
    }
    const updatedLoser: PlayerRating = {
      rating: Math.max(100, newElo.loser),
      gamesPlayed: loserData.gamesPlayed + 1,
    }

    await this.saveRating(winnerToken, updatedWinner)
    await this.saveRating(loserToken, updatedLoser)

    return { winner: updatedWinner, loser: updatedLoser }
  }

  private json(data: unknown): Response {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
