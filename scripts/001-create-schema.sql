-- Create tourists table to store device and user information
CREATE TABLE IF NOT EXISTS tourists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create locations table to store GPS data
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

-- Create sos_alerts table for emergency alerts
CREATE TABLE IF NOT EXISTS sos_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tourist_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp DATETIME NOT NULL,
  status TEXT DEFAULT 'active',
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE CASCADE
);

-- Create safety_scores table for AI risk scoring
CREATE TABLE IF NOT EXISTS safety_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tourist_id INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score REAL NOT NULL,
  anomaly_type TEXT,
  details TEXT,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_tourist_id ON locations(tourist_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_safety_scores_tourist_id ON safety_scores(tourist_id);
