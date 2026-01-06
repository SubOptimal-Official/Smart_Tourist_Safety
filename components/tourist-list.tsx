"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, Phone, Mail } from "lucide-react"

interface Tourist {
  id: number
  device_id: string
  name?: string
  email?: string
  phone?: string
  latitude?: number
  longitude?: number
  last_location_time?: string
  active_sos_count?: number
  risk_level?: "low" | "medium" | "high" | "critical"
  risk_score?: number
}

interface TouristListProps {
  tourists: Tourist[]
}

export function TouristList({ tourists }: TouristListProps) {
  const getRiskColor = (level?: string) => {
    switch (level) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Tourists</CardTitle>
        <CardDescription>Complete list of registered tourists with tracking status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tourists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tourists currently registered</p>
          ) : (
            tourists.map((tourist) => (
              <div key={tourist.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{tourist.name || "Unknown Tourist"}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{tourist.device_id.substring(0, 30)}...</p>
                  </div>
                  <div className="flex gap-2">
                    {tourist.active_sos_count && tourist.active_sos_count > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        SOS
                      </Badge>
                    )}
                    <Badge variant={getRiskColor(tourist.risk_level)}>{tourist.risk_level || "low"}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {tourist.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{tourist.email}</span>
                    </div>
                  )}
                  {tourist.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{tourist.phone}</span>
                    </div>
                  )}
                </div>

                {tourist.latitude && tourist.longitude ? (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Location: {tourist.latitude.toFixed(4)}, {tourist.longitude.toFixed(4)}
                    </span>
                    {tourist.last_location_time && (
                      <span className="text-xs text-muted-foreground">
                        ({new Date(tourist.last_location_time).toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>No location data available</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
