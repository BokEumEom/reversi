import type { CellState, Position } from '../types'
import { Piece } from './Piece'

interface CellProps {
  readonly cellState: CellState
  readonly position: Position
  readonly isValidMove: boolean
  readonly onClick: (pos: Position) => void
  readonly disabled: boolean
}

export function Cell({ cellState, position, isValidMove, onClick, disabled }: CellProps) {
  const handleClick = () => {
    if (!disabled && isValidMove) {
      onClick(position)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        w-[clamp(36px,10vw,52px)] h-[clamp(36px,10vw,52px)]
        flex items-center justify-center
        ${isValidMove && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
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
      {cellState !== 'empty' && <Piece player={cellState} />}
      {cellState === 'empty' && isValidMove && !disabled && (
        <div
          className="w-[30%] h-[30%] rounded-full opacity-50"
          style={{ backgroundColor: '#4ade80' }}
        />
      )}
    </div>
  )
}
