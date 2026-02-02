import { useEffect, useCallback, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Board, GameToolbar, GameOverModal, HomeScreen, TurnTimer, PlayerPanel, SettingsModal } from './components'
import { LanguageSelector } from './i18n/LanguageSelector'
import { useGameState } from './hooks/useGameState'
import { useNickname } from './hooks/useNickname'
import { useOnlineGameState, RoomLobby, ConnectionStatus } from './online'
import { useAudio } from './audio/useAudio'
import { useHaptic } from './haptics/useHaptic'
import { selectAIMove } from './ai'
import { useGameHistory, ProfileScreen } from './profile'
import { AI_THINKING_DELAY } from './config/constants'
import type { Position, GameMode, Difficulty } from './types'

function App() {
  const { t } = useTranslation()
  const [showHomeScreen, setShowHomeScreen] = useState(true)
  const [showOnlineLobby, setShowOnlineLobby] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward')
  const { nickname, setNickname } = useNickname()
  const { recordGame } = useGameHistory()
  const { playSound } = useAudio()
  const { triggerHaptic } = useHaptic()

  const {
    board: localBoard,
    currentPlayer: localCurrentPlayer,
    validMoves: localValidMoves,
    scores: localScores,
    isGameOver: localIsGameOver,
    winner: localWinner,
    gameMode,
    difficulty,
    isAIThinking,
    lastMove: localLastMove,
    flippedPositions: localFlipped,
    handleMove: localHandleMove,
    startNewGame,
    setGameMode,
    setDifficulty,
    setAIThinking,
  } = useGameState()

  const {
    roomId,
    roomState,
    myColor,
    connectionStatus,
    isMyTurn,
    error: onlineError,
    opponentDisconnectedAt,
    rematchRequested,
    opponentLeft,
    penaltyCooldownUntil,
    ratingInfo,
    createRoom,
    joinRoom,
    quickMatch,
    makeMove: onlineMakeMove,
    requestRematch,
    leaveRoom,
  } = useOnlineGameState(nickname)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomCode = params.get('room')
    if (roomCode) {
      setShowHomeScreen(false)
      setShowOnlineLobby(true)
      setGameMode('online')
      joinRoom(roomCode)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [joinRoom, setGameMode])

  useEffect(() => {
    const isOnline = gameMode === 'online' && roomState?.status === 'playing'
    if (!isOnline) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [gameMode, roomState?.status])

  const isOnlineGame = gameMode === 'online' && roomState?.status === 'playing'

  const board = isOnlineGame ? roomState.board : localBoard
  const currentPlayer = isOnlineGame ? roomState.currentPlayer : localCurrentPlayer
  const validMoves = isOnlineGame
    ? (isMyTurn ? getValidMovesFromBoard(roomState.board, myColor!) : [])
    : localValidMoves
  const scores = isOnlineGame ? roomState.scores : localScores
  const isGameOver = isOnlineGame ? roomState.isGameOver : localIsGameOver
  const winner = isOnlineGame ? roomState.winner : localWinner

  // Sound on game over
  const prevGameOverRef = useRef(false)
  useEffect(() => {
    if (isGameOver && !prevGameOverRef.current) {
      const isWin = isOnlineGame
        ? winner === myColor
        : gameMode === 'ai'
          ? winner === 'black'
          : true

      if (winner === 'tie' || !isWin) {
        playSound('lose')
        triggerHaptic('heavy')
      } else {
        playSound('win')
        triggerHaptic('success')
      }

      const result = winner === 'tie' ? 'tie' as const : isWin ? 'win' as const : 'loss' as const
      const playerColor = isOnlineGame ? (myColor ?? 'black') : 'black'
      const opponentName = isOnlineGame
        ? (myColor === 'black'
            ? roomState?.players.white?.nickname
            : roomState?.players.black?.nickname) ?? 'Opponent'
        : gameMode === 'ai'
          ? `AI (${difficulty})`
          : 'Player 2'

      recordGame({
        mode: gameMode === 'online' ? 'online' : gameMode === 'ai' ? 'ai' : 'local',
        difficulty: gameMode === 'ai' ? difficulty : undefined,
        result,
        playerColor,
        scores,
        opponentName,
      })
    }
    prevGameOverRef.current = isGameOver
  }, [isGameOver, winner, isOnlineGame, myColor, gameMode, playSound, triggerHaptic, scores, difficulty, roomState, recordGame])

  const handleCellClick = useCallback((pos: Position) => {
    if (isOnlineGame) {
      if (!isMyTurn) return
      onlineMakeMove(pos)
      playSound('place')
      triggerHaptic('light')
    } else {
      if (isAIThinking) return
      if (gameMode === 'ai' && currentPlayer === 'white') return

      const isValid = localValidMoves.some(m => m.row === pos.row && m.col === pos.col)
      if (isValid) {
        playSound('place')
        triggerHaptic('light')
      } else {
        playSound('invalid')
        triggerHaptic('error')
      }
      localHandleMove(pos)
    }
  }, [isOnlineGame, isMyTurn, onlineMakeMove, isAIThinking, gameMode, currentPlayer, localHandleMove, localValidMoves, playSound, triggerHaptic])

  useEffect(() => {
    if (
      gameMode === 'ai' &&
      localCurrentPlayer === 'white' &&
      !localIsGameOver &&
      localValidMoves.length > 0
    ) {
      setAIThinking(true)

      const timer = setTimeout(() => {
        const move = selectAIMove(localBoard, 'white', difficulty)
        if (move) {
          localHandleMove(move)
          playSound('place')
        }
        setAIThinking(false)
      }, AI_THINKING_DELAY)

      return () => clearTimeout(timer)
    }
  }, [gameMode, localCurrentPlayer, localIsGameOver, localValidMoves.length, localBoard, difficulty, localHandleMove, setAIThinking, playSound])

  const handleOnlineClick = () => {
    setNavDirection('forward')
    setShowHomeScreen(false)
    setShowOnlineLobby(true)
    setGameMode('online')
  }

  const handleStartGame = (mode: GameMode, selectedDifficulty?: Difficulty) => {
    setNavDirection('forward')
    setShowHomeScreen(false)
    if (mode === 'online') {
      setShowOnlineLobby(true)
    }
    setGameMode(mode)
    if (selectedDifficulty) {
      setDifficulty(selectedDifficulty)
    }
    startNewGame()
  }

  const handleBackToHome = () => {
    setNavDirection('back')
    setShowHomeScreen(true)
    setShowOnlineLobby(false)
    leaveRoom()
  }

  const handleLeaveOnline = () => {
    setNavDirection('back')
    leaveRoom()
    setShowOnlineLobby(false)
    setShowHomeScreen(true)
  }

  const handleNewGame = () => {
    if (isOnlineGame) {
      requestRematch()
    } else {
      startNewGame()
    }
  }

  const isDisabled = isAIThinking || isGameOver || (isOnlineGame && !isMyTurn)

  const settingsButton = (
    <button
      onClick={() => setShowSettings(true)}
      className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700 transition-colors"
      aria-label={t('settings.title')}
    >
      <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  )

  // Tick every second while opponent is disconnected so countdown updates
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!opponentDisconnectedAt) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [opponentDisconnectedAt])

  const slideClass = navDirection === 'back' ? 'animate-slideInLeft' : 'animate-slideInRight'

  if (showHomeScreen && !isOnlineGame) {
    return (
      <div key="home" className={slideClass}>
        <HomeScreen
          onStartGame={handleStartGame}
          onOnlineClick={handleOnlineClick}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
          nickname={nickname}
          onNicknameChange={setNickname}
        />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        {showProfile && <ProfileScreen nickname={nickname} onClose={() => setShowProfile(false)} />}
      </div>
    )
  }

  if (showOnlineLobby && !isOnlineGame) {
    return (
      <div key="lobby" className={`flex flex-col items-center justify-center min-h-screen p-4 bg-[#111] ${slideClass}`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {settingsButton}
          <LanguageSelector />
        </div>

        <h1 className="text-3xl font-bold mb-1 text-white">{t('title')}</h1>
        <p className="text-neutral-500 text-xs mb-8">{nickname}</p>

        {penaltyCooldownUntil && penaltyCooldownUntil > Date.now() && (
          <div className="mb-4 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-center max-w-xs">
            <p className="text-red-300 font-medium text-sm">{t('online.penaltyActive')}</p>
            <p className="text-red-400 text-xs mt-1">
              {Math.ceil((penaltyCooldownUntil - Date.now()) / 1000)}s
            </p>
          </div>
        )}

        <RoomLobby
          connectionStatus={connectionStatus}
          roomId={roomId}
          error={onlineError}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onQuickMatch={quickMatch}
          onCancelMatch={leaveRoom}
          onLeave={handleLeaveOnline}
        />

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    )
  }

  const opponentNickname = isOnlineGame && myColor
    ? (myColor === 'black' ? roomState.players.white?.nickname : roomState.players.black?.nickname) || t('online.opponent')
    : null

  const topPlayerName = isOnlineGame
    ? (myColor === 'white' ? (opponentNickname ?? t('online.opponent')) : nickname)
    : (gameMode === 'ai' ? 'AI' : t('game.whiteTurn').replace(/\s.*/, ''))
  const bottomPlayerName = isOnlineGame
    ? (myColor === 'black' ? (opponentNickname ?? t('online.opponent')) : nickname)
    : (gameMode === 'ai' ? nickname : t('game.blackTurn').replace(/\s.*/, ''))

  const topColor: 'white' | 'black' = 'white'
  const bottomColor: 'white' | 'black' = 'black'

  return (
    <div key="game" className={`flex flex-col items-center justify-center min-h-screen p-4 bg-[#111] ${slideClass}`}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isOnlineGame && <ConnectionStatus status={connectionStatus} />}
        {settingsButton}
        <LanguageSelector />
      </div>

      <div className="mb-4 text-center">
        {isGameOver ? (
          <span className="text-yellow-300 font-bold text-xl">
            {winner === 'tie' ? t('game.tie') : winner === 'black' ? t('game.blackWins') : t('game.whiteWins')}
          </span>
        ) : isAIThinking && !isOnlineGame ? (
          <span className="text-green-200 animate-pulse text-sm">{t('game.aiThinking')}</span>
        ) : isOnlineGame ? (
          <div className="flex items-center gap-3">
            {roomState.turnStartedAt && (
              <TurnTimer
                turnStartedAt={roomState.turnStartedAt}
                turnDuration={roomState.turnTimer || 30000}
                isActive={!isGameOver}
              />
            )}
            <span className={`text-sm font-medium ${isMyTurn ? 'text-green-200' : 'text-green-400/60'}`}>
              {isMyTurn ? t('online.yourTurn') : t('online.opponentTurn')}
            </span>
          </div>
        ) : null}
      </div>

      {opponentDisconnectedAt && !opponentLeft && (
        <div className="mb-3 px-4 py-2 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm animate-pulse">
          {t('online.opponentDisconnected')} ({Math.ceil(Math.max(0, opponentDisconnectedAt - Date.now()) / 1000)}s)
        </div>
      )}

      {opponentLeft && (
        <div className="mb-3 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-center">
          <p className="text-red-300 font-medium text-sm">{t('online.opponentLeft')}</p>
          {isGameOver && winner === myColor && (
            <p className="text-emerald-400 font-bold text-sm mt-1">{t('online.winByForfeit')}</p>
          )}
          <button
            onClick={handleLeaveOnline}
            className="mt-2 px-5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
          >
            {t('backToHome')}
          </button>
        </div>
      )}

      <div className="mb-3 w-full max-w-[420px]">
        <PlayerPanel
          color={topColor}
          name={topPlayerName}
          score={scores.white}
          isActive={currentPlayer === topColor && !isGameOver}
          isTop={true}
        />
      </div>

      <Board
        board={board}
        validMoves={validMoves}
        onCellClick={handleCellClick}
        disabled={isDisabled}
        lastMove={isOnlineGame ? null : localLastMove}
        flippedPositions={isOnlineGame ? undefined : localFlipped}
      />

      <div className="mt-3 w-full max-w-[420px]">
        <PlayerPanel
          color={bottomColor}
          name={bottomPlayerName}
          score={scores.black}
          isActive={currentPlayer === bottomColor && !isGameOver}
          isTop={false}
        />
      </div>

      <div className="mt-4">
        {!isOnlineGame && (
          <GameToolbar
            gameMode={gameMode}
            difficulty={difficulty}
            onNewGame={handleNewGame}
            onBackToHome={handleBackToHome}
          />
        )}

        {isOnlineGame && isGameOver && ratingInfo && (
          <div className="mt-3 flex items-center gap-2 text-sm animate-ratingBounce">
            <span className="text-neutral-400">{t('online.rating')}:</span>
            <span className="text-white font-bold text-base">{ratingInfo.rating}</span>
            <span className={`font-bold text-base ${ratingInfo.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {ratingInfo.delta >= 0 ? '+' : ''}{ratingInfo.delta}
            </span>
          </div>
        )}

        {isOnlineGame && (
          <div className="flex items-center gap-3">
            {isGameOver && rematchRequested !== 'sent' && (
              <button
                onClick={requestRematch}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
              >
                {t('game.playAgain')}
              </button>
            )}
            {rematchRequested === 'sent' && (
              <span className="px-4 py-2 text-yellow-300 text-sm animate-pulse">
                {t('online.waiting')}
              </span>
            )}
            {rematchRequested === 'received' && (
              <button
                onClick={requestRematch}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors animate-pulse"
              >
                {t('online.rematchAccept')}
              </button>
            )}
            <button
              onClick={handleLeaveOnline}
              className="px-6 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              {t('online.leave')}
            </button>
          </div>
        )}
      </div>

      {isGameOver && winner && !isOnlineGame && (
        <GameOverModal
          winner={winner}
          scores={scores}
          onPlayAgain={handleNewGame}
          onBackToHome={handleBackToHome}
        />
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

function getValidMovesFromBoard(board: readonly (readonly string[])[], player: string): Position[] {
  const BOARD_SIZE = 8
  const DIRECTIONS = [
    { dRow: -1, dCol: -1 }, { dRow: -1, dCol: 0 }, { dRow: -1, dCol: 1 },
    { dRow: 0, dCol: -1 }, { dRow: 0, dCol: 1 },
    { dRow: 1, dCol: -1 }, { dRow: 1, dCol: 0 }, { dRow: 1, dCol: 1 },
  ]

  const opponent = player === 'black' ? 'white' : 'black'
  const moves: Position[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 'empty') continue

      for (const dir of DIRECTIONS) {
        let r = row + dir.dRow
        let c = col + dir.dCol
        let foundOpponent = false

        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (board[r][c] === opponent) {
            foundOpponent = true
          } else if (board[r][c] === player && foundOpponent) {
            moves.push({ row, col })
            break
          } else {
            break
          }
          r += dir.dRow
          c += dir.dCol
        }
        if (moves.some(m => m.row === row && m.col === col)) break
      }
    }
  }

  return moves
}

export default App
