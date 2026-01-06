import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()

    // Get all tourists with their latest location
    const tourists = await db.all(`
      SELECT 
        t.*,
        l.latitude,
        l.longitude,
        l.accuracy,
        l.timestamp as last_location_time,
        (SELECT COUNT(*) FROM sos_alerts WHERE tourist_id = t.id AND status = 'active') as active_sos_count,
        (SELECT risk_level FROM safety_scores WHERE tourist_id = t.id ORDER BY timestamp DESC LIMIT 1) as risk_level,
        (SELECT risk_score FROM safety_scores WHERE tourist_id = t.id ORDER BY timestamp DESC LIMIT 1) as risk_score
      FROM tourists t
      LEFT JOIN (
        SELECT tourist_id, latitude, longitude, accuracy, timestamp,
               ROW_NUMBER() OVER (PARTITION BY tourist_id ORDER BY timestamp DESC) as rn
        FROM locations
      ) l ON t.id = l.tourist_id AND l.rn = 1
      ORDER BY active_sos_count DESC, risk_score DESC
    `)

    return NextResponse.json({ tourists })
  } catch (error) {
    console.error("[v0] Error fetching tourists:", error)
    return NextResponse.json({ error: "Failed to fetch tourists" }, { status: 500 })
  }
}
