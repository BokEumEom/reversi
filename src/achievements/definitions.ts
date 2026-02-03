import type { AchievementDefinition } from './types'

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: 'first_win',
    nameKey: 'achievements.first_win',
    descKey: 'achievements.first_win_desc',
    icon: '🏆',
    category: 'general',
  },
  {
    id: 'wins_10',
    nameKey: 'achievements.wins_10',
    descKey: 'achievements.wins_10_desc',
    icon: '⭐',
    category: 'general',
  },
  {
    id: 'wins_50',
    nameKey: 'achievements.wins_50',
    descKey: 'achievements.wins_50_desc',
    icon: '💎',
    category: 'general',
  },
  {
    id: 'streak_3',
    nameKey: 'achievements.streak_3',
    descKey: 'achievements.streak_3_desc',
    icon: '🔥',
    category: 'general',
  },
  {
    id: 'streak_5',
    nameKey: 'achievements.streak_5',
    descKey: 'achievements.streak_5_desc',
    icon: '💥',
    category: 'general',
  },
  {
    id: 'perfect',
    nameKey: 'achievements.perfect',
    descKey: 'achievements.perfect_desc',
    icon: '👑',
    category: 'strategy',
  },
  {
    id: 'ai_hard',
    nameKey: 'achievements.ai_hard',
    descKey: 'achievements.ai_hard_desc',
    icon: '🤖',
    category: 'mode',
  },
  {
    id: 'online_first',
    nameKey: 'achievements.online_first',
    descKey: 'achievements.online_first_desc',
    icon: '🌐',
    category: 'mode',
  },
]
