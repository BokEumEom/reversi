import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Board, GameToolbar, GameOverModal, HomeScreen, TurnTimer, PlayerPanel } from './components'
import { LanguageSelector } from './i18n/LanguageSelector'
import { useGameState } from './hooks/useGameState'
import { useNickname } from './hooks/useNickname'
import { useOnlineGameState, RoomLobby, ConnectionStatus } from './online'
import { selectAIMove } from './ai'
import { AI_THINKING_DELAY } from './config/constants'
import type { Position, GameMode, Difficulty } from './types'

function App() {
  const { t } = useTranslation()
  const [showHomeScreen, setShowHomeScreen] = useState(true)
  const [showOnlineLobby, setShowOnlineLobby] = useState(false)
  const { nickname, setNickname } = useNickname()

  // Local/AI game state
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
    handleMove: localHandleMove,
    startNewGame,
    setGameMode,
    setDifficulty,
    setAIThinking,
  } = useGameState()

  // Online game state
  const {
    roomId,
    roomState,
    myColor,
    connectionStatus,
    isMyTurn,
    error: onlineError,
    opponentDisconnectedAt,
    rematchRequested,
    createRoom,
    joinRoom,
    quickMatch,
    makeMove: onlineMakeMove,
    requestRematch,
    leaveRoom,
  } = useOnlineGameState(nickname)

  // Check URL for room code on load
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

  // beforeunload warning during online game
  useEffect(() => {
    const isOnline = gameMode === 'online' && roomState?.status === 'playing'
    if (!isOnline) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [gameMode, roomState?.status])

  // Determine which state to use
  const isOnlineGame = gameMode === 'online' && roomState?.status === 'playing'

  const board = isOnlineGame ? roomState.board : localBoard
  const currentPlayer = isOnlineGame ? roomState.currentPlayer : localCurrentPlayer
  const validMoves = isOnlineGame
    ? (isMyTurn ? getValidMovesFromBoard(roomState.board, myColor!) : [])
    : localValidMoves
  const scores = isOnlineGame ? roomState.scores : localScores
  const isGameOver = isOnlineGame ? roomState.isGameOver : localIsGameOver
  const winner = isOnlineGame ? roomState.winner : localWinner

  const handleCellClick = useCallback((pos: Position) => {
    if (isOnlineGame) {
      if (!isMyTurn) return
      onlineMakeMove(pos)
    } else {
      if (isAIThinking) return
      if (gameMode === 'ai' && currentPlayer === 'white') return
      localHandleMove(pos)
    }
  }, [isOnlineGame, isMyTurn, onlineMakeMove, isAIThinking, gameMode, currentPlayer, localHandleMove])

  // AI move logic
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
        }
        setAIThinking(false)
      }, AI_THINKING_DELAY)

      return () => clearTimeout(timer)
    }
  }, [gameMode, localCurrentPlayer, localIsGameOver, localValidMoves.length, localBoard, difficulty, localHandleMove, setAIThinking])

  const handleOnlineClick = () => {
    setShowHomeScreen(false)
    setShowOnlineLobby(true)
    setGameMode('online')
  }

  const handleStartGame = (mode: GameMode, selectedDifficulty?: Difficulty) => {
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
    setShowHomeScreen(true)
    setShowOnlineLobby(false)
    leaveRoom()
  }

  const handleLeaveOnline = () => {
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

  // Show home screen
  if (showHomeScreen && !isOnlineGame) {
    return (
      <HomeScreen
        onStartGame={handleStartGame}
        onOnlineClick={handleOnlineClick}
        nickname={nickname}
        onNicknameChange={setNickname}
      />
    )
  }

  // Show online lobby
  if (showOnlineLobby && !isOnlineGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#111]">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <h1 className="text-3xl font-bold mb-1 text-white">{t('title')}</h1>
        <p className="text-neutral-500 text-xs mb-8">{nickname}</p>

        <RoomLobby
          connectionStatus={connectionStatus}
          roomId={roomId}
          error={onlineError}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onQuickMatch={quickMatch}
          onLeave={handleLeaveOnline}
        />
      </div>
    )
  }

  // Get opponent nickname for online games
  const opponentNickname = isOnlineGame && myColor
    ? (myColor === 'black' ? roomState.players.white?.nickname : roomState.players.black?.nickname) || t('online.opponent')
    : null

  // Player names for local/AI modes
  const topPlayerName = isOnlineGame
    ? (myColor === 'white' ? (opponentNickname ?? t('online.opponent')) : nickname)
    : (gameMode === 'ai' ? 'AI' : t('game.whiteTurn').replace(/\s.*/, ''))
  const bottomPlayerName = isOnlineGame
    ? (myColor === 'black' ? (opponentNickname ?? t('online.opponent')) : nickname)
    : (gameMode === 'ai' ? nickname : t('game.blackTurn').replace(/\s.*/, ''))

  // Top = white, bottom = black (standard orientation)
  const topColor: 'white' | 'black' = 'white'
  const bottomColor: 'white' | 'black' = 'black'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#111]">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {isOnlineGame && <ConnectionStatus status={connectionStatus} />}
        <LanguageSelector />
      </div>

      {/* Status bar */}
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

      {/* Opponent disconnected */}
      {opponentDisconnectedAt && (
        <div className="mb-3 px-4 py-2 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm animate-pulse">
          {t('online.reconnecting')} ({Math.ceil(Math.max(0, opponentDisconnectedAt - Date.now()) / 1000)}s)
        </div>
      )}

      {/* Top player (white) */}
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
      />

      {/* Bottom player (black) */}
      <div className="mt-3 w-full max-w-[420px]">
        <PlayerPanel
          color={bottomColor}
          name={bottomPlayerName}
          score={scores.black}
          isActive={currentPlayer === bottomColor && !isGameOver}
          isTop={false}
        />
      </div>

      {/* Controls */}
      <div className="mt-4">
        {!isOnlineGame && (
          <GameToolbar
            gameMode={gameMode}
            difficulty={difficulty}
            onNewGame={handleNewGame}
            onBackToHome={handleBackToHome}
          />
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
