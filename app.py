from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime, timedelta
import os
from contextlib import contextmanager

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

DATABASE = 'data/tourist_tracking.db'

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """Initialize database with schema"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create tourists table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tourists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                passport_number TEXT,
                hotel_name TEXT,
                emergency_contact TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        ''')
        
        # Create locations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id INTEGER NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                accuracy REAL,
                speed REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tourist_id) REFERENCES tourists(id)
            )
        ''')
        
        # Create sos_alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sos_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id INTEGER NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                message TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                FOREIGN KEY (tourist_id) REFERENCES tourists(id)
            )
        ''')
        
        # Create safety_scores table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS safety_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id INTEGER NOT NULL,
                risk_level TEXT DEFAULT 'low',
                risk_score REAL DEFAULT 0,
                anomalies TEXT,
                last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tourist_id) REFERENCES tourists(id)
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_locations_tourist ON locations(tourist_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sos_tourist ON sos_alerts(tourist_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_alerts(status)')
        
        conn.commit()

# Initialize database on startup
init_db()

# Tourist Registration Endpoint
@app.route('/api/tourist/register', methods=['POST'])
def register_tourist():
    try:
        data = request.json
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        passport_number = data.get('passportNumber', '').strip()
        hotel_name = data.get('hotelName', '').strip()
        emergency_contact = data.get('emergencyContact', '').strip()
        
        if not name or not phone:
            return jsonify({'error': 'Name and phone are required'}), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tourists (name, phone, passport_number, hotel_name, emergency_contact)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, phone, passport_number, hotel_name, emergency_contact))
            
            tourist_id = cursor.lastrowid
            
            # Initialize safety score
            cursor.execute('''
                INSERT INTO safety_scores (tourist_id, risk_level, risk_score)
                VALUES (?, 'low', 0)
            ''', (tourist_id,))
        
        return jsonify({
            'success': True,
            'touristId': tourist_id,
            'message': 'Registration successful'
        }), 201
    
    except Exception as e:
        print(f"[v0] Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Location Update Endpoint
@app.route('/api/location/update', methods=['POST'])
def update_location():
    try:
        data = request.json
        tourist_id = data.get('touristId')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        accuracy = data.get('accuracy')
        speed = data.get('speed')
        
        if not tourist_id or latitude is None or longitude is None:
            return jsonify({'error': 'Tourist ID, latitude, and longitude are required'}), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO locations (tourist_id, latitude, longitude, accuracy, speed)
                VALUES (?, ?, ?, ?, ?)
            ''', (tourist_id, latitude, longitude, accuracy, speed))
        
        try:
            from ai_safety_engine import analyze_tourist_safety
            analyze_tourist_safety(tourist_id)
        except Exception as e:
            print(f"[v0] AI analysis failed after location update: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Location updated successfully'
        }), 200
    
    except Exception as e:
        print(f"[v0] Location update error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# SOS Alert Endpoint
@app.route('/api/sos/alert', methods=['POST'])
def create_sos_alert():
    try:
        data = request.json
        tourist_id = data.get('touristId')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        message = data.get('message', 'Emergency SOS Alert')
        
        if not tourist_id or latitude is None or longitude is None:
            return jsonify({'error': 'Tourist ID and location are required'}), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO sos_alerts (tourist_id, latitude, longitude, message, status)
                VALUES (?, ?, ?, ?, 'active')
            ''', (tourist_id, latitude, longitude, message))
            
            alert_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'alertId': alert_id,
            'message': 'SOS alert created'
        }), 201
    
    except Exception as e:
        print(f"[v0] SOS alert error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get All Active Tourists with Latest Location
@app.route('/api/police/tourists', methods=['GET'])
def get_all_tourists():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    t.id,
                    t.name,
                    t.phone,
                    t.passport_number,
                    t.hotel_name,
                    t.emergency_contact,
                    l.latitude,
                    l.longitude,
                    l.timestamp as last_seen,
                    s.risk_level,
                    s.risk_score,
                    s.anomalies,
                    (SELECT COUNT(*) FROM sos_alerts WHERE tourist_id = t.id AND status = 'active') as active_sos_count
                FROM tourists t
                LEFT JOIN (
                    SELECT tourist_id, latitude, longitude, timestamp,
                           ROW_NUMBER() OVER (PARTITION BY tourist_id ORDER BY timestamp DESC) as rn
                    FROM locations
                ) l ON t.id = l.tourist_id AND l.rn = 1
                LEFT JOIN safety_scores s ON t.id = s.tourist_id
                WHERE t.is_active = 1
                ORDER BY t.created_at DESC
            ''')
            
            tourists = []
            for row in cursor.fetchall():
                tourists.append({
                    'id': row['id'],
                    'name': row['name'],
                    'phone': row['phone'],
                    'passportNumber': row['passport_number'],
                    'hotelName': row['hotel_name'],
                    'emergencyContact': row['emergency_contact'],
                    'latitude': row['latitude'],
                    'longitude': row['longitude'],
                    'lastSeen': row['last_seen'],
                    'riskLevel': row['risk_level'] or 'low',
                    'riskScore': row['risk_score'] or 0,
                    'anomalies': json.loads(row['anomalies']) if row['anomalies'] else [],
                    'activeSosCount': row['active_sos_count']
                })
        
        return jsonify(tourists), 200
    
    except Exception as e:
        print(f"[v0] Get tourists error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get Active SOS Alerts
@app.route('/api/police/alerts', methods=['GET'])
def get_active_alerts():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    a.id,
                    a.tourist_id,
                    t.name as tourist_name,
                    t.phone,
                    a.latitude,
                    a.longitude,
                    a.message,
                    a.status,
                    a.created_at
                FROM sos_alerts a
                JOIN tourists t ON a.tourist_id = t.id
                WHERE a.status = 'active'
                ORDER BY a.created_at DESC
            ''')
            
            alerts = []
            for row in cursor.fetchall():
                alerts.append({
                    'id': row['id'],
                    'touristId': row['tourist_id'],
                    'touristName': row['tourist_name'],
                    'phone': row['phone'],
                    'latitude': row['latitude'],
                    'longitude': row['longitude'],
                    'message': row['message'],
                    'status': row['status'],
                    'createdAt': row['created_at']
                })
        
        return jsonify(alerts), 200
    
    except Exception as e:
        print(f"[v0] Get alerts error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Resolve SOS Alert
@app.route('/api/police/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE sos_alerts 
                SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (alert_id,))
        
        return jsonify({
            'success': True,
            'message': 'Alert resolved'
        }), 200
    
    except Exception as e:
        print(f"[v0] Resolve alert error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Serve HTML pages
@app.route('/')
def index():
    return render_template('tourist.html')

@app.route('/police')
def police_dashboard():
    return render_template('police.html')

# Map Config Endpoint
@app.route('/api/map/config', methods=['GET'])
def get_map_config():
    """Get map configuration with API key"""
    api_key = os.environ.get('GEOAPIFY_API_KEY', '')
    return jsonify({
        'apiKey': api_key
    }), 200

# AI analysis endpoint
@app.route('/api/ai/analyze/<int:tourist_id>', methods=['POST'])
def analyze_tourist(tourist_id):
    """Trigger AI analysis for a specific tourist"""
    try:
        from ai_safety_engine import analyze_tourist_safety
        
        success = analyze_tourist_safety(tourist_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Analysis complete'
            }), 200
        else:
            return jsonify({
                'error': 'Analysis failed'
            }), 500
    
    except Exception as e:
        print(f"[v0] AI analysis endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/analyze-all', methods=['POST'])
def analyze_all():
    """Trigger AI analysis for all tourists"""
    try:
        from ai_safety_engine import analyze_all_tourists
        
        success = analyze_all_tourists()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'All tourists analyzed'
            }), 200
        else:
            return jsonify({
                'error': 'Analysis failed'
            }), 500
    
    except Exception as e:
        print(f"[v0] AI analysis all endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
