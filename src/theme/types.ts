export interface BoardTheme {
  readonly id: ThemeId
  readonly boardBackground: string
  readonly cellNormal: string
  readonly cellHighlight: string
  readonly borderDark: string
  readonly borderLight: string
  readonly validMovePulse: string
}

export type ThemeId = 'classic' | 'ocean' | 'wood' | 'midnight' | 'sakura'

export interface ThemeSettings {
  readonly themeId: ThemeId
}
