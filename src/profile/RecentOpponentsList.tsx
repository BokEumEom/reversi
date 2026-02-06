import { useRef, useState, useEffect, useCallback } from 'react'
import { useGameHistory } from './useGameHistory'
import { getRecentOpponents } from './statsCalculator'

export function RecentOpponentsList() {
  const { history } = useGameHistory()
  const opponents = getRecentOpponents(history, 10)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  const updateFades = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftFade(scrollLeft > 0)
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    updateFades()
  }, [opponents, updateFades])

  if (opponents.length < 3) {
    return null
  }

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <span>🏆</span>
        최근 대전자
      </h3>

      <div className="relative">
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#111] to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2"
          onScroll={updateFades}
        >
          {opponents.map(opp => {
            const winRate = opp.gamesPlayed > 0 ? opp.record.wins / opp.gamesPlayed : 0
            const lastPlayedDate = new Date(opp.lastPlayed)
            const daysAgo = Math.floor((Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24))

            return (
              <div
                key={opp.name}
                className="flex-shrink-0 w-40 bg-neutral-900 border border-neutral-700 rounded-lg p-3 hover:border-emerald-600 transition-colors"
              >
                <p className="font-medium text-white text-sm truncate">{opp.name}</p>
                {opp.rating && (
                  <p className="text-xs text-emerald-400 font-bold mt-1">{opp.rating}</p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
                  {opp.record.wins}승 {opp.record.losses}패
                </p>
                <div className={`text-sm font-bold mt-2 ${
                  winRate > 0.5 ? 'text-green-400' :
                  winRate < 0.5 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {Math.round(winRate * 100)}%
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {daysAgo === 0 ? '오늘' :
                   daysAgo === 1 ? '어제' :
                   `${daysAgo}일 전`}
                </p>
              </div>
            )
          })}
        </div>

        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#111] to-transparent z-10 pointer-events-none flex items-center justify-end pr-2">
            <svg className="w-5 h-5 text-neutral-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
