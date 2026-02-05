import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionStatus, ClientMessage, ServerMessage } from './types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787'

interface UseWebSocketOptions {
  roomId: string | null
  onMessage: (message: ServerMessage) => void
  onConnected?: () => void
}

const PONG_TIMEOUT = 45000  // 45초 (PING 30초 + 여유 15초)

export function useWebSocket({ roomId, onMessage, onConnected }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()
  const reconnectAttemptsRef = useRef(0)
  const lastPongRef = useRef(Date.now())

  const connect = useCallback(() => {
    if (!roomId) return

    setStatus('connecting')

    try {
      const endpoint = roomId === '__matchmaking__' ? `${WS_URL}/matchmaking` : `${WS_URL}/room/${roomId}`
      const ws = new WebSocket(endpoint)

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttemptsRef.current = 0
        onConnected?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage
          if (message.type === 'PONG') {
            lastPongRef.current = Date.now()
          }
          onMessage(message)
        } catch {
          // Invalid JSON
        }
      }

      ws.onclose = () => {
        if (wsRef.current !== ws) return
        setStatus('disconnected')
        wsRef.current = null

        // Server waits 30s for reconnection, so client needs to retry for at least 35s
        // 10 attempts: 1s + 2s + 4s + 5s + 5s + 5s + 5s + 5s + 5s + 5s = 42s total
        if (reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 5000)
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
    reconnectAttemptsRef.current = 10  // Stop auto-reconnect
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
      const ws = wsRef.current
      if (ws) {
        wsRef.current = null
        ws.close()
      }
    }
  }, [roomId, connect])

  // Ping to keep connection alive and detect zombie connections
  useEffect(() => {
    if (status !== 'connected') return

    lastPongRef.current = Date.now()  // Reset on connect

    const pingInterval = setInterval(() => {
      // Check PONG timeout - close connection if no response
      if (Date.now() - lastPongRef.current > PONG_TIMEOUT) {
        wsRef.current?.close()
        return
      }
      send({ type: 'PING' })
    }, 30000)

    return () => clearInterval(pingInterval)
  }, [status, send])

  return { status, send, disconnect }
}
