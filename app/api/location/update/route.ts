import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { AISafetyEngine } from "@/lib/ai-safety-engine"
import { wsManager } from "@/lib/websocket-server"

export async function POST(request: NextRequest) {
  try {
    const { device_id, latitude, longitude, accuracy, timestamp } = await request.json()

    if (!device_id || !latitude || !longitude || !timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const now = new Date()
    const locationTime = new Date(timestamp)
    const timeDiff = now.getTime() - locationTime.getTime()

    if (timeDiff > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Location data is too old" }, { status: 400 })
    }

    const db = await getDb()

    const tourist = await db.get("SELECT * FROM tourists WHERE device_id = ?", device_id)

    if (!tourist) {
      return NextResponse.json({ error: "Tourist not found" }, { status: 404 })
    }

    await db.run(
      "INSERT INTO locations (tourist_id, latitude, longitude, accuracy, timestamp) VALUES (?, ?, ?, ?, ?)",
      [tourist.id, latitude, longitude, accuracy, timestamp],
    )

    wsManager.broadcast({
      type: "location_update",
      tourist_id: tourist.id,
      device_id,
      latitude,
      longitude,
      timestamp,
    })

    const engine = new AISafetyEngine()
    engine.processTouristSafety(tourist.id).catch((err) => {
      console.error("[v0] Background AI analysis failed:", err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}
