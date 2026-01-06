"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, AlertTriangle, MapPin, Users, Bell, Radio } from "lucide-react"
import { MapView } from "@/components/map-view"
import { TouristList } from "@/components/tourist-list"
import { AlertsList } from "@/components/alerts-list"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"

interface Tourist {
  id: number
  device_id: string
  name?: string
  email?: string
  phone?: string
  latitude?: number
  longitude?: number
  accuracy?: number
  last_location_time?: string
  active_sos_count?: number
  risk_level?: "low" | "medium" | "high" | "critical"
  risk_score?: number
}

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

export function PoliceDashboard() {
  const [tourists, setTourists] = useState<Tourist[]>([])
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const [touristsRes, alertsRes] = await Promise.all([fetch("/api/police/tourists"), fetch("/api/police/alerts")])

      if (!touristsRes.ok || !alertsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const touristsData = await touristsRes.json()
      const alertsData = await alertsRes.json()

      setTourists(touristsData.tourists)
      setAlerts(alertsData.alerts)
      setLastUpdate(new Date())
      setError("")
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("[v0] Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useRealtimeUpdates((data) => {
    console.log("[v0] Received realtime update:", data)
    fetchData()
  }, true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const activeCount = tourists.filter((t) => t.latitude && t.longitude).length
  const highRiskCount = tourists.filter((t) => t.risk_level === "high" || t.risk_level === "critical").length
  const sosCount = alerts.filter((a) => a.status === "active").length

  const handleResolveAlert = (alertId: number) => {
    // Implement the logic to resolve the alert here
    console.log(`Alert ${alertId} resolved`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Radio className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-4 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="font-bold text-xl">Police Command Center</h1>
              <p className="text-xs opacity-90">Tourist Safety Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
              <Radio className="h-3 w-3 mr-1 animate-pulse" />
              Live
            </Badge>
            <span className="text-xs opacity-75">
              Updated {Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)}s ago
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tourists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Currently being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active SOS Alerts</CardTitle>
              <Bell className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{sosCount}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{highRiskCount}</div>
              <p className="text-xs text-muted-foreground">AI detected anomalies</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="tourists">
              <Users className="h-4 w-4 mr-2" />
              Tourists
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({sosCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Location Map</CardTitle>
                <CardDescription>Real-time GPS tracking of all registered tourists</CardDescription>
              </CardHeader>
              <CardContent>
                <MapView tourists={tourists} alerts={alerts} onSelectTourist={setSelectedTourist} />
              </CardContent>
            </Card>

            {selectedTourist && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Tourist Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedTourist.name || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Device ID:</span>
                      <p className="font-mono text-xs">{selectedTourist.device_id.substring(0, 20)}...</p>
                    </div>
                    {selectedTourist.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedTourist.email}</p>
                      </div>
                    )}
                    {selectedTourist.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{selectedTourist.phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Risk Level:</span>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedTourist.risk_level === "critical" || selectedTourist.risk_level === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedTourist.risk_level || "low"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SOS Alerts:</span>
                      <p className="font-bold text-destructive">{selectedTourist.active_sos_count || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tourists">
            <TouristList tourists={tourists} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsList alerts={alerts} onResolve={handleResolveAlert} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
