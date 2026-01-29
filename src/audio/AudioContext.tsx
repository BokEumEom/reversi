import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as soundManager from './soundManager'
import type { AudioSettings } from './types'

interface AudioContextValue {
  readonly settings: AudioSettings
  readonly toggleSound: () => void
  readonly setVolume: (volume: number) => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

interface AudioProviderProps {
  readonly children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [settings, setSettings] = useState<AudioSettings>(soundManager.getSettings())

  const toggleSound = useCallback(() => {
    soundManager.toggleSound()
    setSettings(soundManager.getSettings())
  }, [])

  const setVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume)
    setSettings(soundManager.getSettings())
  }, [])

  return (
    <AudioCtx.Provider value={{ settings, toggleSound, setVolume }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudioSettings(): AudioContextValue {
  const context = useContext(AudioCtx)
  if (!context) {
    throw new Error('useAudioSettings must be used within AudioProvider')
  }
  return context
}
