# Tourist Safety App

A Flask-based web application for tourist safety with SOS alerts and police monitoring dashboard.

## Features

- **Login & Registration**: Secure authentication with password hashing for tourists
- **Tourist Portal**: Three types of alerts - Emergency SOS, Location Tracking, and 24/7 Support
- **Police Dashboard**: Real-time map showing all active alerts with location pins and statistics
- **Location Tracking**: Automatic GPS location capture for all alert types
- **Alert Highlighting**: Emergency SOS alerts are highlighted with pulsing red markers
- **Tourists at Risk Counter**: Dashboard displays total number of active alerts
- **SQLite Database**: Stores tourist credentials and alert information

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application (database will be created automatically):
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

### Tourist Portal
1. Visit the home page and click "Tourist Portal"
2. Register with your name, email, contact number, and password (or login if already registered)
3. Allow location access when prompted
4. Choose one of three alert types:
   - **Emergency SOS**: For immediate distress situations (highlighted in red on police dashboard)
   - **Location Tracking**: Share your location for safety monitoring
   - **24/7 Support**: Request general assistance from support team
5. Your location will be sent to the police dashboard instantly

### Police Dashboard
1. Visit `/police` to access the police dashboard
2. View statistics: Total tourists at risk and emergency SOS count
3. See all active alerts on the interactive map with color-coded pins
4. Emergency SOS alerts pulse red and are highlighted in the alerts list
5. Click on markers or "View on Map" to see alert details
6. Resolve alerts when assistance has been provided
7. Dashboard auto-refreshes every 30 seconds

## Technologies

- **Backend**: Flask, SQLAlchemy, Werkzeug (password hashing)
- **Frontend**: HTML, CSS, JavaScript
- **Mapping**: Leaflet.js with OpenStreetMap
- **Database**: SQLite
- **Authentication**: Session-based with secure password hashing

## API Endpoints

- `POST /api/register` - Register a new tourist with credentials
- `POST /api/login` - Login with email and password
- `POST /api/logout` - Logout and clear session
- `POST /api/sos` - Send an alert (emergency_sos, location_tracking, or 24_7_support)
- `GET /api/alerts` - Get all alerts (with optional status filter)
- `GET /api/alerts/stats` - Get statistics (tourists at risk, emergency count)
- `POST /api/alerts/<id>/resolve` - Resolve an alert

## Database Schema

### Tourist Table
- id (Primary Key)
- name
- email (Unique)
- phone
- password_hash
- created_at

### SOSAlert Table
- id (Primary Key)
- tourist_id (Foreign Key)
- alert_type (emergency_sos, location_tracking, 24_7_support)
- latitude
- longitude
- message
- status (active, resolved)
- created_at

## Security Features

- Password hashing using Werkzeug's security functions
- Session-based authentication
- Protected routes requiring login
- Secure password storage (never stored in plain text)
