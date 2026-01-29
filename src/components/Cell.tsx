import type { CellState, Position } from '../types'
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
        backgroundColor: isValidMove && !disabled ? '#2d8a4e' : '#1b7a3a',
        borderTop: '1px solid #14612d',
        borderLeft: '1px solid #14612d',
        borderBottom: '1px solid #23924a',
        borderRight: '1px solid #23924a',
      }}
    >
      {cellState !== 'empty' && <Piece player={cellState} flipClass={flipClass} />}
      {cellState === 'empty' && isValidMove && !disabled && (
        <div
          className="w-[30%] h-[30%] rounded-full animate-validMovePulse"
          style={{ backgroundColor: '#4ade80' }}
        />
      )}
    </div>
  )
}
