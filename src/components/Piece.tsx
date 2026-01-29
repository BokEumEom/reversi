import type { Player } from '../types'

interface PieceProps {
  readonly player: Player
  readonly isFlipping?: boolean
  readonly flipClass?: string
}

export function Piece({ player, isFlipping = false, flipClass }: PieceProps) {
  const isBlack = player === 'black'

  const animClass = flipClass ?? (isFlipping ? 'animate-flip' : '')

  return (
    <div
      className={`
        w-[82%] h-[82%] rounded-full
        transition-transform duration-300
        ${animClass}
      `}
      style={{
        background: isBlack
          ? 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 50%, #000 100%)'
          : 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 50%, #bbb 100%)',
        boxShadow: isBlack
          ? 'inset 0 -2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)'
          : 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      }}
    />
  )
}
