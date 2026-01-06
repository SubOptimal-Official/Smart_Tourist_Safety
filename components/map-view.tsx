"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import L from "leaflet"
import { getMapConfig } from "@/app/actions/get-map-config"

interface Tourist {
  id: number
  device_id: string
  name?: string
  latitude?: number
  longitude?: number
  risk_level?: "low" | "medium" | "high" | "critical"
  active_sos_count?: number
}

interface SOSAlert {
  id: number
  latitude: number
  longitude: number
  name?: string
  status: "active" | "resolved"
}

interface MapViewProps {
  tourists: Tourist[]
  alerts: SOSAlert[]
  onSelectTourist: (tourist: Tourist) => void
}

export function MapView({ tourists, alerts, onSelectTourist }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const mapConfig = await getMapConfig()

        if (typeof window !== "undefined" && !window.L) {
          // Load Leaflet CSS
          const leafletCss = document.createElement("link")
          leafletCss.rel = "stylesheet"
          leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(leafletCss)

          // Load Leaflet JS
          const leafletScript = document.createElement("script")
          leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          leafletScript.onload = () => initializeMap(mapConfig.tileUrl)
          leafletScript.onerror = () => {
            setError("Failed to load map library. Please check your internet connection.")
            setLoading(false)
          }
          document.head.appendChild(leafletScript)
        } else if (window.L) {
          initializeMap(mapConfig.tileUrl)
        }
      } catch (err) {
        setError(
          "Geoapify API key not configured. Please add GEOAPIFY_API_KEY to your environment variables in the Vars section.",
        )
        setLoading(false)
      }
    }

    const initializeMap = (tileUrl: string) => {
      if (!mapRef.current || leafletMapRef.current) return

      const center = tourists.find((t) => t.latitude && t.longitude)
        ? [tourists[0].latitude || 0, tourists[0].longitude || 0]
        : [40.7128, -74.006]

      leafletMapRef.current = L.map(mapRef.current).setView(center, 12)

      L.tileLayer(tileUrl, {
        attribution:
          '© <a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
      }).addTo(leafletMapRef.current)

      setLoading(false)
    }

    loadLeaflet()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletMapRef.current || loading) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add tourist markers
    tourists.forEach((tourist) => {
      if (!tourist.latitude || !tourist.longitude) return

      const isSOS = tourist.active_sos_count && tourist.active_sos_count > 0
      const isHighRisk = tourist.risk_level === "high" || tourist.risk_level === "critical"

      const color = isSOS ? "#ef4444" : isHighRisk ? "#f97316" : "#3b82f6"
      const radius = isSOS ? 12 : isHighRisk ? 10 : 8

      const marker = L.circleMarker([tourist.latitude, tourist.longitude], {
        radius: radius,
        fillColor: color,
        fillOpacity: 0.9,
        color: "#ffffff",
        weight: 2,
      }).addTo(leafletMapRef.current)

      marker.bindPopup(`
        <div style="padding: 4px;">
          <strong>${tourist.name || tourist.device_id}</strong><br/>
          ${tourist.risk_level ? `Risk: ${tourist.risk_level}` : ""}
          ${isSOS ? '<br/><span style="color: #ef4444; font-weight: bold;">⚠ SOS ACTIVE</span>' : ""}
        </div>
      `)

      marker.on("click", () => {
        onSelectTourist(tourist)
      })

      markersRef.current.push(marker)
    })

    // Add SOS alert markers with pulsing effect
    alerts
      .filter((a) => a.status === "active")
      .forEach((alert) => {
        const pulseMarker = L.circleMarker([alert.latitude, alert.longitude], {
          radius: 20,
          fillColor: "#ef4444",
          fillOpacity: 0.3,
          color: "#ef4444",
          weight: 3,
          className: "pulse-marker",
        }).addTo(leafletMapRef.current)

        pulseMarker.bindPopup(`
          <div style="padding: 4px;">
            <strong style="color: #ef4444;">🚨 SOS ALERT</strong><br/>
            ${alert.name || "Unknown Tourist"}
          </div>
        `)

        markersRef.current.push(pulseMarker)
      })

    // Fit bounds to show all tourists
    if (tourists.length > 0) {
      const bounds = tourists.filter((t) => t.latitude && t.longitude).map((t) => [t.latitude!, t.longitude!])

      if (bounds.length > 0) {
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [tourists, alerts, onSelectTourist, loading])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[600px] rounded-lg" />
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-3 rounded-lg shadow-lg text-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>SOS Active</span>
        </div>
      </div>
      <style jsx>{`
        .pulse-marker {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
