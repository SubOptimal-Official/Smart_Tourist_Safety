"use client"

import { useEffect, useRef } from "react"

export type RealtimeUpdateHandler = (data: any) => void

export function useRealtimeUpdates(onUpdate: RealtimeUpdateHandler, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const connect = () => {
      try {
        // In production, this would connect to a WebSocket server
        // For now, we'll use polling as a fallback
        console.log("[v0] Realtime updates: Using polling fallback")

        // Simulate realtime with polling
        const pollInterval = setInterval(() => {
          // Polling happens in the parent component
        }, 5000)

        return () => clearInterval(pollInterval)
      } catch (error) {
        console.error("[v0] WebSocket connection error:", error)

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[v0] Reconnecting... (attempt ${reconnectAttempts.current})`)
          connect()
        }, delay)
      }
    }

    const cleanup = connect()

    return () => {
      if (cleanup) cleanup()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [enabled, onUpdate])
}
