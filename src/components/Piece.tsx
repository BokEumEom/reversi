import type { Player } from '../types'
import { useTheme } from '../theme'

interface PieceProps {
  readonly player: Player
  readonly isFlipping?: boolean
  readonly flipClass?: string
}

export function Piece({ player, isFlipping = false, flipClass }: PieceProps) {
  const theme = useTheme()
  const isBlack = player === 'black'
  const pieceStyle = isBlack ? theme.blackPiece : theme.whitePiece

  const animClass = flipClass ?? (isFlipping ? 'animate-flip' : '')

  return (
    <div
      className={`
        w-[82%] h-[82%] rounded-full
        transition-transform duration-300
        ${animClass}
      `}
      style={{
        background: pieceStyle.background,
        boxShadow: pieceStyle.boxShadow,
      }}
    />
  )
}
