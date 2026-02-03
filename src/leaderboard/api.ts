import type { LeaderboardEntry } from './types'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function fetchLeaderboard(limit = 50): Promise<readonly LeaderboardEntry[]> {
  const response = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard')
  }
  return response.json()
}

export async function setNickname(token: string, nickname: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/set-nickname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nickname }),
  })
  if (!response.ok) {
    throw new Error('Failed to set nickname')
  }
}
