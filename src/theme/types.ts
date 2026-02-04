export interface PieceStyle {
  readonly background: string
  readonly boxShadow: string
}

export interface BoardTheme {
  readonly id: ThemeId
  readonly boardBackground: string
  readonly cellLight: string
  readonly cellDark: string
  readonly cellHighlight: string
  readonly borderDark: string
  readonly borderLight: string
  readonly validMovePulse: string
  readonly blackPiece: PieceStyle
  readonly whitePiece: PieceStyle
}

export type ThemeId = 'classic' | 'ocean' | 'wood' | 'midnight' | 'sakura' | 'liquidGlass' | 'neon'

export interface ThemeSettings {
  readonly themeId: ThemeId
}
