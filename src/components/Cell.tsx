import type { CellState, Position } from '../types'
import { useTheme } from '../theme'
import { Piece } from './Piece'

interface CellProps {
  readonly cellState: CellState
  readonly position: Position
  readonly isValidMove: boolean
  readonly onClick: (pos: Position) => void
  readonly disabled: boolean
  readonly isLastMove?: boolean
  readonly flipDelay?: number
}

const FLIP_CLASSES = [
  'animate-flip-d1',
  'animate-flip-d2',
  'animate-flip-d3',
  'animate-flip-d4',
  'animate-flip-d5',
]

export function Cell({ cellState, position, isValidMove, onClick, disabled, isLastMove, flipDelay = -1 }: CellProps) {
  const theme = useTheme()

  const handleClick = () => {
    if (!disabled && isValidMove) {
      onClick(position)
    }
  }

  const flipClass = flipDelay >= 0 ? FLIP_CLASSES[flipDelay] : undefined

  return (
    <div
      onClick={handleClick}
      className={`
        w-[clamp(36px,10vw,52px)] h-[clamp(36px,10vw,52px)]
        flex items-center justify-center
        ${isValidMove && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${isLastMove ? 'animate-lastMove' : ''}
        touch-manipulation
      `}
      style={{
        backgroundColor: isValidMove && !disabled ? theme.cellHighlight : theme.cellNormal,
        borderTop: `1px solid ${theme.borderDark}`,
        borderLeft: `1px solid ${theme.borderDark}`,
        borderBottom: `1px solid ${theme.borderLight}`,
        borderRight: `1px solid ${theme.borderLight}`,
      }}
    >
      {cellState !== 'empty' && <Piece player={cellState} flipClass={flipClass} />}
      {cellState === 'empty' && isValidMove && !disabled && (
        <div
          className="w-[30%] h-[30%] rounded-full animate-validMovePulse"
          style={{ backgroundColor: theme.validMovePulse }}
        />
      )}
    </div>
  )
}
