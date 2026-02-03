import type { GameRecord } from '../profile/types'
import type { Achievement, AchievementId } from './types'
import { isUnlocked } from './storage'

export function checkNewAchievements(
  history: readonly GameRecord[],
  achievements: readonly Achievement[]
): readonly AchievementId[] {
  const newlyUnlocked: AchievementId[] = []

  const wins = history.filter((g) => g.result === 'win')
  const totalWins = wins.length

  // first_win: 첫 승리
  if (!isUnlocked(achievements, 'first_win') && totalWins >= 1) {
    newlyUnlocked.push('first_win')
  }

  // wins_10: 10승 달성
  if (!isUnlocked(achievements, 'wins_10') && totalWins >= 10) {
    newlyUnlocked.push('wins_10')
  }

  // wins_50: 50승 달성
  if (!isUnlocked(achievements, 'wins_50') && totalWins >= 50) {
    newlyUnlocked.push('wins_50')
  }

  // streak_3, streak_5: 연승
  const maxStreak = calculateMaxWinStreak(history)
  if (!isUnlocked(achievements, 'streak_3') && maxStreak >= 3) {
    newlyUnlocked.push('streak_3')
  }
  if (!isUnlocked(achievements, 'streak_5') && maxStreak >= 5) {
    newlyUnlocked.push('streak_5')
  }

  // perfect: 64-0 승리
  if (!isUnlocked(achievements, 'perfect')) {
    const hasPerfect = history.some((g) => {
      if (g.result !== 'win') return false
      const myScore = g.playerColor === 'black' ? g.scores.black : g.scores.white
      const opponentScore = g.playerColor === 'black' ? g.scores.white : g.scores.black
      return myScore === 64 && opponentScore === 0
    })
    if (hasPerfect) {
      newlyUnlocked.push('perfect')
    }
  }

  // ai_hard: 어려운 AI 승리
  if (!isUnlocked(achievements, 'ai_hard')) {
    const hasHardAIWin = history.some(
      (g) => g.mode === 'ai' && g.difficulty === 'hard' && g.result === 'win'
    )
    if (hasHardAIWin) {
      newlyUnlocked.push('ai_hard')
    }
  }

  // online_first: 첫 온라인 승리
  if (!isUnlocked(achievements, 'online_first')) {
    const hasOnlineWin = history.some((g) => g.mode === 'online' && g.result === 'win')
    if (hasOnlineWin) {
      newlyUnlocked.push('online_first')
    }
  }

  return newlyUnlocked
}

function calculateMaxWinStreak(history: readonly GameRecord[]): number {
  // history is newest first, reverse for chronological order
  const chronological = [...history].reverse()

  let maxStreak = 0
  let currentStreak = 0

  for (const game of chronological) {
    if (game.result === 'win') {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}
