import type { GameRecord, GameStats, ModeStats, GameMode } from './types'

const EMPTY_MODE_STATS: ModeStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  ties: 0,
}

export interface RecentOpponent {
  readonly name: string
  readonly rating?: number
  readonly lastPlayed: string
  readonly gamesPlayed: number
  readonly record: {
    readonly wins: number
    readonly losses: number
    readonly ties: number
  }
}

function calcModeStats(records: readonly GameRecord[]): ModeStats {
  return records.reduce<ModeStats>(
    (acc, record) => ({
      totalGames: acc.totalGames + 1,
      wins: acc.wins + (record.result === 'win' ? 1 : 0),
      losses: acc.losses + (record.result === 'loss' ? 1 : 0),
      ties: acc.ties + (record.result === 'tie' ? 1 : 0),
    }),
    EMPTY_MODE_STATS,
  )
}

function filterByMode(history: readonly GameRecord[], mode: GameMode): readonly GameRecord[] {
  return history.filter((r) => r.mode === mode)
}

export function calculateStats(history: readonly GameRecord[]): GameStats {
  const overall = calcModeStats(history)
  const winRate = overall.totalGames > 0 ? Math.round((overall.wins / overall.totalGames) * 100) : 0

  return {
    ...overall,
    winRate,
    byMode: {
      local: calcModeStats(filterByMode(history, 'local')),
      ai: calcModeStats(filterByMode(history, 'ai')),
      online: calcModeStats(filterByMode(history, 'online')),
    },
  }
}

export function calculateStreak(history: readonly GameRecord[]): number {
  if (history.length === 0) return 0

  const sorted = [...history].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  let streak = 0
  for (const record of sorted) {
    if (record.result === 'win') {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function getRecentOpponents(
  history: readonly GameRecord[],
  limit: number = 10,
): readonly RecentOpponent[] {
  const opponentMap = new Map<string, RecentOpponent>()

  history
    .filter(r => r.mode === 'online')
    .forEach(r => {
      const existing = opponentMap.get(r.opponentName)
      if (existing) {
        const isMoreRecent = new Date(r.timestamp) > new Date(existing.lastPlayed)
        opponentMap.set(r.opponentName, {
          name: r.opponentName,
          rating: isMoreRecent ? r.opponentRating : existing.rating,
          lastPlayed: isMoreRecent ? r.timestamp : existing.lastPlayed,
          gamesPlayed: existing.gamesPlayed + 1,
          record: {
            wins: existing.record.wins + (r.result === 'win' ? 1 : 0),
            losses: existing.record.losses + (r.result === 'loss' ? 1 : 0),
            ties: existing.record.ties + (r.result === 'tie' ? 1 : 0),
          },
        })
      } else {
        opponentMap.set(r.opponentName, {
          name: r.opponentName,
          rating: r.opponentRating,
          lastPlayed: r.timestamp,
          gamesPlayed: 1,
          record: {
            wins: r.result === 'win' ? 1 : 0,
            losses: r.result === 'loss' ? 1 : 0,
            ties: r.result === 'tie' ? 1 : 0,
          },
        })
      }
    })

  return Array.from(opponentMap.values())
    .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
    .slice(0, limit)
}
