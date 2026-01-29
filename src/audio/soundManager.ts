import type { SoundType, AudioSettings } from './types'

const STORAGE_KEY = 'reversi_audio'

function loadSettings(): AudioSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as AudioSettings
    }
  } catch {
    // ignore
  }
  return { enabled: true, volume: 0.5 }
}

function saveSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null
let settings: AudioSettings = loadSettings()

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume?: number) {
  if (!settings.enabled) return

  try {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const vol = volume ?? settings.volume

    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Web Audio not supported
  }
}

function playNoise(duration: number) {
  if (!settings.enabled) return

  try {
    const ctx = getContext()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1
    }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.setValueAtTime(settings.volume * 0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    // Web Audio not supported
  }
}

const SOUND_HANDLERS: Record<SoundType, () => void> = {
  place() {
    playTone(600, 0.08, 'sine')
  },
  flip() {
    playTone(800, 0.06, 'sine')
  },
  invalid() {
    playTone(200, 0.15, 'square')
    setTimeout(() => playTone(150, 0.15, 'square'), 100)
  },
  win() {
    playTone(523, 0.15, 'sine')
    setTimeout(() => playTone(659, 0.15, 'sine'), 150)
    setTimeout(() => playTone(784, 0.3, 'sine'), 300)
  },
  lose() {
    playTone(400, 0.2, 'sine')
    setTimeout(() => playTone(300, 0.3, 'sine'), 200)
    setTimeout(() => playNoise(0.2), 400)
  },
}

export function play(sound: SoundType): void {
  SOUND_HANDLERS[sound]()
}

export function getSettings(): AudioSettings {
  return { ...settings }
}

export function setEnabled(enabled: boolean): void {
  settings = { ...settings, enabled }
  saveSettings(settings)
}

export function setVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume))
  settings = { ...settings, volume: clamped }
  saveSettings(settings)
}

export function toggleSound(): void {
  setEnabled(!settings.enabled)
}
