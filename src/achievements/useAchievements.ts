import { useState, useCallback } from 'react'
import type { GameRecord } from '../profile/types'
import type { Achievement, AchievementId } from './types'
import { getAchievements, unlockAchievement } from './storage'
import { checkNewAchievements } from './checker'

interface UseAchievementsReturn {
  readonly achievements: readonly Achievement[]
  readonly newlyUnlocked: readonly AchievementId[]
  readonly checkForNewAchievements: (history: readonly GameRecord[]) => void
  readonly clearNewlyUnlocked: () => void
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<readonly Achievement[]>(() => getAchievements())
  const [newlyUnlocked, setNewlyUnlocked] = useState<readonly AchievementId[]>([])

  const checkForNewAchievements = useCallback(
    (history: readonly GameRecord[]) => {
      const unlocked = checkNewAchievements(history, achievements)
      if (unlocked.length === 0) return

      let updated = achievements
      for (const id of unlocked) {
        updated = unlockAchievement(updated, id)
      }
      setAchievements(updated)
      setNewlyUnlocked(unlocked)
    },
    [achievements]
  )

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([])
  }, [])

  return {
    achievements,
    newlyUnlocked,
    checkForNewAchievements,
    clearNewlyUnlocked,
  }
}
