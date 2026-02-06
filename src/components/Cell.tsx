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
  readonly disableAnimations?: boolean
}

const FLIP_CLASSES = [
  'animate-flip-d1',
  'animate-flip-d2',
  'animate-flip-d3',
  'animate-flip-d4',
  'animate-flip-d5',
]

export function Cell({ cellState, position, isValidMove, onClick, disabled, isLastMove, flipDelay = -1, disableAnimations }: CellProps) {
  const theme = useTheme()

  const handleClick = () => {
    if (!disabled && isValidMove) {
      onClick(position)
    }
  }

  const flipClass = flipDelay >= 0 ? FLIP_CLASSES[flipDelay] : undefined

  // 체크보드 패턴: (row + col) % 2로 밝은/어두운 색상 번갈아 적용
  const isLightCell = (position.row + position.col) % 2 === 0
  const cellColor = isValidMove && !disabled
    ? theme.cellHighlight
    : isLightCell ? theme.cellLight : theme.cellDark

  return (
    <div
      onClick={handleClick}
      className={`
        w-[clamp(36px,10vw,52px)] h-[clamp(36px,10vw,52px)]
        flex items-center justify-center rounded-md
        ${isValidMove && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${isLastMove ? 'animate-lastMove' : ''}
        touch-manipulation
      `}
      style={{
        background: cellColor,
        borderTop: `1px solid ${theme.borderDark}`,
        borderLeft: `1px solid ${theme.borderDark}`,
        borderBottom: `1px solid ${theme.borderLight}`,
        borderRight: `1px solid ${theme.borderLight}`,
        // 오목한 셀 효과 - 돌이 안착하는 홈
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.1)',
      }}
    >
      {cellState !== 'empty' && <Piece player={cellState} flipClass={flipClass} disableAnimations={disableAnimations} />}
      {cellState === 'empty' && isValidMove && !disabled && (
        <div
          className="w-[30%] h-[30%] rounded-full animate-validMovePulse"
          style={{ backgroundColor: theme.validMovePulse }}
        />
      )}
    </div>
  )
}
