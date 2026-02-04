import type { BoardTheme, ThemeId } from './types'

export const THEME_PRESETS: Record<ThemeId, BoardTheme> = {
  classic: {
    id: 'classic',
    boardBackground: '#0d4a22',
    cellNormal: '#1b7a3a',
    cellHighlight: '#2d8a4e',
    borderDark: '#14612d',
    borderLight: '#23924a',
    validMovePulse: '#4ade80',
  },

  ocean: {
    id: 'ocean',
    boardBackground: '#0c3d5c',
    cellNormal: '#1a6b8a',
    cellHighlight: '#2889ab',
    borderDark: '#0f4d6e',
    borderLight: '#2a8db0',
    validMovePulse: '#67d4fc',
  },

  wood: {
    id: 'wood',
    boardBackground: '#4a3728',
    cellNormal: '#6b5a3e',
    cellHighlight: '#7d6b4a',
    borderDark: '#3d2d1f',
    borderLight: '#8a7550',
    validMovePulse: '#d4a574',
  },

  midnight: {
    id: 'midnight',
    boardBackground: '#1a1a2e',
    cellNormal: '#2d2d4a',
    cellHighlight: '#3d3d5c',
    borderDark: '#15152a',
    borderLight: '#4a4a6a',
    validMovePulse: '#a78bfa',
  },

  sakura: {
    id: 'sakura',
    boardBackground: '#4a2040',
    cellNormal: '#6b4a5a',
    cellHighlight: '#7d5a6a',
    borderDark: '#3d1a35',
    borderLight: '#8a6a7a',
    validMovePulse: '#f9a8d4',
  },
} as const

export const DEFAULT_THEME_ID: ThemeId = 'classic'

export const THEME_OPTIONS: ReadonlyArray<{ id: ThemeId; labelKey: string }> = [
  { id: 'classic', labelKey: 'theme.classic' },
  { id: 'ocean', labelKey: 'theme.ocean' },
  { id: 'wood', labelKey: 'theme.wood' },
  { id: 'midnight', labelKey: 'theme.midnight' },
  { id: 'sakura', labelKey: 'theme.sakura' },
] as const
