import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const device_id = searchParams.get("device_id")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    if (!device_id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    const db = await getDb()

    const tourist = await db.get("SELECT * FROM tourists WHERE device_id = ?", device_id)

    if (!tourist) {
      return NextResponse.json({ error: "Tourist not found" }, { status: 404 })
    }

    const locations = await db.all("SELECT * FROM locations WHERE tourist_id = ? ORDER BY timestamp DESC LIMIT ?", [
      tourist.id,
      limit,
    ])

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("[v0] Error fetching location history:", error)
    return NextResponse.json({ error: "Failed to fetch location history" }, { status: 500 })
  }
}
