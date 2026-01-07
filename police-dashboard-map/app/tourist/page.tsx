"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin, Phone, CheckCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export default function TouristPage() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSendingSOS, setIsSendingSOS] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const { toast } = useToast()

  const getLocation = () => {
    setIsLoadingLocation(true)

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      })
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
        setIsLoadingLocation(false)
        toast({
          title: "Location acquired",
          description: "Your location has been detected successfully.",
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        toast({
          title: "Location error",
          description: "Unable to get your location. Please enable location services.",
          variant: "destructive",
        })
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const sendSOS = async () => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please allow location access before sending SOS.",
        variant: "destructive",
      })
      return
    }

    setIsSendingSOS(true)

    try {
      const response = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      })

      if (response.ok) {
        setSosActive(true)
        toast({
          title: "SOS Alert Sent!",
          description: "Police have been notified of your location. Help is on the way.",
        })
      } else {
        throw new Error("Failed to send SOS")
      }
    } catch (error) {
      console.error("Error sending SOS:", error)
      toast({
        title: "SOS failed",
        description: "Unable to send alert. Please try again or call emergency services.",
        variant: "destructive",
      })
    } finally {
      setIsSendingSOS(false)
    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          {sosActive && <Badge className="bg-red-600 text-white">SOS Active</Badge>}
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-balance">Tourist Safety Portal</h1>
            <p className="text-lg text-gray-600 text-pretty">Emergency assistance is just one tap away</p>
          </div>

          {/* Location Status Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Your Location</h3>
                {isLoadingLocation ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting location...</span>
                  </div>
                ) : location ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Latitude: {location.latitude.toFixed(6)}</p>
                    <p className="text-sm text-gray-600">Longitude: {location.longitude.toFixed(6)}</p>
                    <p className="text-sm text-gray-500">Accuracy: ±{Math.round(location.accuracy)}m</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Location not detected</p>
                    <Button size="sm" variant="outline" onClick={getLocation}>
                      Retry Location
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* SOS Button */}
          <Card className="p-8 bg-gradient-to-br from-red-500 to-orange-500 text-white border-none mb-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Emergency SOS</h2>
              <p className="mb-6 opacity-90">
                Press this button if you need immediate assistance. Your location will be shared with local police.
              </p>
              <Button
                size="lg"
                onClick={sendSOS}
                disabled={!location || isSendingSOS || sosActive}
                className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-6 gap-3 font-semibold"
              >
                {isSendingSOS ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending SOS...
                  </>
                ) : sosActive ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    SOS Sent - Help is Coming
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Send SOS Alert
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Emergency Contacts */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Emergency Contacts</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Police: 911 (or local emergency number)</p>
                  <p>Embassy: Contact your country's embassy</p>
                  <p>Tourist Helpline: Check local tourist information</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
