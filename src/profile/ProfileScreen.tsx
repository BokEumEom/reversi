import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameHistory } from './useGameHistory'
import { OverviewTab } from './OverviewTab'
import { HistoryTab } from './HistoryTab'
import { AchievementsTab } from './AchievementsTab'
import { useAchievements } from '../achievements'
import { useLeaderboard } from '../leaderboard/useLeaderboard'
import type { GameMode } from './types'

interface ProfileScreenProps {
  readonly nickname: string
  readonly onClose: () => void
}

type MainView = 'stats' | 'ranking'
type ProfileTab = 'overview' | 'history' | 'achievements'
type TabFilter = 'all' | GameMode

const MEDALS = ['🥇', '🥈', '🥉'] as const

export function ProfileScreen({ nickname, onClose }: ProfileScreenProps) {
  const { t } = useTranslation()
  const { history, stats, clearHistory } = useGameHistory()
  const { achievements } = useAchievements()
  const { entries, isLoading, error, refetch } = useLeaderboard()
  const [mainView, setMainView] = useState<MainView>('stats')
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(onClose, 250)
  }, [onClose])

  const activeStats = activeTab === 'all'
    ? { ...stats, winRate: stats.winRate }
    : {
        ...stats.byMode[activeTab],
        winRate: stats.byMode[activeTab].totalGames > 0
          ? Math.round((stats.byMode[activeTab].wins / stats.byMode[activeTab].totalGames) * 100)
          : 0,
      }

  return (
    <div className={`fixed inset-0 z-50 bg-[#111] flex flex-col ${isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          aria-label={t('backToHome')}
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
            aria-label={t('leaderboard.retry')}
          >
            <svg className={`w-5 h-5 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Main View Selector: My Stats / Leaderboard */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex gap-1 bg-neutral-900 rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={mainView === 'stats'}
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
            role="tab"
            aria-selected={mainView === 'ranking'}
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
        <>
          {/* Profile Header */}
          <div className="px-4 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {nickname ? nickname.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg sm:text-xl font-bold text-white truncate">{nickname || '—'}</div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-emerald-400 font-bold">{stats.totalGames > 0 ? `${stats.winRate}%` : '—'}</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-400">{stats.totalGames} {t('profile.totalGames')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Sub-tabs: Overview / History / Achievements */}
          <div className="px-4 pb-3">
            <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800" role="tablist">
              <button
                role="tab"
                aria-selected={activeProfileTab === 'overview'}
                onClick={() => setActiveProfileTab('overview')}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                  activeProfileTab === 'overview'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {t('profile.overview')}
              </button>
              <button
                role="tab"
                aria-selected={activeProfileTab === 'history'}
                onClick={() => setActiveProfileTab('history')}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                  activeProfileTab === 'history'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {t('profile.history')}
              </button>
              <button
                role="tab"
                aria-selected={activeProfileTab === 'achievements'}
                onClick={() => setActiveProfileTab('achievements')}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                  activeProfileTab === 'achievements'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {t('achievements.title')}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeProfileTab === 'overview' && (
            <OverviewTab stats={activeStats} history={history} />
          )}
          {activeProfileTab === 'history' && (
            <HistoryTab
              history={history}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onClearHistory={clearHistory}
              hasHistory={history.length > 0}
            />
          )}
          {activeProfileTab === 'achievements' && (
            <AchievementsTab achievements={achievements} />
          )}
        </>
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
