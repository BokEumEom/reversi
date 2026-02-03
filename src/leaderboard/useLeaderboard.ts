import { useState, useEffect, useCallback } from 'react'
import { fetchLeaderboard } from './api'
import type { LeaderboardEntry } from './types'

interface UseLeaderboardReturn {
  readonly entries: readonly LeaderboardEntry[]
  readonly isLoading: boolean
  readonly error: string | null
  readonly refetch: () => void
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries, setEntries] = useState<readonly LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchLeaderboard(50)
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  return {
    entries,
    isLoading,
    error,
    refetch: loadLeaderboard,
  }
}
