import { useCallback, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import type { RoomState, ServerMessage } from './types'
import type { Player, Position } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export function useOnlineGameState(nickname: string) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myColor, setMyColor] = useState<Player | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [opponentDisconnectedAt, setOpponentDisconnectedAt] = useState<number | null>(null)
  const [rematchRequested, setRematchRequested] = useState<'none' | 'sent' | 'received'>('none')

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
        setError('상대방이 나갔습니다')
        setOpponentDisconnectedAt(null)
        break

      case 'MATCHED':
        setRoomId(message.roomId)
        break

      case 'REMATCH_REQUESTED':
        setRematchRequested('received')
        break

      case 'REMATCH_ACCEPTED':
        setRoomState(message.state)
        setRematchRequested('none')
        break

      case 'ERROR':
        setError(message.message)
        break
    }
  }, [])

  const { status, send, disconnect } = useWebSocket({
    roomId,
    onMessage: handleMessage,
  })

  const createRoom = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/api/create-room`)
      const data = await response.json()
      const newRoomId = data.roomId as string
      setRoomId(newRoomId)
      setError(null)
      return newRoomId
    } catch {
      setError('방 생성 실패')
      throw new Error('Failed to create room')
    }
  }, [])

  const joinRoom = useCallback((code: string) => {
    setRoomId(code.toUpperCase())
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
    setRoomId('__matchmaking__')
    setError(null)
  }, [])

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_ROOM' })
    disconnect()
    setRoomId(null)
    setRoomState(null)
    setMyColor(null)
    setError(null)
    setOpponentDisconnectedAt(null)
    setRematchRequested('none')
  }, [send, disconnect])

  // Send nickname when WebSocket connects
  const sendJoin = useCallback((roomIdToJoin: string) => {
    send({ type: 'JOIN_ROOM', roomId: roomIdToJoin, nickname })
  }, [send, nickname])

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
    createRoom,
    joinRoom,
    quickMatch,
    makeMove,
    requestRematch,
    leaveRoom,
    sendJoin,
  }
}
