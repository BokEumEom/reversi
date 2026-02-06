import { useTranslation } from 'react-i18next'
import { ACHIEVEMENT_DEFINITIONS } from '../achievements'
import type { Achievement } from '../achievements/types'

interface AchievementsTabProps {
  readonly achievements: readonly Achievement[]
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  const { t } = useTranslation()

  const unlocked = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    const ach = achievements.find((a) => a.id === def.id)
    return ach?.unlockedAt !== null
  })

  const locked = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    const ach = achievements.find((a) => a.id === def.id)
    return ach?.unlockedAt === null
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {/* Unlocked Section */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>🎉</span>
            {t('profile.achievementsUnlocked')} ({unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {unlocked.map((def) => (
              <div
                key={def.id}
                className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-700/30"
                title={t(def.descKey)}
              >
                <span className="text-3xl mb-2">{def.icon}</span>
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
            <span>🔒</span>
            {t('profile.achievementsLocked')} ({locked.length})
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {locked.map((def) => (
              <div
                key={def.id}
                className="flex flex-col items-center p-2 rounded-lg bg-neutral-900 border border-neutral-800 opacity-40 grayscale"
                title={t(def.descKey)}
              >
                <span className="text-xl mb-1">{def.icon}</span>
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
