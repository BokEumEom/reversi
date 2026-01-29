import type { Board as BoardType, Position } from '../types'
import { Cell } from './Cell'

interface BoardProps {
  readonly board: BoardType
  readonly validMoves: ReadonlyArray<Position>
  readonly onCellClick: (pos: Position) => void
  readonly disabled: boolean
}

function isValidPosition(validMoves: ReadonlyArray<Position>, pos: Position): boolean {
  return validMoves.some(m => m.row === pos.row && m.col === pos.col)
}

export function Board({ board, validMoves, onCellClick, disabled }: BoardProps) {
  return (
    <div
      className="inline-block rounded-xl overflow-hidden"
      style={{
        padding: '6px',
        backgroundColor: '#0d4a22',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const pos = { row: rowIndex, col: colIndex }
            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cellState={cell}
                position={pos}
                isValidMove={isValidPosition(validMoves, pos)}
                onClick={onCellClick}
                disabled={disabled}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
