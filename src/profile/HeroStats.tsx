import { useTranslation } from 'react-i18next'
import type { ModeStats } from './types'

interface HeroStatsProps {
  readonly stats: ModeStats & { readonly winRate: number }
  readonly currentStreak?: number
}

export function HeroStats({ stats, currentStreak = 0 }: HeroStatsProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-700/30 rounded-2xl p-6">
      {/* Primary Metric - Win Rate */}
      <div className="text-center mb-6">
        <div className="text-6xl font-black text-emerald-400 mb-1">
          {stats.winRate}%
        </div>
        <div className="text-sm text-neutral-400">
          {t('profile.winRate')}
        </div>
      </div>

      {/* Secondary Metrics - 3 Column Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {stats.totalGames}
          </div>
          <div className="text-xs text-neutral-500">
            {t('profile.totalGames')}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {stats.wins}
          </div>
          <div className="text-xs text-neutral-500">
            {t('profile.wins')}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {currentStreak > 0 ? currentStreak : '—'}
          </div>
          <div className="text-xs text-neutral-500">
            {t('profile.streak')}
          </div>
        </div>
      </div>
    </div>
  )
}
