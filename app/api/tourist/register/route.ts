import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { device_id, name, email, phone } = await request.json()

    console.log("[v0] Registration request:", { device_id, name, email, phone })

    if (!device_id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    let db
    try {
      db = await getDb()
      console.log("[v0] Database connection established")
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    // Check if tourist already exists
    const existing = await db.get("SELECT * FROM tourists WHERE device_id = ?", device_id)

    if (existing) {
      console.log("[v0] Tourist already registered:", existing)
      return NextResponse.json({ tourist: existing })
    }

    // Create new tourist
    const result = await db.run("INSERT INTO tourists (device_id, name, email, phone) VALUES (?, ?, ?, ?)", [
      device_id,
      name,
      email,
      phone,
    ])

    const tourist = await db.get("SELECT * FROM tourists WHERE id = ?", result.lastID)

    console.log("[v0] Tourist registered successfully:", tourist)

    return NextResponse.json({ tourist })
  } catch (error) {
    console.error("[v0] Error registering tourist:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Failed to register tourist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
