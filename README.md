# Tourist Safety Tracking System

AI-powered real-time location tracking and safety monitoring system for tourists.

## Features

### Tourist Mobile App
- GPS permission request and continuous location tracking
- Device registration with personal information
- Emergency SOS button with instant alert
- Real-time location updates
- Mobile-first responsive design
- Clean, modern interface

### Police Dashboard
- Live map integration with Leaflet and Geoapify
- Real-time location tracking
- SOS alert management
- Risk-level visualization (color-coded markers)
- Multiple views: Map, Tourist List, Alerts
- Auto-refresh every 10 seconds
- Risk scoring and anomaly detection

### AI Safety Intelligence
Rule-based anomaly detection:
- Sudden stop detection
- Unusual speed patterns
- Route deviation analysis
- Stationary period monitoring
- Frequent SOS alert tracking
- Automatic risk scoring (low/medium/high/critical)

## Technology Stack

- **Backend**: Flask (Python 3.7+)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: SQLite
- **Maps**: Leaflet + Geoapify API
- **AI**: Rule-based safety engine

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Set the Geoapify API key as an environment variable:

```bash
export GEOAPIFY_API_KEY=your_geoapify_api_key_here
```

To get a Geoapify API key:
1. Go to https://www.geoapify.com/
2. Create a free account
3. Navigate to "My Projects" → "API Keys"
4. Copy your API key
5. Set it as an environment variable

### 3. Initialize Database

The database will be created automatically when you first run the app at `./data/tourist_tracking.db`.

### 4. Run Development Server

```bash
python app.py
```

Visit:
- Tourist App: http://localhost:5000/
- Police Dashboard: http://localhost:5000/police

### 5. Run AI Analysis (Optional Background Service)

For continuous AI safety monitoring, run the analysis script periodically:

```bash
# Run once manually
python ai_safety_engine.py

# Or set up as a cron job (every 5 minutes)
python scripts/run_ai_analysis.py
```

Or add to your crontab:
```bash
*/5 * * * * cd /path/to/project && python scripts/run_ai_analysis.py
```

## Database Schema

### Tables
- `tourists` - User/device registration
- `locations` - GPS tracking data
- `sos_alerts` - Emergency alerts
- `safety_scores` - AI risk assessments

All tables are created automatically on first run.

## API Endpoints

### Tourist App
- `POST /api/tourist/register` - Register new tourist
  - Body: `{ name, phone, passportNumber?, hotelName?, emergencyContact? }`
  - Returns: `{ success, touristId, message }`

- `POST /api/location/update` - Update GPS location
  - Body: `{ touristId, latitude, longitude, accuracy?, speed? }`
  - Returns: `{ success, message }`
  - Note: Automatically triggers AI safety analysis

- `POST /api/sos/alert` - Send emergency SOS
  - Body: `{ touristId, latitude, longitude, message? }`
  - Returns: `{ success, alertId, message }`

### Police Dashboard
- `GET /api/police/tourists` - Get all tourists with latest locations
  - Returns: Array of tourist objects with risk scores

- `GET /api/police/alerts` - Get active SOS alerts
  - Returns: Array of active alert objects

- `POST /api/police/alerts/{id}/resolve` - Resolve SOS alert
  - Returns: `{ success, message }`

### AI Analysis
- `POST /api/ai/analyze/{tourist_id}` - Analyze specific tourist
- `POST /api/ai/analyze-all` - Analyze all active tourists

### Configuration
- `GET /api/map/config` - Get map configuration with API key

## AI Safety Features

### Detection Algorithms

1. **Sudden Stop**: Detects stationary position > 2 hours
2. **Unusual Speed**: Flags speeds > 150 km/h (41.67 m/s)
3. **Erratic Movement**: Detects frequent direction changes (3+ within tracking period)
4. **Route Deviation**: Flags 50km+ deviation from previous area
5. **Lost Contact**: Alerts if no updates for 1+ hour
6. **Active SOS**: Immediate critical status for active alerts

### Risk Scoring
- **Low** (0-14): Normal activity
- **Medium** (15-29): Minor anomaly
- **High** (30-49): Significant concern
- **Critical** (50+): Immediate attention required

### Automatic Analysis
The system automatically runs AI analysis after each location update to provide real-time risk assessment.

## File Structure

```
.
├── app.py                      # Main Flask application
├── ai_safety_engine.py         # AI safety analysis engine
├── requirements.txt            # Python dependencies
├── data/                       # Database directory (auto-created)
│   └── tourist_tracking.db    # SQLite database
├── templates/                  # HTML templates
│   ├── tourist.html           # Tourist mobile app
│   └── police.html            # Police dashboard
├── static/                     # Static assets
│   ├── tourist.css            # Tourist app styles
│   ├── tourist.js             # Tourist app logic
│   ├── police.css             # Police dashboard styles
│   └── police.js              # Police dashboard logic
├── scripts/                    # Utility scripts
│   └── run_ai_analysis.py     # Cron job for AI analysis
└── README.md                   # This file
```

## Security Features

- Parameterized SQL queries (SQL injection protection)
- Input validation on all endpoints
- CORS support for cross-origin requests
- Timestamp-based location tracking
- Server-side API key management

## Production Deployment

### Recommended Enhancements
1. Use PostgreSQL instead of SQLite for production
2. Add authentication for police dashboard
3. Implement WebSocket for true real-time updates
4. Set up HTTPS with SSL certificates
5. Add rate limiting and request throttling
6. Implement comprehensive logging
7. Set up monitoring and alerting
8. Add SMS/email notifications for critical alerts
9. Use a production WSGI server (Gunicorn, uWSGI)
10. Upgrade to ML-based AI models

### Production WSGI Server

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Variables for Production

```bash
export FLASK_ENV=production
export GEOAPIFY_API_KEY=your_production_key
export DATABASE_URL=postgresql://user:pass@host:5432/dbname  # If using PostgreSQL
```

### Scaling Considerations
- Database: Migrate to PostgreSQL with connection pooling
- Caching: Add Redis for frequent queries
- Real-time: Implement WebSocket server for live updates
- Queue: Use Celery for background AI analysis
- Load Balancer: Multiple app instances with Nginx
- CDN: Serve static assets from CDN

## Testing

Test the system locally:

1. Start the Flask server: `python app.py`
2. Open tourist app: http://localhost:5000/
3. Register as a tourist with test data
4. Allow GPS permissions in your browser
5. Open police dashboard: http://localhost:5000/police
6. Monitor the tourist location in real-time
7. Test SOS alert functionality

## Troubleshooting

**Issue**: Map not loading on police dashboard
- **Solution**: Ensure GEOAPIFY_API_KEY is set correctly

**Issue**: Database errors on first run
- **Solution**: Delete `data/tourist_tracking.db` and restart the app

**Issue**: Location not updating
- **Solution**: Check browser console for GPS permission errors

**Issue**: AI analysis not running
- **Solution**: Check that `ai_safety_engine.py` is in the same directory as `app.py`

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on the project repository.
