import { useTranslation } from 'react-i18next'
import { GameHistoryList } from './GameHistoryList'
import { RecentOpponentsList } from './RecentOpponentsList'
import type { GameRecord, GameMode } from './types'

type TabFilter = 'all' | GameMode

interface HistoryTabProps {
  readonly history: readonly GameRecord[]
  readonly activeTab: TabFilter
  readonly setActiveTab: (tab: TabFilter) => void
  readonly onClearHistory: () => void
  readonly hasHistory: boolean
}

const TABS: readonly TabFilter[] = ['all', 'local', 'ai', 'online']

export function HistoryTab({
  history,
  activeTab,
  setActiveTab,
  onClearHistory,
  hasHistory,
}: HistoryTabProps) {
  const { t } = useTranslation()

  const filteredHistory = activeTab === 'all'
    ? history
    : history.filter((r) => r.mode === activeTab)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {/* Mode Filter Tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
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

      {/* Game List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📋</span>
            {t('profile.gameHistory')}
          </h2>
          {hasHistory && (
            <button
              onClick={onClearHistory}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {t('profile.clearHistory')}
            </button>
          )}
        </div>
        <GameHistoryList records={filteredHistory} />
      </div>

      {/* Recent Opponents */}
      <RecentOpponentsList />
    </div>
  )
}
