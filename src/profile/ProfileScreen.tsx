import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameHistory } from './useGameHistory'
import { StatsCard } from './StatsCard'
import { GameHistoryList } from './GameHistoryList'
import { ACHIEVEMENT_DEFINITIONS, useAchievements } from '../achievements'
import type { GameMode } from './types'

interface ProfileScreenProps {
  readonly nickname: string
  readonly onClose: () => void
}

type TabFilter = 'all' | GameMode

const TABS: readonly TabFilter[] = ['all', 'local', 'ai', 'online']

export function ProfileScreen({ nickname, onClose }: ProfileScreenProps) {
  const { t } = useTranslation()
  const { history, stats, clearHistory } = useGameHistory()
  const { achievements } = useAchievements()
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(onClose, 250)
  }, [onClose])

  const filteredHistory = activeTab === 'all'
    ? history
    : history.filter((r) => r.mode === activeTab)

  const activeStats = activeTab === 'all'
    ? { ...stats, winRate: stats.winRate }
    : {
        ...stats.byMode[activeTab],
        winRate: stats.byMode[activeTab].totalGames > 0
          ? Math.round((stats.byMode[activeTab].wins / stats.byMode[activeTab].totalGames) * 100)
          : 0,
      }

  const handleClear = () => {
    clearHistory()
    setShowClearConfirm(false)
  }

  return (
    <div className={`fixed inset-0 z-50 bg-[#111] flex flex-col ${isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-medium">{t('profile.title')}</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Nickname */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-lg font-medium text-white">{nickname}</div>
          <div className="text-xs text-neutral-600 mt-1">
            {t('profile.totalGames')}: {stats.totalGames}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <StatsCard stats={activeStats} />
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-2 rounded-md text-xs font-medium transition-all
                ${activeTab === tab
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
                }
              `}
            >
              {tab === 'all' ? t('profile.all') : t(`profile.${tab}`)}
            </button>
          ))}
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-sm font-medium text-neutral-300 mb-3">
            {t('achievements.title')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENT_DEFINITIONS.map((def) => {
              const achievement = achievements.find((a) => a.id === def.id)
              const isUnlocked = achievement?.unlockedAt !== null
              return (
                <div
                  key={def.id}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-amber-900/20 border-amber-700/30'
                      : 'bg-neutral-900 border-neutral-800 opacity-40 grayscale'
                  }`}
                  title={t(def.descKey)}
                >
                  <span className="text-xl mb-1">{def.icon}</span>
                  <span className="text-[10px] text-neutral-400 text-center leading-tight">
                    {t(def.nameKey)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Games */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-300">
              {t('profile.recentGames')}
            </h2>
            {history.length > 0 && (
              showClearConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    {t('profile.confirmClear')}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    {t('profile.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  {t('profile.clearHistory')}
                </button>
              )
            )}
          </div>
          <GameHistoryList records={filteredHistory.slice(0, 20)} />
        </div>
      </div>
    </div>
  )
}
