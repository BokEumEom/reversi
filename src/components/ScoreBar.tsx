import type { Scores } from '../types'
import { useAnimatedScore } from '../hooks/useAnimatedScore'

interface ScoreBarProps {
  readonly scores: Scores
  readonly disableAnimations?: boolean
}

function PieceIcon({ color }: { readonly color: 'black' | 'white' }) {
  const isBlack = color === 'black'
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0"
      style={{
        background: isBlack
          ? 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 60%, #000)'
          : 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 60%, #bbb)',
        boxShadow: isBlack
          ? '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)'
          : '0 2px 6px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(0,0,0,0.1)',
      }}
    />
  )
}

export function ScoreBar({ scores, disableAnimations }: ScoreBarProps) {
  const total = scores.black + scores.white
  const blackRatio = total > 0 ? scores.black / total : 0.5
  const { display: blackDisplay, isAnimating: blackAnim } = useAnimatedScore(scores.black)
  const { display: whiteDisplay, isAnimating: whiteAnim } = useAnimatedScore(scores.white)

  const barTransition = disableAnimations ? '' : 'transition-all duration-500 ease-out'

  return (
    <div className="flex items-center gap-3 w-full max-w-[420px]">
      {/* Black side */}
      <div className="flex items-center gap-1.5">
        <PieceIcon color="black" />
        <span className={`text-white font-bold text-lg tabular-nums min-w-[24px] text-center ${blackAnim && !disableAnimations ? 'animate-scoreChange' : ''}`}>
          {blackDisplay}
        </span>
      </div>

      {/* Ratio bar */}
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-neutral-700/60 relative">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barTransition}`}
          style={{
            width: `${blackRatio * 100}%`,
            background: 'linear-gradient(to right, #1a1a1a, #333)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
          }}
        />
        <div
          className={`absolute inset-y-0 right-0 rounded-full ${barTransition}`}
          style={{
            width: `${(1 - blackRatio) * 100}%`,
            background: 'linear-gradient(to left, #e8e8e8, #bbb)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
          }}
        />
        {/* Separator line */}
        <div
          className={`absolute inset-y-0 w-px bg-neutral-900 ${barTransition}`}
          style={{ left: `${blackRatio * 100}%` }}
        />
      </div>

      {/* White side */}
      <div className="flex items-center gap-1.5">
        <span className={`text-white font-bold text-lg tabular-nums min-w-[24px] text-center ${whiteAnim && !disableAnimations ? 'animate-scoreChange' : ''}`}>
          {whiteDisplay}
        </span>
        <PieceIcon color="white" />
      </div>
    </div>
  )
}
