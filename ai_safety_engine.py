import sqlite3
import json
import math
from datetime import datetime, timedelta
from contextlib import contextmanager

DATABASE = 'data/tourist_tracking.db'

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

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in meters using Haversine formula"""
    R = 6371000  # Earth radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def analyze_tourist_safety(tourist_id):
    """Analyze safety for a specific tourist using rule-based AI"""
    anomalies = []
    risk_score = 0
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get recent location history (last 24 hours)
            cursor.execute('''
                SELECT latitude, longitude, speed, timestamp
                FROM locations
                WHERE tourist_id = ? 
                AND timestamp > datetime('now', '-24 hours')
                ORDER BY timestamp DESC
                LIMIT 100
            ''', (tourist_id,))
            
            locations = cursor.fetchall()
            
            if len(locations) < 2:
                # Not enough data to analyze
                return update_safety_score(tourist_id, 'low', 0, [])
            
            # Get active SOS alerts count
            cursor.execute('''
                SELECT COUNT(*) as sos_count
                FROM sos_alerts
                WHERE tourist_id = ? AND status = 'active'
            ''', (tourist_id,))
            
            sos_count = cursor.fetchone()['sos_count']
            
            # Analysis 1: Check for active SOS alerts
            if sos_count > 0:
                anomalies.append('Active SOS Alert')
                risk_score += 50
            
            # Analysis 2: Check for sudden stops (stationary for too long)
            recent_locations = locations[:10]  # Last 10 locations
            if len(recent_locations) >= 3:
                is_stationary = True
                first_loc = recent_locations[0]
                
                for loc in recent_locations[1:]:
                    distance = calculate_distance(
                        first_loc['latitude'], first_loc['longitude'],
                        loc['latitude'], loc['longitude']
                    )
                    if distance > 100:  # More than 100 meters movement
                        is_stationary = False
                        break
                
                if is_stationary:
                    # Check if stationary for more than 2 hours
                    time_diff = datetime.fromisoformat(recent_locations[0]['timestamp']) - \
                               datetime.fromisoformat(recent_locations[-1]['timestamp'])
                    
                    if time_diff.total_seconds() > 7200:  # 2 hours
                        anomalies.append('Stationary for extended period')
                        risk_score += 15
            
            # Analysis 3: Check for unusual speed patterns
            speeds = [loc['speed'] for loc in locations if loc['speed'] is not None]
            if speeds:
                avg_speed = sum(speeds) / len(speeds)
                max_speed = max(speeds)
                
                # Check for unusually high speed (over 150 km/h)
                if max_speed and max_speed > 41.67:  # 150 km/h in m/s
                    anomalies.append('Unusually high speed detected')
                    risk_score += 20
            
            # Analysis 4: Check for erratic movement (frequent direction changes)
            if len(locations) >= 5:
                direction_changes = 0
                for i in range(len(locations) - 2):
                    loc1 = locations[i]
                    loc2 = locations[i + 1]
                    loc3 = locations[i + 2]
                    
                    # Calculate bearing between points
                    angle1 = calculate_bearing(
                        loc1['latitude'], loc1['longitude'],
                        loc2['latitude'], loc2['longitude']
                    )
                    angle2 = calculate_bearing(
                        loc2['latitude'], loc2['longitude'],
                        loc3['latitude'], loc3['longitude']
                    )
                    
                    # Check for significant direction change (>90 degrees)
                    angle_diff = abs(angle1 - angle2)
                    if angle_diff > 90 and angle_diff < 270:
                        direction_changes += 1
                
                if direction_changes >= 3:
                    anomalies.append('Erratic movement pattern')
                    risk_score += 10
            
            # Analysis 5: Check for route deviation (moved far from last known area)
            if len(locations) >= 20:
                recent_area = locations[:5]
                older_area = locations[-10:]
                
                # Calculate centroid of recent area
                recent_lat = sum([loc['latitude'] for loc in recent_area]) / len(recent_area)
                recent_lon = sum([loc['longitude'] for loc in recent_area]) / len(recent_area)
                
                # Calculate centroid of older area
                older_lat = sum([loc['latitude'] for loc in older_area]) / len(older_area)
                older_lon = sum([loc['longitude'] for loc in older_area]) / len(older_area)
                
                # Check distance between centroids
                deviation_distance = calculate_distance(recent_lat, recent_lon, older_lat, older_lon)
                
                if deviation_distance > 50000:  # More than 50km deviation
                    anomalies.append('Significant route deviation')
                    risk_score += 15
            
            # Analysis 6: Check for no recent updates (lost contact)
            latest_location = locations[0]
            time_since_update = datetime.now() - datetime.fromisoformat(latest_location['timestamp'])
            
            if time_since_update.total_seconds() > 3600:  # More than 1 hour
                anomalies.append('No recent location updates')
                risk_score += 25
            elif time_since_update.total_seconds() > 1800:  # More than 30 minutes
                anomalies.append('Delayed location updates')
                risk_score += 10
            
            # Determine risk level based on score
            if risk_score >= 50:
                risk_level = 'critical'
            elif risk_score >= 30:
                risk_level = 'high'
            elif risk_score >= 15:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            # Update safety score in database
            return update_safety_score(tourist_id, risk_level, risk_score, anomalies)
    
    except Exception as e:
        print(f"[v0] AI Analysis error for tourist {tourist_id}: {str(e)}")
        return False

def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calculate bearing between two coordinates in degrees"""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360

def update_safety_score(tourist_id, risk_level, risk_score, anomalies):
    """Update safety score in database"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if safety score exists
            cursor.execute('SELECT id FROM safety_scores WHERE tourist_id = ?', (tourist_id,))
            existing = cursor.fetchone()
            
            anomalies_json = json.dumps(anomalies)
            
            if existing:
                cursor.execute('''
                    UPDATE safety_scores 
                    SET risk_level = ?, risk_score = ?, anomalies = ?, last_calculated = CURRENT_TIMESTAMP
                    WHERE tourist_id = ?
                ''', (risk_level, risk_score, anomalies_json, tourist_id))
            else:
                cursor.execute('''
                    INSERT INTO safety_scores (tourist_id, risk_level, risk_score, anomalies)
                    VALUES (?, ?, ?, ?)
                ''', (tourist_id, risk_level, risk_score, anomalies_json))
            
            return True
    
    except Exception as e:
        print(f"[v0] Update safety score error: {str(e)}")
        return False

def analyze_all_tourists():
    """Analyze safety for all active tourists"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM tourists WHERE is_active = 1')
            tourists = cursor.fetchall()
            
            for tourist in tourists:
                analyze_tourist_safety(tourist['id'])
                print(f"[v0] Analyzed tourist {tourist['id']}")
            
            print(f"[v0] Analyzed {len(tourists)} tourists")
            return True
    
    except Exception as e:
        print(f"[v0] Analyze all tourists error: {str(e)}")
        return False

if __name__ == '__main__':
    print("[v0] Starting AI Safety Analysis...")
    analyze_all_tourists()
    print("[v0] Analysis complete")
