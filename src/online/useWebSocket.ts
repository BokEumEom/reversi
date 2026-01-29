import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionStatus, ClientMessage, ServerMessage } from './types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787'

interface UseWebSocketOptions {
  roomId: string | null
  onMessage: (message: ServerMessage) => void
}

export function useWebSocket({ roomId, onMessage }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!roomId) return

    setStatus('connecting')

    try {
      const endpoint = roomId === '__matchmaking__' ? `${WS_URL}/matchmaking` : `${WS_URL}/room/${roomId}`
      const ws = new WebSocket(endpoint)

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage
          onMessage(message)
        } catch {
          // Invalid JSON
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        wsRef.current = null

        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++
            setStatus('reconnecting')
            connect()
          }, delay)
        }
      }

      ws.onerror = () => {
        ws.close()
      }

      wsRef.current = ws
    } catch {
      setStatus('disconnected')
    }
  }, [roomId, onMessage])

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttemptsRef.current = 5
    wsRef.current?.close()
    wsRef.current = null
    setStatus('disconnected')
  }, [])

  useEffect(() => {
    if (roomId) {
      connect()
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [roomId, connect])

  // Ping to keep connection alive
  useEffect(() => {
    if (status !== 'connected') return

    const pingInterval = setInterval(() => {
      send({ type: 'PING' })
    }, 30000)

    return () => clearInterval(pingInterval)
  }, [status, send])

  return { status, send, disconnect }
}
