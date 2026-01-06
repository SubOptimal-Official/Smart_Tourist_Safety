"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, MapPin, Shield, CheckCircle2 } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

export function TouristApp() {
  const [deviceId, setDeviceId] = useState<string>("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isTracking, setIsTracking] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [error, setError] = useState<string>("")
  const [sosActive, setSosActive] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied">("pending")
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Generate or retrieve device ID
    let id = localStorage.getItem("tourist_device_id")
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("tourist_device_id", id)
    }
    setDeviceId(id)

    // Check if already registered
    const registered = localStorage.getItem("tourist_registered")
    if (registered === "true") {
      setIsRegistered(true)
      checkLocationPermission()
    }
  }, [])

  const checkLocationPermission = async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser")
      setPermissionStatus("denied")
      return
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" })
      setPermissionStatus(result.state === "granted" ? "granted" : "pending")

      result.addEventListener("change", () => {
        setPermissionStatus(result.state === "granted" ? "granted" : "denied")
      })
    } catch (err) {
      console.error("[v0] Permission check error:", err)
    }
  }

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    try {
      console.log("[v0] Attempting registration:", { device_id: deviceId, name, email, phone })

      const response = await fetch("/api/tourist/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, name, email, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Registration failed:", data)
        throw new Error(data.details || data.error || "Registration failed")
      }

      console.log("[v0] Registration successful:", data)

      localStorage.setItem("tourist_registered", "true")
      localStorage.setItem("tourist_name", name)
      setIsRegistered(true)
      setError("")
      checkLocationPermission()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register. Please try again."
      setError(errorMessage)
      console.error("[v0] Registration error:", err)
    }
  }

  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }

    const successCallback = async (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      }

      setLocation(locationData)
      setPermissionStatus("granted")

      // Send location to server
      try {
        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: deviceId,
            ...locationData,
          }),
        })
      } catch (err) {
        console.error("[v0] Location update error:", err)
      }
    }

    const errorCallback = (error: GeolocationPositionError) => {
      setPermissionStatus("denied")
      setError(`Location error: ${error.message}`)
      console.error("[v0] Geolocation error:", error)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, options)
    setIsTracking(true)
    setError("")
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  const handleSOS = async () => {
    if (!location) {
      setError("Location not available. Please enable location tracking.")
      return
    }

    setSosActive(true)

    try {
      const response = await fetch("/api/sos/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("SOS alert failed")

      setTimeout(() => setSosActive(false), 3000)
    } catch (err) {
      setError("Failed to send SOS alert")
      setSosActive(false)
      console.error("[v0] SOS error:", err)
    }
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-balance">Tourist Safety Tracker</CardTitle>
            <CardDescription>Register to start location tracking for your safety</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleRegister} className="w-full" size="lg">
              Register & Continue
            </Button>

            <p className="text-xs text-center text-muted-foreground">Device ID: {deviceId.substring(0, 20)}...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <div className="flex-1">
            <h1 className="font-semibold text-lg">SafeTravel</h1>
            <p className="text-xs opacity-90">{localStorage.getItem("tourist_name")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionStatus === "denied" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Location permission denied. Please enable location access in your browser settings.
                </AlertDescription>
              </Alert>
            )}

            {permissionStatus === "granted" && location && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="font-mono">{location.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="font-mono">{location.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span>{location.accuracy.toFixed(1)}m</span>
                </div>
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Tracking active</span>
                </div>
              </div>
            )}

            {!isTracking && permissionStatus !== "denied" && (
              <Button onClick={startTracking} className="w-full" size="lg">
                <MapPin className="mr-2 h-4 w-4" />
                Start Location Tracking
              </Button>
            )}

            {isTracking && (
              <Button onClick={stopTracking} variant="outline" className="w-full bg-transparent" size="lg">
                Stop Tracking
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Emergency SOS
            </CardTitle>
            <CardDescription>Send your location to local police immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSOS}
              disabled={!location || sosActive}
              variant="destructive"
              size="lg"
              className="w-full h-20 text-lg font-bold"
            >
              {sosActive ? "SOS Alert Sent!" : "SEND SOS ALERT"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Your location is being monitored for your safety</p>
          <p>This app works only on HTTPS connections</p>
        </div>
      </div>
    </div>
  )
}
