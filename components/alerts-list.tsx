"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, MapPin, User } from "lucide-react"

interface SOSAlert {
  id: number
  tourist_id: number
  device_id: string
  name?: string
  email?: string
  phone?: string
  latitude: number
  longitude: number
  timestamp: string
  status: "active" | "resolved"
}

interface AlertsListProps {
  alerts: SOSAlert[]
  onResolve: (alertId: number) => void
}

export function AlertsList({ alerts, onResolve }: AlertsListProps) {
  const activeAlerts = alerts.filter((a) => a.status === "active")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          SOS Alerts
        </CardTitle>
        <CardDescription>Active emergency alerts requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-muted-foreground">No active SOS alerts</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div key={alert.id} className="border-2 border-destructive rounded-lg p-4 space-y-3 bg-destructive/5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        EMERGENCY
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{alert.name || "Unknown Tourist"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {alert.email && (
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{alert.email}</span>
                    </div>
                  )}
                  {alert.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{alert.phone}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-mono text-xs">
                        Lat: {alert.latitude.toFixed(6)}, Lng: {alert.longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                <Button onClick={() => onResolve(alert.id)} variant="outline" className="w-full" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
