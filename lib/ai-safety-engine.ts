import { getDb, type Location } from "./db"

interface MovementAnalysis {
  suddenStop: boolean
  unusualSpeed: boolean
  routeDeviation: boolean
  frequentSOS: boolean
  stationaryTooLong: boolean
}

interface RiskAssessment {
  risk_level: "low" | "medium" | "high" | "critical"
  risk_score: number
  anomaly_type?: string
  details?: string
}

export class AISafetyEngine {
  // Thresholds for anomaly detection
  private readonly SPEED_THRESHOLD_KMH = 150 // Unrealistic speed
  private readonly STATIONARY_THRESHOLD_MINUTES = 120 // 2 hours
  private readonly DEVIATION_THRESHOLD_METERS = 5000 // 5km from expected route
  private readonly FREQUENT_SOS_COUNT = 2 // Multiple SOS in short time
  private readonly SUDDEN_STOP_SPEED_DROP = 0.9 // 90% speed drop

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Calculate speed between two location points
   */
  private calculateSpeed(loc1: Location, loc2: Location): number {
    const distance = this.calculateDistance(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude)

    const time1 = new Date(loc1.timestamp).getTime()
    const time2 = new Date(loc2.timestamp).getTime()
    const timeDiffHours = Math.abs(time2 - time1) / (1000 * 60 * 60)

    if (timeDiffHours === 0) return 0

    return distance / 1000 / timeDiffHours // km/h
  }

  /**
   * Analyze movement patterns for a specific tourist
   */
  async analyzeMovement(touristId: number): Promise<MovementAnalysis> {
    const db = await getDb()

    // Get recent locations (last 24 hours)
    const locations = await db.all<Location[]>(
      `SELECT * FROM locations 
       WHERE tourist_id = ? 
       AND timestamp > datetime('now', '-24 hours')
       ORDER BY timestamp DESC 
       LIMIT 50`,
      touristId,
    )

    if (locations.length < 2) {
      return {
        suddenStop: false,
        unusualSpeed: false,
        routeDeviation: false,
        frequentSOS: false,
        stationaryTooLong: false,
      }
    }

    // Check for sudden stop
    const suddenStop = this.detectSuddenStop(locations)

    // Check for unusual speed
    const unusualSpeed = this.detectUnusualSpeed(locations)

    // Check for stationary too long
    const stationaryTooLong = this.detectStationaryTooLong(locations)

    // Check for frequent SOS
    const frequentSOS = await this.detectFrequentSOS(touristId)

    // Check for route deviation (simplified - would need expected routes in production)
    const routeDeviation = this.detectRouteDeviation(locations)

    return {
      suddenStop,
      unusualSpeed,
      routeDeviation,
      frequentSOS,
      stationaryTooLong,
    }
  }

  /**
   * Detect if tourist suddenly stopped moving
   */
  private detectSuddenStop(locations: Location[]): boolean {
    if (locations.length < 3) return false

    const recent = locations.slice(0, 3)
    const speed1 = this.calculateSpeed(recent[2], recent[1])
    const speed2 = this.calculateSpeed(recent[1], recent[0])

    // If speed drops by more than 90% suddenly
    if (speed1 > 10 && speed2 < speed1 * (1 - this.SUDDEN_STOP_SPEED_DROP)) {
      return true
    }

    return false
  }

  /**
   * Detect unrealistic or dangerous speeds
   */
  private detectUnusualSpeed(locations: Location[]): boolean {
    for (let i = 0; i < locations.length - 1; i++) {
      const speed = this.calculateSpeed(locations[i + 1], locations[i])
      if (speed > this.SPEED_THRESHOLD_KMH) {
        return true
      }
    }
    return false
  }

