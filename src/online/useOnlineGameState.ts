import { useCallback, useRef, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import type { RoomState, ServerMessage } from './types'
import type { ClientMessage } from './types'
import type { Player, Position } from '../types'
import { getUserId } from '../profile/storage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export function useOnlineGameState(nickname: string) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myColor, setMyColor] = useState<Player | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opponentDisconnectedAt, setOpponentDisconnectedAt] = useState<number | null>(null)
  const [rematchRequested, setRematchRequested] = useState<'none' | 'sent' | 'received'>('none')
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [penaltyCooldownUntil, setPenaltyCooldownUntil] = useState<number | null>(null)
  const [ratingInfo, setRatingInfo] = useState<{ rating: number; delta: number } | null>(null)

  const pendingRoomIdRef = useRef<string | null>(null)
  const sendRef = useRef<(message: ClientMessage) => void>(() => {})
  const nicknameRef = useRef(nickname)
  nicknameRef.current = nickname

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'ROOM_JOINED':
        setMyColor(message.color)
        setError(null)
        break

      case 'WAITING_FOR_OPPONENT':
        break

      case 'GAME_START':
        setRoomState(message.state)
        setMyColor(message.yourColor)
        setError(null)
        setRematchRequested('none')
        setRatingInfo(null)
        break

      case 'MOVE_MADE':
      case 'GAME_OVER':
      case 'TURN_TIMEOUT':
        setRoomState(message.state)
        break

      case 'INVALID_MOVE':
        setError(message.reason)
        setTimeout(() => setError(null), 3000)
        break

      case 'OPPONENT_DISCONNECTED':
        setOpponentDisconnectedAt(message.reconnectDeadline)
        break

      case 'OPPONENT_RECONNECTED':
        setOpponentDisconnectedAt(null)
        break

      case 'OPPONENT_LEFT':
        setOpponentDisconnectedAt(null)
        setOpponentLeft(true)
        break

      case 'OPPONENT_FORFEITED':
        setOpponentDisconnectedAt(null)
        setOpponentLeft(true)
        setRoomState(message.state)
        break

      case 'MATCHED':
        pendingRoomIdRef.current = message.roomId
        setRoomId(message.roomId)
        break

      case 'REMATCH_REQUESTED':
        setRematchRequested('received')
        break

      case 'REMATCH_ACCEPTED':
        setRoomState(message.state)
        setRematchRequested('none')
        break

      case 'RATING_UPDATE':
        setRatingInfo({ rating: message.rating, delta: message.delta })
        break

      case 'PENALTY_ACTIVE':
        setPenaltyCooldownUntil(message.cooldownUntil)
        break

      case 'ERROR':
        setError(message.message)
        break
    }
  }, [])

  const handleConnected = useCallback(() => {
    const id = pendingRoomIdRef.current
    if (id === '__matchmaking__') {
      sendRef.current({ type: 'QUICK_MATCH', nickname: nicknameRef.current, sessionToken: getUserId() })
    } else if (id) {
      sendRef.current({ type: 'JOIN_ROOM', roomId: id, nickname: nicknameRef.current, sessionToken: getUserId() })
    }
  }, [])

  const { status, send, disconnect } = useWebSocket({
    roomId,
    onMessage: handleMessage,
    onConnected: handleConnected,
  })

  sendRef.current = send

  const createRoom = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/api/create-room`)
      const data = await response.json()
      const newRoomId = data.roomId as string
      pendingRoomIdRef.current = newRoomId
      setRoomId(newRoomId)
      setError(null)
      return newRoomId
    } catch {
      setError('방 생성 실패')
      throw new Error('Failed to create room')
    }
  }, [])

  const joinRoom = useCallback((code: string) => {
    const id = code.toUpperCase()
    pendingRoomIdRef.current = id
    setRoomId(id)
    setError(null)
  }, [])

  const makeMove = useCallback((position: Position) => {
    send({ type: 'MAKE_MOVE', position })
  }, [send])

  const requestRematch = useCallback(() => {
    send({ type: 'REMATCH_REQUEST' })
    setRematchRequested('sent')
  }, [send])

  const quickMatch = useCallback(() => {
    pendingRoomIdRef.current = '__matchmaking__'
    setRoomId('__matchmaking__')
    setError(null)
  }, [])

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_ROOM' })
    disconnect()
    pendingRoomIdRef.current = null
    setRoomId(null)
    setRoomState(null)
    setMyColor(null)
    setError(null)
    setOpponentDisconnectedAt(null)
    setRematchRequested('none')
    setOpponentLeft(false)
    setPenaltyCooldownUntil(null)
    setRatingInfo(null)
  }, [send, disconnect])

  const isMyTurn = roomState?.currentPlayer === myColor && !roomState?.isGameOver

  return {
    roomId,
    roomState,
    myColor,
    connectionStatus: status,
    isMyTurn,
    error,
    opponentDisconnectedAt,
    rematchRequested,
    opponentLeft,
    penaltyCooldownUntil,
    ratingInfo,
    createRoom,
    joinRoom,
    quickMatch,
    makeMove,
    requestRematch,
    leaveRoom,
  }
}
