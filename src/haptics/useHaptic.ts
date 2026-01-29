import { useCallback } from 'react'
import { vibrate, type HapticPattern } from './hapticManager'

export function useHaptic() {
  const triggerHaptic = useCallback((pattern: HapticPattern) => {
    vibrate(pattern)
  }, [])

  return { triggerHaptic }
}
