export type AchievementId =
  | 'first_win'
  | 'wins_10'
  | 'wins_50'
  | 'streak_3'
  | 'streak_5'
  | 'perfect'
  | 'ai_hard'
  | 'online_first'

export interface Achievement {
  readonly id: AchievementId
  readonly unlockedAt: string | null
}

export interface AchievementDefinition {
  readonly id: AchievementId
  readonly nameKey: string
  readonly descKey: string
  readonly icon: string
  readonly category: 'general' | 'strategy' | 'mode'
}
