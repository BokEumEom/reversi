import { useState, useEffect, useRef } from 'react'

export function useAnimatedScore(target: number) {
  const [display, setDisplay] = useState(target)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevRef = useRef(target)

  useEffect(() => {
    if (target === prevRef.current) return

    setIsAnimating(true)
    const diff = target - prevRef.current
    const step = diff > 0 ? 1 : -1
    const steps = Math.abs(diff)
    const stepTime = Math.min(300, steps * 50) / steps

    let current = prevRef.current
    const interval = setInterval(() => {
      current += step
      setDisplay(current)

      if (current === target) {
        clearInterval(interval)
        setIsAnimating(false)
        prevRef.current = target
      }
    }, stepTime)

    return () => clearInterval(interval)
  }, [target])

  return { display, isAnimating }
}
