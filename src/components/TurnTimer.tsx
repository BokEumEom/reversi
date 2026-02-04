import { useEffect, useState } from 'react'

interface TurnTimerProps {
  readonly turnStartedAt: number
  readonly turnDuration: number
  readonly isActive: boolean
  readonly serverTimeOffset?: number
}

export function TurnTimer({ turnStartedAt, turnDuration, isActive, serverTimeOffset = 0 }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(turnDuration)

  useEffect(() => {
    if (!isActive) {
      setRemaining(turnDuration)
      return
    }

    const update = () => {
      // Adjust current time with server offset for accurate sync
      const adjustedNow = Date.now() + serverTimeOffset
      const elapsed = adjustedNow - turnStartedAt
      const left = Math.max(0, turnDuration - elapsed)
      setRemaining(left)
    }

    update()
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [turnStartedAt, turnDuration, isActive, serverTimeOffset])

  const seconds = Math.ceil(remaining / 1000)
  const progress = remaining / turnDuration
  const isUrgent = seconds <= 10

  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 44 44" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="22" cy="22" r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="22" cy="22" r="18"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-100 ${
            isUrgent ? 'text-red-500' : 'text-green-400'
          }`}
          stroke="currentColor"
        />
      </svg>
      <span className={`text-lg font-mono font-bold tabular-nums ${
        isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-300'
      }`}>
        {seconds}s
      </span>
    </div>
  )
}
