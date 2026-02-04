import type { ThemeId, ThemeSettings, BoardTheme } from './types'
import { THEME_PRESETS, DEFAULT_THEME_ID } from './presets'

const STORAGE_KEY = 'reversi_theme'

function loadSettings(): ThemeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ThemeSettings
      if (THEME_PRESETS[parsed.themeId]) {
        return parsed
      }
    }
  } catch {
    // ignore parse errors
  }
  return { themeId: DEFAULT_THEME_ID }
}

function saveSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore storage errors
  }
}

let settings: ThemeSettings = loadSettings()

export function getSettings(): ThemeSettings {
  return { ...settings }
}

export function setTheme(themeId: ThemeId): void {
  settings = { ...settings, themeId }
  saveSettings(settings)
}

export function getCurrentTheme(): BoardTheme {
  return THEME_PRESETS[settings.themeId]
}

export function getThemeById(themeId: ThemeId): BoardTheme {
  return THEME_PRESETS[themeId]
}
