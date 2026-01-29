import { useState, useCallback } from 'react'

const STORAGE_KEY = 'reversi-nickname'

function generateDefaultNickname(): string {
  const adjectives = ['Swift', 'Brave', 'Lucky', 'Calm', 'Bold', 'Keen', 'Wise', 'Quick']
  const nouns = ['Fox', 'Eagle', 'Lion', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Tiger']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

function loadNickname(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved.trim().length > 0) return saved
  } catch {
    // localStorage not available
  }
  return generateDefaultNickname()
}

function saveNickname(nickname: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, nickname)
  } catch {
    // localStorage not available
  }
}

export function useNickname() {
  const [nickname, setNicknameState] = useState<string>(loadNickname)

  const setNickname = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 20)
    if (trimmed.length > 0) {
      setNicknameState(trimmed)
      saveNickname(trimmed)
    }
  }, [])

  return { nickname, setNickname }
}
