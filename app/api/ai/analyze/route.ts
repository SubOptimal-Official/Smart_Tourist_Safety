import { type NextRequest, NextResponse } from "next/server"
import { AISafetyEngine } from "@/lib/ai-safety-engine"

export async function POST(request: NextRequest) {
  try {
    const { tourist_id } = await request.json()

    if (!tourist_id) {
      return NextResponse.json({ error: "Tourist ID is required" }, { status: 400 })
    }

    const engine = new AISafetyEngine()
    await engine.processTouristSafety(tourist_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] AI analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze tourist safety" }, { status: 500 })
  }
}
