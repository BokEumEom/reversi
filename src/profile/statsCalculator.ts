import type { GameRecord, GameStats, ModeStats, GameMode } from './types'

const EMPTY_MODE_STATS: ModeStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  ties: 0,
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
