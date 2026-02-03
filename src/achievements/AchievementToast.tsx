import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AchievementDefinition } from './types'

interface AchievementToastProps {
  readonly achievement: AchievementDefinition
  readonly onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50)

    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(onClose, 300)
    }, 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-900/90 to-yellow-900/90 border border-amber-600/50 rounded-xl shadow-lg shadow-amber-900/30 backdrop-blur-sm">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <div className="text-amber-300 text-xs font-medium mb-0.5">
            {t('achievements.unlocked')}
          </div>
          <div className="text-white font-medium text-sm">
            {t(achievement.nameKey)}
          </div>
        </div>
      </div>
    </div>
  )
}
