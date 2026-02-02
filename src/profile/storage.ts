import type { GameRecord } from './types'

const USER_ID_KEY = 'reversi-user-id'
const HISTORY_KEY = 'reversi-game-history'
const MAX_RECORDS = 100

export function getUserId(): string {
  const existing = localStorage.getItem(USER_ID_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(USER_ID_KEY, id)
  return id
}

export function getGameHistory(): readonly GameRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as readonly GameRecord[]
  } catch {
    return []
  }
}

export function saveGameRecord(record: GameRecord): readonly GameRecord[] {
  const existing = getGameHistory()
  const updated = [record, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}

export function clearGameHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}
