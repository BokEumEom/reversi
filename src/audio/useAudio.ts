import { useCallback } from 'react'
import { play } from './soundManager'
import type { SoundType } from './types'

export function useAudio() {
  const playSound = useCallback((sound: SoundType) => {
    play(sound)
  }, [])

  return { playSound }
}
