import type { BoardTheme, ThemeId, PieceStyle } from './types'

// 매트 블랙 - 낮은 반사율, 베벨 내부 그림자
const DEFAULT_BLACK_PIECE: PieceStyle = {
  background: 'radial-gradient(ellipse 80% 80% at 50% 48%, #1a1a1a 0%, #252525 40%, #1a1a1a 70%, #0f0f0f 100%)',
  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.9), inset 0 -2px 4px rgba(50,50,50,0.3), 0 3px 6px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
}

// 소프트 아이보리 화이트 - 새틴 피니시
const DEFAULT_WHITE_PIECE: PieceStyle = {
  background: 'radial-gradient(ellipse 80% 80% at 50% 48%, #f2f2f0 0%, #e8e8e6 40%, #f2f2f0 70%, #dcdcda 100%)',
  boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)',
}

export const THEME_PRESETS: Record<ThemeId, BoardTheme> = {
  classic: {
    id: 'classic',
    // 그리드 라인 (셀 사이 갭) - 네온 그린
    boardBackground: '#2FAF6D',
    // 셀 색상 - 딥 에메랄드 그린 그라데이션
    cellLight: '#0E6B3A',
    cellDark: '#0A5A32',
    cellHighlight: '#158844',
    borderDark: '#085028',
    borderLight: '#1A7A40',
    validMovePulse: '#4ade80',
    blackPiece: DEFAULT_BLACK_PIECE,
    whitePiece: DEFAULT_WHITE_PIECE,
  },

  ocean: {
    id: 'ocean',
    boardBackground: '#0c3d5c',
    cellLight: '#2889ab',
    cellDark: '#1a6b8a',
    cellHighlight: '#3899bb',
    borderDark: '#0f4d6e',
    borderLight: '#2a8db0',
    validMovePulse: '#67d4fc',
    blackPiece: {
      background: 'radial-gradient(circle at 35% 30%, #1a3a5c, #0a1a2c 50%, #020810 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(103,212,252,0.2), 0 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
    },
    whitePiece: {
      background: 'radial-gradient(circle at 35% 30%, #e8f4fc, #c8e4f4 50%, #98c8e8 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    },
  },

  wood: {
    id: 'wood',
    boardBackground: '#4a3728',
    cellLight: '#7d6b4a',
    cellDark: '#6b5a3e',
    cellHighlight: '#8d7b5a',
    borderDark: '#3d2d1f',
    borderLight: '#8a7550',
    validMovePulse: '#d4a574',
    blackPiece: {
      background: 'radial-gradient(circle at 35% 30%, #4a3020, #2a1810 50%, #100800 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(212,165,116,0.2), 0 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
    },
    whitePiece: {
      background: 'radial-gradient(circle at 35% 30%, #f5e6d3, #e8d4b8 50%, #c8a882 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    },
  },

  midnight: {
    id: 'midnight',
    boardBackground: '#1a1a2e',
    cellLight: '#3d3d5c',
    cellDark: '#2d2d4a',
    cellHighlight: '#4d4d6c',
    borderDark: '#15152a',
    borderLight: '#4a4a6a',
    validMovePulse: '#a78bfa',
    blackPiece: {
      background: 'radial-gradient(circle at 35% 30%, #3a2a5a, #1a1030 50%, #0a0818 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(167,139,250,0.2), 0 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
    },
    whitePiece: {
      background: 'radial-gradient(circle at 35% 30%, #e8e0f8, #d0c0f0 50%, #a890e0 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    },
  },

  sakura: {
    id: 'sakura',
    boardBackground: '#4a2040',
    cellLight: '#7d5a6a',
    cellDark: '#6b4a5a',
    cellHighlight: '#8d6a7a',
    borderDark: '#3d1a35',
    borderLight: '#8a6a7a',
    validMovePulse: '#f9a8d4',
    blackPiece: {
      background: 'radial-gradient(circle at 35% 30%, #5a2040, #301020 50%, #180810 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(249,168,212,0.2), 0 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
    },
    whitePiece: {
      background: 'radial-gradient(circle at 35% 30%, #fce8f0, #f8d0e0 50%, #f0a8c8 100%)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    },
  },

  liquidGlass: {
    id: 'liquidGlass',
    // Apple iOS 26 Liquid Glass - 청록색 반투명 유리
    boardBackground: 'linear-gradient(180deg, rgba(0,140,200,0.15) 0%, rgba(0,160,220,0.12) 50%, rgba(0,140,200,0.18) 100%)',
    cellLight: 'linear-gradient(160deg, rgba(80,200,250,0.4) 0%, rgba(60,180,230,0.45) 100%)',
    cellDark: 'linear-gradient(160deg, rgba(60,180,230,0.35) 0%, rgba(40,160,210,0.4) 100%)',
    cellHighlight: 'linear-gradient(160deg, rgba(100,220,255,0.55) 0%, rgba(80,200,250,0.6) 100%)',
    borderDark: 'rgba(255,255,255,0.15)',
    borderLight: 'rgba(255,255,255,0.35)',
    validMovePulse: 'rgba(120,220,255,0.9)',
    blackPiece: {
      // 반투명 청록 유리알 - 어두운 톤, 빛 굴절
      background: 'radial-gradient(ellipse 70% 60% at 35% 30%, rgba(100,200,240,0.5) 0%, rgba(50,140,180,0.4) 30%, rgba(20,80,120,0.7) 60%, rgba(10,50,80,0.85) 100%)',
      boxShadow: 'inset 0 2px 6px rgba(150,220,255,0.5), inset 0 -3px 8px rgba(0,40,80,0.4), 0 6px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)',
    },
    whitePiece: {
      // 반투명 청록 유리알 - 밝은 톤, 스펙큘러 하이라이트
      background: 'radial-gradient(ellipse 70% 60% at 35% 30%, rgba(255,255,255,0.98) 0%, rgba(220,245,255,0.9) 30%, rgba(160,220,250,0.8) 60%, rgba(120,200,240,0.85) 100%)',
      boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.9), inset 0 -3px 8px rgba(80,180,220,0.3), 0 6px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.4)',
    },
  },

  neon: {
    id: 'neon',
    // 하이테크 네온 그린 - 다크 모드 + 뉴모피즘
    boardBackground: 'radial-gradient(ellipse at center, #1a3a1a 0%, #0a1a0a 60%, #050a05 100%)',
    cellLight: 'linear-gradient(145deg, #3a6a3a 0%, #2a5a2a 50%, #1a4a1a 100%)',
    cellDark: 'linear-gradient(145deg, #2d5a2d 0%, #1a4a1a 50%, #0d3a0d 100%)',
    cellHighlight: 'linear-gradient(145deg, #4a8a4a 0%, #3a7a3a 50%, #2a6a2a 100%)',
    borderDark: '#0a2a0a',
    borderLight: '#3a8a3a',
    validMovePulse: '#50ff50',
    blackPiece: {
      // 뉴모피즘 오목 효과 - 어두운 금속 느낌
      background: 'radial-gradient(ellipse 80% 80% at 50% 45%, #1a1a1a 0%, #2a2a2a 40%, #0a0a0a 70%, #151515 100%)',
      boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.8), inset 0 -2px 6px rgba(60,60,60,0.4), inset 0 0 20px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.6), 0 0 0 1px rgba(40,40,40,0.5)',
    },
    whitePiece: {
      // 뉴모피즘 오목 효과 - 밝은 플라스틱 느낌
      background: 'radial-gradient(ellipse 80% 80% at 50% 45%, #e8e8e8 0%, #d0d0d0 40%, #a0a0a0 70%, #c8c8c8 100%)',
      boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.6), inset 0 -4px 10px rgba(0,0,0,0.3), inset 0 0 20px rgba(180,180,180,0.3), 0 4px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,200,200,0.3)',
    },
  },
} as const

export const DEFAULT_THEME_ID: ThemeId = 'classic'

export const THEME_OPTIONS: ReadonlyArray<{ id: ThemeId; labelKey: string }> = [
  { id: 'classic', labelKey: 'theme.classic' },
  { id: 'ocean', labelKey: 'theme.ocean' },
  { id: 'wood', labelKey: 'theme.wood' },
  { id: 'midnight', labelKey: 'theme.midnight' },
  { id: 'sakura', labelKey: 'theme.sakura' },
  { id: 'liquidGlass', labelKey: 'theme.liquidGlass' },
  { id: 'neon', labelKey: 'theme.neon' },
] as const
