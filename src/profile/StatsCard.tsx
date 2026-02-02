import { useTranslation } from 'react-i18next'
import type { ModeStats } from './types'

interface StatsCardProps {
  readonly stats: ModeStats & { readonly winRate: number }
}

function WinRateCircle({ rate }: { readonly rate: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (rate / 100) * circumference

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#262626" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{rate}%</span>
      </div>
    </div>
  )
}

export function StatsCard({ stats }: StatsCardProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-6">
      <WinRateCircle rate={stats.winRate} />
      <div className="flex-1 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.wins}</div>
          <div className="text-xs text-neutral-500">{t('profile.wins')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className="text-xs text-neutral-500">{t('profile.losses')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-400">{stats.ties}</div>
          <div className="text-xs text-neutral-500">{t('profile.ties')}</div>
        </div>
      </div>
    </div>
  )
}
