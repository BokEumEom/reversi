export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 100, 50],
}

function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

export function vibrate(pattern: HapticPattern): void {
  if (!isSupported()) return

  try {
    navigator.vibrate(PATTERNS[pattern])
  } catch {
    // vibrate not available
  }
}
