import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameHistory } from './useGameHistory'
import { StatsCard } from './StatsCard'
import { GameHistoryList } from './GameHistoryList'
import { ACHIEVEMENT_DEFINITIONS, useAchievements } from '../achievements'
import { useLeaderboard } from '../leaderboard/useLeaderboard'
import type { GameMode } from './types'

interface ProfileScreenProps {
  readonly nickname: string
  readonly onClose: () => void
}

type MainView = 'stats' | 'ranking'
type TabFilter = 'all' | GameMode

const TABS: readonly TabFilter[] = ['all', 'local', 'ai', 'online']
const MEDALS = ['🥇', '🥈', '🥉'] as const

export function ProfileScreen({ nickname, onClose }: ProfileScreenProps) {
  const { t } = useTranslation()
  const { history, stats, clearHistory } = useGameHistory()
  const { achievements } = useAchievements()
  const { entries, isLoading, error, refetch } = useLeaderboard()
  const [mainView, setMainView] = useState<MainView>('stats')
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
        {mainView === 'ranking' ? (
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            disabled={isLoading}
          >
            <svg className={`w-5 h-5 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Main View Selector */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => setMainView('stats')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mainView === 'stats'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t('profile.myStats')}
          </button>
          <button
            onClick={() => setMainView('ranking')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mainView === 'ranking'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t('leaderboard.title')}
          </button>
        </div>
      </div>

      {mainView === 'stats' ? (
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
      ) : (
        /* Ranking View */
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {isLoading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-neutral-500 text-sm mt-4">{t('leaderboard.loading')}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-400 text-sm mb-4">{t('leaderboard.error')}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
              >
                {t('leaderboard.retry')}
              </button>
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-neutral-500 text-sm">{t('leaderboard.noData')}</p>
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-neutral-500 font-medium">
                <div className="col-span-2 text-center">{t('leaderboard.rank')}</div>
                <div className="col-span-5">{t('leaderboard.nickname')}</div>
                <div className="col-span-3 text-right">{t('leaderboard.rating')}</div>
                <div className="col-span-2 text-right">{t('leaderboard.games')}</div>
              </div>

              {/* Entries */}
              {entries.map((entry) => {
                const isCurrentUser = entry.nickname === nickname
                const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null

                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg transition-colors ${
                      isCurrentUser
                        ? 'bg-emerald-900/30 border border-emerald-700/50'
                        : 'bg-neutral-900 border border-neutral-800'
                    }`}
                  >
                    <div className="col-span-2 flex items-center justify-center">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-neutral-500 text-sm font-mono">{entry.rank}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-emerald-300' : 'text-white'}`}>
                        {entry.nickname}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 rounded">
                          {t('leaderboard.you')}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      <span className={`text-sm font-bold ${isCurrentUser ? 'text-emerald-300' : 'text-amber-400'}`}>
                        {entry.rating}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="text-neutral-500 text-xs">{entry.gamesPlayed}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
