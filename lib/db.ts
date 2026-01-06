import { open, type Database } from "sqlite"
import sqlite3 from "sqlite3"
import path from "path"
import fs from "fs"

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    const dbDir = path.join(process.cwd(), "data")
    const dbPath = path.join(dbDir, "tracking.db")

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log("[v0] Created data directory:", dbDir)
    }

    console.log("[v0] Opening database at:", dbPath)

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await initializeDatabase(db)
  }
  return db
}

async function initializeDatabase(database: Database) {
  // Check if tables exist
  const tableExists = await database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tourists'")

  if (!tableExists) {
    console.log("[v0] Initializing database schema...")

    // Create tourists table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS tourists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL UNIQUE,
        name TEXT,
        email TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create locations table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tourist_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE CASCADE
      );
    `)

    // Create sos_alerts table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tourist_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp DATETIME NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE CASCADE
      );
    `)

    // Create safety_scores table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS safety_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tourist_id INTEGER NOT NULL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        risk_score REAL NOT NULL,
        anomaly_type TEXT,
        details TEXT,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE CASCADE
      );
    `)

    // Create indexes
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations(tourist_id);
      CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sos_alerts_tourist_id ON sos_alerts(tourist_id);
      CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
      CREATE INDEX IF NOT EXISTS idx_safety_scores_tourist_id ON safety_scores(tourist_id);
      CREATE INDEX IF NOT EXISTS idx_safety_scores_risk_level ON safety_scores(risk_level);
    `)

    console.log("[v0] Database schema initialized successfully")
  }
}

export interface Tourist {
  id: number
  device_id: string
  name?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Location {
  id: number
  tourist_id: number
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: string
  created_at: string
}

export interface SOSAlert {
  id: number
  tourist_id: number
  latitude: number
  longitude: number
  timestamp: string
  status: "active" | "resolved"
  resolved_at?: string
  created_at: string
}

export interface SafetyScore {
  id: number
  tourist_id: number
  risk_level: "low" | "medium" | "high" | "critical"
  risk_score: number
  anomaly_type?: string
  details?: string
  timestamp: string
  created_at: string
}
