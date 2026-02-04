import type { Board as BoardType, Position } from '../types'
import { useTheme } from '../theme'
import { Cell } from './Cell'

interface BoardProps {
  readonly board: BoardType
  readonly validMoves: ReadonlyArray<Position>
  readonly onCellClick: (pos: Position) => void
  readonly disabled: boolean
  readonly lastMove?: Position | null
  readonly flippedPositions?: ReadonlyArray<Position>
}

function isValidPosition(validMoves: ReadonlyArray<Position>, pos: Position): boolean {
  return validMoves.some(m => m.row === pos.row && m.col === pos.col)
}

function isPosition(pos: Position, target: Position | null | undefined): boolean {
  return target != null && pos.row === target.row && pos.col === target.col
}

function getFlipIndex(pos: Position, flipped: ReadonlyArray<Position> | undefined): number {
  if (!flipped) return -1
  return flipped.findIndex(f => f.row === pos.row && f.col === pos.col)
}

export function Board({ board, validMoves, onCellClick, disabled, lastMove, flippedPositions }: BoardProps) {
  const theme = useTheme()

  return (
    <div
      className="inline-block rounded-xl overflow-hidden"
      style={{
        padding: '6px',
        backgroundColor: theme.boardBackground,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const pos = { row: rowIndex, col: colIndex }
            const flipIndex = getFlipIndex(pos, flippedPositions)
            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cellState={cell}
                position={pos}
                isValidMove={isValidPosition(validMoves, pos)}
                onClick={onCellClick}
                disabled={disabled}
                isLastMove={isPosition(pos, lastMove)}
                flipDelay={flipIndex >= 0 ? Math.min(flipIndex, 4) : -1}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
