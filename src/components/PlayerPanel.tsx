import type { Player } from '../types'

interface PlayerPanelProps {
  readonly color: Player
  readonly name: string
  readonly score: number
  readonly isActive: boolean
  readonly isTop: boolean
}

export function PlayerPanel({ color, name, score, isActive, isTop }: PlayerPanelProps) {
  const isBlack = color === 'black'

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl
        transition-all duration-300 min-w-[200px]
        ${isTop ? 'flex-row' : 'flex-row'}
        ${isActive ? 'scale-105' : 'opacity-75'}
      `}
      style={{
        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
        boxShadow: isActive ? '0 0 16px rgba(74,222,128,0.3)' : 'none',
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: isBlack
            ? 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 60%, #000)'
            : 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 60%, #bbb)',
          boxShadow: isBlack
            ? '0 2px 8px rgba(0,0,0,0.6)'
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Name */}
      <span className="text-white text-sm font-medium truncate max-w-[100px]">
        {name}
      </span>

      {/* Score */}
      <span className="text-white text-2xl font-bold ml-auto tabular-nums">
        {score}
      </span>
    </div>
  )
}
