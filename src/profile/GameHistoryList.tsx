import { useTranslation } from 'react-i18next'
import type { GameRecord } from './types'

interface GameHistoryListProps {
  readonly records: readonly GameRecord[]
}

const RESULT_COLORS = {
  win: 'text-emerald-400',
  loss: 'text-red-400',
  tie: 'text-neutral-400',
} as const

const MODE_ICONS: Record<string, string> = {
  local: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  ai: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  online: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

export function GameHistoryList({ records }: GameHistoryListProps) {
  const { t } = useTranslation()

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 text-sm">
        {t('profile.noGames')}
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-center gap-3 px-3 py-2.5 bg-neutral-800/50 rounded-lg"
        >
          <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={MODE_ICONS[record.mode]} />
          </svg>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${RESULT_COLORS[record.result]}`}>
                {t(`profile.result_${record.result}`)}
              </span>
              {record.forfeit && (
                <span className="text-[10px] text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">
                  FF
                </span>
              )}
              <span className="text-xs text-neutral-500 truncate">
                vs {record.opponentName}
                {record.opponentRating && (
                  <span className="text-neutral-600"> ({record.opponentRating})</span>
                )}
              </span>
            </div>
            <div className="text-xs text-neutral-600">
              {record.scores.black} - {record.scores.white}
              {record.difficulty && ` · ${t(`difficulty.${record.difficulty}`)}`}
            </div>
          </div>

          {record.ratingBefore !== undefined && record.ratingAfter !== undefined && (
            <div className="text-right shrink-0">
              <div className={`text-xs font-bold ${
                record.ratingAfter >= record.ratingBefore ? 'text-green-400' : 'text-red-400'
              }`}>
                {record.ratingAfter >= record.ratingBefore ? '+' : ''}{record.ratingAfter - record.ratingBefore}
              </div>
              <div className="text-[10px] text-neutral-600">{record.ratingAfter}</div>
            </div>
          )}

          <div className="text-xs text-neutral-600 shrink-0">
            {formatDate(record.timestamp)}
          </div>
        </div>
      ))}
    </div>
  )
}
