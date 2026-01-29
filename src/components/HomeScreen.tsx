import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../i18n/LanguageSelector'
import type { GameMode, Difficulty } from '../types'

interface HomeScreenProps {
  readonly onStartGame: (mode: GameMode, difficulty?: Difficulty) => void
  readonly onOnlineClick: () => void
  readonly nickname: string
  readonly onNicknameChange: (name: string) => void
}

export function HomeScreen({ onStartGame, onOnlineClick, nickname, onNicknameChange }: HomeScreenProps) {
  const { t } = useTranslation()
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [showAIDifficulty, setShowAIDifficulty] = useState(false)
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState(nickname)

  const saveNickname = () => {
    onNicknameChange(nicknameInput)
    setIsEditingNickname(false)
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 50%, #000)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
              }}
            />
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #fff, #e8e8e8 50%, #bbb)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-1">
            {t('title')}
          </h1>
          <p className="text-neutral-500 text-sm">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Nickname */}
        <div className="mb-10">
          {isEditingNickname ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value.slice(0, 20))}
                onKeyDown={(e) => { if (e.key === 'Enter') saveNickname() }}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center text-sm w-40 focus:outline-none focus:border-neutral-500"
                autoFocus
                maxLength={20}
              />
              <button
                onClick={saveNickname}
                className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white transition-colors"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setNicknameInput(nickname); setIsEditingNickname(true) }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-sm"
            >
              <span>{nickname}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {/* Mode Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Local */}
          <button
            onClick={() => onStartGame('local')}
            className="group w-full flex items-center gap-4 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 hover:bg-neutral-800 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-900/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-900/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="text-white font-medium text-sm">{t('gameMode.local')}</div>
              <div className="text-neutral-500 text-xs">{t('home.localDesc')}</div>
            </div>
            <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* AI */}
          <div>
            <button
              onClick={() => {
                if (showAIDifficulty) {
                  onStartGame('ai', selectedDifficulty)
                } else {
                  setShowAIDifficulty(true)
                }
              }}
              className="group w-full flex items-center gap-4 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 hover:bg-neutral-800 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-900/60 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-medium text-sm">{t('gameMode.ai')}</div>
                <div className="text-neutral-500 text-xs">{t('home.aiDesc')}</div>
              </div>
              <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Difficulty inline */}
            {showAIDifficulty && (
              <div className="mt-2 flex gap-2 justify-center px-5">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-medium transition-all
                      ${selectedDifficulty === diff
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }
                    `}
                  >
                    {t(`difficulty.${diff}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Online */}
          <button
            onClick={onOnlineClick}
            className="group w-full flex items-center gap-4 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 hover:bg-neutral-800 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-900/40 flex items-center justify-center text-purple-400 group-hover:bg-purple-900/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="text-white font-medium text-sm">{t('gameMode.online')}</div>
              <div className="text-neutral-500 text-xs">{t('home.onlineDesc')}</div>
            </div>
            <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* How to Play */}
        <div className="mt-12 text-center">
          <details className="group">
            <summary className="text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors list-none flex items-center justify-center gap-1.5 text-xs">
              <span>{t('home.howToPlay')}</span>
              <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 max-w-xs mx-auto text-neutral-500 text-xs space-y-1.5 text-left">
              <p>· {t('home.rule1')}</p>
              <p>· {t('home.rule2')}</p>
              <p>· {t('home.rule3')}</p>
              <p>· {t('home.rule4')}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