  /**
   * Detect if tourist has been stationary for too long
   */
  private detectStationaryTooLong(locations: Location[]): boolean {
    if (locations.length < 5) return false

    const recent = locations.slice(0, 5)
    const firstLoc = recent[recent.length - 1]
    const lastLoc = recent[0]

    const distance = this.calculateDistance(firstLoc.latitude, firstLoc.longitude, lastLoc.latitude, lastLoc.longitude)

    const timeDiff = (new Date(lastLoc.timestamp).getTime() - new Date(firstLoc.timestamp).getTime()) / (1000 * 60) // minutes

    // If moved less than 100m in 2+ hours
    if (distance < 100 && timeDiff > this.STATIONARY_THRESHOLD_MINUTES) {
      return true
    }

    return false
  }

  /**
   * Detect frequent SOS alerts
   */
  private async detectFrequentSOS(touristId: number): Promise<boolean> {
    const db = await getDb()

    const sosCount = await db.get(
      `SELECT COUNT(*) as count 
       FROM sos_alerts 
       WHERE tourist_id = ? 
       AND timestamp > datetime('now', '-6 hours')`,
      touristId,
    )

    return (sosCount?.count || 0) >= this.FREQUENT_SOS_COUNT
  }

  /**
   * Detect significant route deviation
   */
  private detectRouteDeviation(locations: Location[]): boolean {
    if (locations.length < 10) return false

    // Calculate average position
    const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length
    const avgLon = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length

    // Check if any recent location is too far from average
    const recentLocs = locations.slice(0, 3)
    for (const loc of recentLocs) {
      const distance = this.calculateDistance(avgLat, avgLon, loc.latitude, loc.longitude)
      if (distance > this.DEVIATION_THRESHOLD_METERS) {
        return true
      }
    }

    return false
  }

  /**
   * Calculate overall risk score and level
   */
  calculateRiskScore(analysis: MovementAnalysis): RiskAssessment {
    let score = 0
    const anomalies: string[] = []

    if (analysis.frequentSOS) {
      score += 40
      anomalies.push("Frequent SOS alerts")
    }

    if (analysis.suddenStop) {
      score += 25
      anomalies.push("Sudden stop detected")
    }

    if (analysis.unusualSpeed) {
      score += 20
      anomalies.push("Unusual speed pattern")
    }

    if (analysis.stationaryTooLong) {
      score += 30
      anomalies.push("Stationary too long")
    }

    if (analysis.routeDeviation) {
      score += 15
      anomalies.push("Route deviation")
    }

    let risk_level: "low" | "medium" | "high" | "critical"
    if (score >= 60) {
      risk_level = "critical"
    } else if (score >= 40) {
      risk_level = "high"
    } else if (score >= 20) {
      risk_level = "medium"
    } else {
      risk_level = "low"
    }

    return {
      risk_level,
      risk_score: score,
      anomaly_type: anomalies.length > 0 ? anomalies[0] : undefined,
      details: anomalies.join(", ") || "No anomalies detected",
    }
  }

  /**
   * Process safety analysis for a tourist and store results
   */
  async processTouristSafety(touristId: number): Promise<void> {
    const analysis = await this.analyzeMovement(touristId)
    const riskAssessment = this.calculateRiskScore(analysis)

    const db = await getDb()

    await db.run(
      `INSERT INTO safety_scores (tourist_id, risk_level, risk_score, anomaly_type, details, timestamp)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        touristId,
        riskAssessment.risk_level,
        riskAssessment.risk_score,
        riskAssessment.anomaly_type,
        riskAssessment.details,
      ],
    )

    console.log(`[v0] Safety analysis for tourist ${touristId}:`, riskAssessment)
  }

  /**
   * Process all active tourists
   */
  async processAllTourists(): Promise<void> {
    const db = await getDb()

    const tourists = await db.all(`
      SELECT DISTINCT t.id 
      FROM tourists t
      JOIN locations l ON t.id = l.tourist_id
      WHERE l.timestamp > datetime('now', '-24 hours')
    `)

    for (const tourist of tourists) {
      await this.processTouristSafety(tourist.id)
    }

    console.log(`[v0] Processed safety analysis for ${tourists.length} tourists`)
  }
}
