import { type NextRequest, NextResponse } from "next/server"
import { AISafetyEngine } from "@/lib/ai-safety-engine"

export async function POST(request: NextRequest) {
  try {
    const engine = new AISafetyEngine()
    await engine.processAllTourists()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bulk AI analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze all tourists" }, { status: 500 })
  }
}
