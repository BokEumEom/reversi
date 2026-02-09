import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HeroStats } from './HeroStats'
import { GameHistoryList } from './GameHistoryList'
import { calculateStreak } from './statsCalculator'
import type { ModeStats, GameRecord } from './types'

interface OverviewTabProps {
  readonly stats: ModeStats & { readonly winRate: number }
  readonly history: readonly GameRecord[]
}

export function OverviewTab({ stats, history }: OverviewTabProps) {
  const { t } = useTranslation()
  const streak = useMemo(() => calculateStreak(history), [history])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <HeroStats stats={stats} currentStreak={streak} />

      <div>
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span aria-hidden="true">⚡</span>
          {t('profile.recentActivity')}
        </h2>
        {history.length > 0 ? (
          <GameHistoryList records={history.slice(0, 5)} />
        ) : (
          <div className="text-center py-8 text-neutral-500 text-sm">
            {t('profile.noGames')}
          </div>
        )}
      </div>
    </div>
  )
}
