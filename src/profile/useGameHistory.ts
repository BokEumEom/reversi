import { useCallback, useMemo, useState } from 'react'
import { getGameHistory, saveGameRecord, clearGameHistory as clearStorage } from './storage'
import { calculateStats } from './statsCalculator'
import type { GameRecord, GameStats, RecordGameParams } from './types'

interface UseGameHistoryReturn {
  readonly history: readonly GameRecord[]
  readonly stats: GameStats
  readonly recordGame: (params: RecordGameParams) => void
  readonly clearHistory: () => void
}

export function useGameHistory(): UseGameHistoryReturn {
  const [history, setHistory] = useState<readonly GameRecord[]>(() => getGameHistory())

  const stats = useMemo(() => calculateStats(history), [history])

  const recordGame = useCallback((params: RecordGameParams) => {
    const record: GameRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...params,
    }
    const updated = saveGameRecord(record)
    setHistory(updated)
  }, [])

  const clearHistory = useCallback(() => {
    clearStorage()
    setHistory([])
  }, [])

  return { history, stats, recordGame, clearHistory }
}
