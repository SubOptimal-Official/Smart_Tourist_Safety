import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()

    const alerts = await db.all(`
      SELECT 
        s.*,
        t.device_id,
        t.name,
        t.email,
        t.phone
      FROM sos_alerts s
      JOIN tourists t ON s.tourist_id = t.id
      WHERE s.status = 'active'
      ORDER BY s.timestamp DESC
    `)

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("[v0] Error fetching alerts:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { alert_id, status } = await request.json()

    if (!alert_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()

    const resolved_at = status === "resolved" ? new Date().toISOString() : null

    await db.run("UPDATE sos_alerts SET status = ?, resolved_at = ? WHERE id = ?", [status, resolved_at, alert_id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating alert:", error)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }
}
