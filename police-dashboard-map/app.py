from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tourist_safety.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class Tourist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SOSAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tourist_id = db.Column(db.Integer, db.ForeignKey('tourist.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # 'emergency_sos', 'location_tracking', '24_7_support'
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # active, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tourist = db.relationship('Tourist', backref='alerts')

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tourist')
def tourist():
    return render_template('tourist.html')

@app.route('/police')
def police():
    return render_template('police.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def register_tourist():
    data = request.json
    
    # Check if email already exists
    existing_tourist = Tourist.query.filter_by(email=data['email']).first()
    if existing_tourist:
        return jsonify({'success': False, 'error': 'Email already registered'}), 400
    
    tourist = Tourist(
        name=data['name'],
        email=data['email'],
        phone=data['phone'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(tourist)
    db.session.commit()
    session['tourist_id'] = tourist.id
    session['tourist_name'] = tourist.name
    return jsonify({'success': True, 'tourist_id': tourist.id})

@app.route('/api/login', methods=['POST'])
def login_tourist():
    data = request.json
    tourist = Tourist.query.filter_by(email=data['email']).first()
    
    if tourist and check_password_hash(tourist.password_hash, data['password']):
        session['tourist_id'] = tourist.id
        session['tourist_name'] = tourist.name
        session['tourist_phone'] = tourist.phone
        return jsonify({
            'success': True,
            'tourist': {
                'id': tourist.id,
                'name': tourist.name,
                'phone': tourist.phone,
                'email': tourist.email
            }
        })
    else:
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/sos', methods=['POST'])
def send_sos():
    data = request.json
    tourist_id = session.get('tourist_id')
    
    if not tourist_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    alert = SOSAlert(
        tourist_id=tourist_id,
        alert_type=data.get('alert_type', 'emergency_sos'),
        latitude=data['latitude'],
        longitude=data['longitude'],
        message=data.get('message', '')
    )
    db.session.add(alert)
    db.session.commit()
    
    return jsonify({'success': True, 'alert_id': alert.id})

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    status = request.args.get('status', 'active')
    alerts = SOSAlert.query.filter_by(status=status).order_by(SOSAlert.created_at.desc()).all()
    
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            'id': alert.id,
            'tourist_name': alert.tourist.name,
            'tourist_phone': alert.tourist.phone,
            'tourist_email': alert.tourist.email,
            'alert_type': alert.alert_type,
            'latitude': alert.latitude,
            'longitude': alert.longitude,
            'message': alert.message,
            'status': alert.status,
            'created_at': alert.created_at.isoformat()
        })
    
    return jsonify(alerts_data)

@app.route('/api/alerts/stats', methods=['GET'])
def get_alert_stats():
    active_alerts = SOSAlert.query.filter_by(status='active').count()
    emergency_sos = SOSAlert.query.filter_by(status='active', alert_type='emergency_sos').count()
    
    return jsonify({
        'tourists_at_risk': active_alerts,
        'emergency_sos_count': emergency_sos
    })

@app.route('/api/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    alert = SOSAlert.query.get_or_404(alert_id)
    alert.status = 'resolved'
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/get-location', methods=['GET'])
def get_location():
    """Get user location using Geoapify Geolocation API"""
    api_key = os.environ.get('GEOAPIFY_API_KEY')
    
    if not api_key:
        return jsonify({
            'success': False, 
            'error': 'API key not configured',
            'fallback': {'latitude': 40.7580, 'longitude': -73.9855}
        })
    
    try:
        import requests
        url = f'https://api.geoapify.com/v1/ipinfo?apiKey={api_key}'
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            location = data.get('location', {})
            return jsonify({
                'success': True,
                'latitude': location.get('latitude'),
                'longitude': location.get('longitude'),
                'city': data.get('city', {}).get('name', 'Unknown'),
                'country': data.get('country', {}).get('name', 'Unknown')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to get location',
                'fallback': {'latitude': 40.7580, 'longitude': -73.9855}
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback': {'latitude': 40.7580, 'longitude': -73.9855}
        })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
