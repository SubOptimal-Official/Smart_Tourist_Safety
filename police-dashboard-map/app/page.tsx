"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, MapPin, Phone } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Tourist Safety</h1>
          </div>
          <Link href="/police-dashboard">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Shield className="w-4 h-4" />
              Police Dashboard
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">Your Safety is Our Priority</Badge>
          <h2 className="text-5xl font-bold mb-6 text-balance">Stay Safe While Exploring</h2>
          <p className="text-xl text-gray-600 mb-8 text-pretty">
            Emergency assistance at your fingertips. Connect with local authorities instantly when you need help.
          </p>
          <Link href="/tourist">
            <Button size="lg" className="text-lg px-8 py-6 gap-3">
              <AlertTriangle className="w-5 h-5" />
              Access Tourist Portal
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Emergency SOS</h3>
            <p className="text-gray-600">
              Send instant alerts to local police with your exact location when you need help.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Location Tracking</h3>
            <p className="text-gray-600">Real-time GPS tracking ensures authorities know exactly where you are.</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
            <p className="text-gray-600">Round-the-clock monitoring and response from local police authorities.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
