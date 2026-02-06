import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Player, Scores } from '../types'

interface GameOverModalProps {
  readonly winner: Player | 'tie'
  readonly scores: Scores
  readonly onPlayAgain: () => void
  readonly onBackToHome?: () => void
  readonly onClose?: () => void
}

function CountUpNumber({ target, className }: { readonly target: number; readonly className?: string }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const duration = 500
    const steps = 20
    const stepTime = duration / steps
    const increment = target / steps
    let current = 0
    let step = 0

    const id = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), target)
      setValue(current)
      if (step >= steps) clearInterval(id)
    }, stepTime)

    return () => clearInterval(id)
  }, [target])

  return <span className={className}>{value}</span>
}

const CONFETTI_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']

function ConfettiEffect() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + (i * 7.5)}%`,
    delay: `${i * 0.1}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + (i % 3) * 2,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti rounded-sm"
          style={{
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

export function GameOverModal({ winner, scores, onPlayAgain, onBackToHome, onClose }: GameOverModalProps) {
  const { t } = useTranslation()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (winner !== 'tie') {
      const timer = setTimeout(() => setShowConfetti(true), 200)
      return () => clearTimeout(timer)
    }
  }, [winner])

  const getWinnerText = () => {
    if (winner === 'tie') return t('game.tie')
    return winner === 'black' ? t('game.blackWins') : t('game.whiteWins')
  }

  const winnerTextColor = winner === 'tie'
    ? 'text-neutral-300'
    : winner === 'black'
      ? 'text-amber-300'
      : 'text-amber-300'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-backdropFade">
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center max-w-xs w-full animate-modalEnter">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {showConfetti && <ConfettiEffect />}

        <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
          {t('game.gameOver')}
        </div>
        <h2 className={`text-2xl font-bold mb-6 ${winnerTextColor}`}>{getWinnerText()}</h2>

        {/* Scores */}
        <div className="flex justify-center gap-10 mb-8">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 50%, #000)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            />
            <CountUpNumber
              target={scores.black}
              className="text-2xl font-bold text-white tabular-nums"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 50%, #bbb)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />
            <CountUpNumber
              target={scores.white}
              className="text-2xl font-bold text-white tabular-nums"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {t('game.playAgain')}
          </button>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full py-2.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {t('backToHome')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
