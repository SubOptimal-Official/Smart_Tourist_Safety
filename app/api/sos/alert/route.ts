import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { wsManager } from "@/lib/websocket-server"

export async function POST(request: NextRequest) {
  try {
    const { device_id, latitude, longitude, timestamp } = await request.json()

    if (!device_id || !latitude || !longitude || !timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()

    const tourist = await db.get("SELECT * FROM tourists WHERE device_id = ?", device_id)

    if (!tourist) {
      return NextResponse.json({ error: "Tourist not found" }, { status: 404 })
    }

    const result = await db.run(
      "INSERT INTO sos_alerts (tourist_id, latitude, longitude, timestamp, status) VALUES (?, ?, ?, ?, ?)",
      [tourist.id, latitude, longitude, timestamp, "active"],
    )

    wsManager.broadcast({
      type: "sos_alert",
      tourist_id: tourist.id,
      device_id,
      name: tourist.name,
      latitude,
      longitude,
      timestamp,
    })

    return NextResponse.json({
      success: true,
      alert_id: result.lastID,
    })
  } catch (error) {
    console.error("[v0] Error creating SOS alert:", error)
    return NextResponse.json({ error: "Failed to create SOS alert" }, { status: 500 })
  }
}
