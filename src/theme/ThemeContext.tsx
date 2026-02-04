import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as themeManager from './themeManager'
import type { BoardTheme, ThemeId, ThemeSettings } from './types'

interface ThemeContextValue {
  readonly settings: ThemeSettings
  readonly theme: BoardTheme
  readonly setTheme: (themeId: ThemeId) => void
}

const ThemeCtx = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  readonly children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(themeManager.getSettings())

  const setTheme = useCallback((themeId: ThemeId) => {
    themeManager.setTheme(themeId)
    setSettings(themeManager.getSettings())
  }, [])

  const theme = themeManager.getThemeById(settings.themeId)

  return (
    <ThemeCtx.Provider value={{ settings, theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useThemeSettings(): ThemeContextValue {
  const context = useContext(ThemeCtx)
  if (!context) {
    throw new Error('useThemeSettings must be used within ThemeProvider')
  }
  return context
}

export function useTheme(): BoardTheme {
  const { theme } = useThemeSettings()
  return theme
}
