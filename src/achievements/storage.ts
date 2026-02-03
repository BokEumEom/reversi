import type { Achievement, AchievementId } from './types'
import { ACHIEVEMENT_DEFINITIONS } from './definitions'

const STORAGE_KEY = 'reversi-achievements'

function getDefaultAchievements(): readonly Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    unlockedAt: null,
  }))
}

export function getAchievements(): readonly Achievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultAchievements()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getDefaultAchievements()

    const merged = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const stored = parsed.find((a: Achievement) => a.id === def.id)
      return stored ?? { id: def.id, unlockedAt: null }
    })

    return merged
  } catch {
    return getDefaultAchievements()
  }
}

export function saveAchievements(achievements: readonly Achievement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements))
}

export function unlockAchievement(
  achievements: readonly Achievement[],
  id: AchievementId
): readonly Achievement[] {
  const existing = achievements.find((a) => a.id === id)
  if (existing?.unlockedAt) return achievements

  const updated = achievements.map((a) =>
    a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a
  )
  saveAchievements(updated)
  return updated
}

export function isUnlocked(achievements: readonly Achievement[], id: AchievementId): boolean {
  return achievements.find((a) => a.id === id)?.unlockedAt !== null
}
