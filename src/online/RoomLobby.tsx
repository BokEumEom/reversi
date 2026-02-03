import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ConnectionStatus } from './types'

interface RoomLobbyProps {
  readonly connectionStatus: ConnectionStatus
  readonly roomId: string | null
  readonly error: string | null
  readonly onCreateRoom: () => Promise<string>
  readonly onJoinRoom: (code: string) => void
  readonly onQuickMatch: () => void
  readonly onCancelMatch: () => void
  readonly onLeave: () => void
}

function SearchingDots() {
  return (
    <span className="inline-flex gap-1 ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-dot-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-dot-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-dot-3" />
    </span>
  )
}

function RoomCodeDisplay({ code }: { readonly code: string }) {
  return (
    <div className="flex justify-center gap-1.5">
      {code.split('').map((char, i) => (
        <span
          key={i}
          className="animate-charAppear text-2xl sm:text-3xl font-mono font-bold text-white"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}

function ElapsedTimer({ startTime }: { readonly startTime: number }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <span className="font-mono tabular-nums text-neutral-500">
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

export function RoomLobby({
  connectionStatus,
  roomId,
  error,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onCancelMatch,
  onLeave,
}: RoomLobbyProps) {
  const { t } = useTranslation()
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const matchStartRef = useRef<number>(Date.now())
  const [matchElapsed, setMatchElapsed] = useState(0)

  const isQuickMatch = roomId === '__matchmaking__'
  const isWaiting = roomId && (connectionStatus === 'connected' || connectionStatus === 'connecting')

  // Track elapsed time for quick match
  useEffect(() => {
    if (!isQuickMatch) return
    matchStartRef.current = Date.now()
    const id = setInterval(() => {
      setMatchElapsed(Math.floor((Date.now() - matchStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isQuickMatch])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await onCreateRoom()
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyInvite = () => {
    if (roomId) {
      const url = `${window.location.origin}?room=${roomId}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoin = () => {
    if (joinCode.length === 6) {
      onJoinRoom(joinCode)
    }
  }

  // Quick match waiting screen
  if (isQuickMatch && isWaiting) {
    return (
      <div className="w-full max-w-xs mx-auto text-center animate-fadeIn">
        {/* Searching animation */}
        <div className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-1 text-neutral-300 text-sm font-medium mb-3">
            {t('online.searching')}
            <SearchingDots />
          </div>

          {matchElapsed >= 10 && (
            <div className="text-xs text-amber-400/70 animate-fadeIn mb-2">
              {t('online.expandingRange')}
            </div>
          )}

          <ElapsedTimer startTime={matchStartRef.current} />
        </div>

        {/* Cancel — stay in lobby */}
        <button
          onClick={onCancelMatch}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t('online.leave')}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-sm animate-slideUp">{error}</p>
        )}
      </div>
    )
  }

  // Room waiting screen (created/joined room)
  if (isWaiting) {
    return (
      <div className="w-full max-w-xs mx-auto text-center animate-fadeIn">
        <div className="mb-6 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="text-neutral-500 text-xs mb-3">{t('online.roomCode')}</div>
          <RoomCodeDisplay code={roomId!} />
        </div>

        {/* Waiting indicator */}
        <div className="mb-6 flex items-center justify-center gap-2 text-neutral-400 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('online.waiting')}
        </div>

        {/* Copy invite link */}
        <button
          onClick={handleCopyInvite}
          className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {copied ? t('online.copied') : t('online.inviteLink')}
        </button>

        <button
          onClick={onLeave}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToHome')}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-sm animate-slideUp">{error}</p>
        )}
      </div>
    )
  }

  // Lobby: create or join
  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-4">
      {/* Quick match */}
      <button
        onClick={onQuickMatch}
        className="group w-full flex items-center gap-4 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-emerald-800 hover:bg-neutral-800 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-900/60 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-left flex-1">
          <div className="text-white font-medium text-sm">{t('online.quickMatch')}</div>
        </div>
        <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Create room */}
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="group w-full flex items-center gap-4 px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 hover:bg-neutral-800 disabled:opacity-50 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-emerald-900/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-900/60 transition-colors">
          {isCreating ? (
            <svg className="w-5 h-5 animate-spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <div className="text-left flex-1">
          <div className="text-white font-medium text-sm">{t('online.createRoom')}</div>
        </div>
        <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-600 text-xs">OR</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Join room */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
            placeholder={t('online.enterCode')}
            maxLength={6}
            className="flex-1 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-center font-mono text-sm tracking-[0.2em] uppercase text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length !== 6}
            className="px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
          >
            {t('online.joinRoom')}
          </button>
        </div>
      </div>

      {/* Online rules brief */}
      <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-neutral-500 text-xs font-medium">{t('howToPlay.onlineTitle')}</span>
        </div>
        <div className="space-y-1">
          <p className="text-neutral-500 text-[11px] leading-relaxed">{t('howToPlay.onlineBrief1')}</p>
          <p className="text-neutral-500 text-[11px] leading-relaxed">{t('howToPlay.onlineBrief2')}</p>
          <p className="text-neutral-500 text-[11px] leading-relaxed">{t('howToPlay.onlineBrief3')}</p>
        </div>
      </div>

      {/* Back to home */}
      <button
        onClick={onLeave}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('backToHome')}
      </button>

      {error && (
        <p className="text-red-400 text-center text-sm animate-slideUp">{error}</p>
      )}

      {connectionStatus === 'reconnecting' && (
        <p className="text-yellow-400 text-center text-sm animate-pulse">{t('online.reconnecting')}</p>
      )}
    </div>
  )
}
