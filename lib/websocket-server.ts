/**
 * Simple WebSocket server for real-time updates
 * This would typically run as a separate service in production
 */

export interface LocationUpdate {
  type: "location_update"
  tourist_id: number
  device_id: string
  latitude: number
  longitude: number
  timestamp: string
}

export interface SOSUpdate {
  type: "sos_alert"
  tourist_id: number
  device_id: string
  name?: string
  latitude: number
  longitude: number
  timestamp: string
}

export interface RiskUpdate {
  type: "risk_update"
  tourist_id: number
  risk_level: "low" | "medium" | "high" | "critical"
  risk_score: number
  anomaly_type?: string
}

export type WebSocketMessage = LocationUpdate | SOSUpdate | RiskUpdate

// Singleton to store connected clients
class WebSocketManager {
  private static instance: WebSocketManager
  private clients: Set<any> = new Set()

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  addClient(client: any) {
    this.clients.add(client)
  }

  removeClient(client: any) {
    this.clients.delete(client)
  }

  broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message)
    this.clients.forEach((client) => {
      try {
        if (client.readyState === 1) {
          // OPEN
          client.send(messageStr)
        }
      } catch (error) {
        console.error("[v0] WebSocket broadcast error:", error)
      }
    })
  }

  getClientCount(): number {
    return this.clients.size
  }
}

export const wsManager = WebSocketManager.getInstance()
