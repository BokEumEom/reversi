import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENT_DEFINITIONS } from '../achievements'
import type { Achievement } from '../achievements/types'

interface AchievementsTabProps {
  readonly achievements: readonly Achievement[]
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  const { t } = useTranslation()

  const { unlocked, locked } = useMemo(() => {
    const achMap = new Map(achievements.map(a => [a.id, a]))
    const unlockedDefs = ACHIEVEMENT_DEFINITIONS.filter(
      (def) => achMap.get(def.id)?.unlockedAt !== null,
    )
    const lockedDefs = ACHIEVEMENT_DEFINITIONS.filter(
      (def) => achMap.get(def.id)?.unlockedAt === null,
    )
    return { unlocked: unlockedDefs, locked: lockedDefs }
  }, [achievements])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {/* Unlocked Section */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span aria-hidden="true">🎉</span>
            {t('profile.achievementsUnlocked')} ({unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {unlocked.map((def) => (
              <div
                key={def.id}
                className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-700/30"
                title={t(def.descKey)}
              >
                <span className="text-3xl mb-2" aria-hidden="true">{def.icon}</span>
                <span className="text-xs text-white text-center font-medium leading-tight">
                  {t(def.nameKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Section */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span aria-hidden="true">🔒</span>
            {t('profile.achievementsLocked')} ({locked.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {locked.map((def) => (
              <div
                key={def.id}
                className="flex flex-col items-center p-2 rounded-lg bg-neutral-900 border border-neutral-800 opacity-40 grayscale"
                title={t(def.descKey)}
              >
                <span className="text-xl mb-1" aria-hidden="true">{def.icon}</span>
                <span className="text-[10px] text-neutral-400 text-center leading-tight">
                  {t(def.nameKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {unlocked.length === 0 && locked.length === 0 && (
        <div className="text-center py-12 text-neutral-500 text-sm">
          {t('profile.noAchievements')}
        </div>
      )}
    </div>
  )
}
