# Tourist Safety App - Setup Guide

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation Steps

### 1. Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- Flask-SQLAlchemy (database ORM)
- Werkzeug (password hashing)

### 2. Initialize the Database

Run the database initialization script:

```bash
python init_db.py
```

This creates the SQLite database file (`tourist_safety.db`) with the required tables:
- `tourist` - stores tourist user accounts
- `sos_alert` - stores all safety alerts

### 3. Start the Flask Server

Run the main application:

```bash
python app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:5000
```

## Using the Application

### For Tourists

1. **Register an Account**
   - Click on "Tourist Portal" from the home page
   - You'll be redirected to the login page
   - Click the "Register" tab
   - Fill in your details:
     - Full Name
     - Email Address
     - Contact Number
     - Password (minimum 6 characters)
   - Click "Register"

2. **Login**
   - Use your email and password to login
   - You'll be redirected to the tourist portal

3. **Allow Location Access**
   - When prompted by your browser, click "Allow" to share your location
   - This is required for the safety features to work
   - Your location will be displayed at the top of the page

4. **Send Alerts**
   - **Emergency SOS** - For immediate life-threatening emergencies
   - **Location Tracking** - To share your location for safety monitoring
   - **24/7 Support** - For general assistance requests

### For Police/Authorities

1. **Access the Dashboard**
   - Click on "Police Dashboard" from the home page
   - No login required (you can add authentication later)

2. **View Statistics**
   - See the total number of tourists at risk
   - See the number of active emergency SOS alerts

3. **Monitor the Map**
   - All active alerts are shown as pins on the map
   - Emergency SOS alerts pulse in red 🚨
   - Location tracking shows as blue pins 📍
   - Support requests show as green pins 🆘

4. **Manage Alerts**
   - Click on any pin to see alert details
   - Click "View on Map" to focus on a specific alert
   - Click "Resolve" to mark an alert as resolved
   - The map auto-refreshes every 30 seconds
   - Click "🔄 Refresh" to manually refresh

## Troubleshooting

### Location Not Working

1. **Check Browser Permissions**
   - Click the lock icon in the address bar
   - Ensure "Location" is set to "Allow"
   - Reload the page

2. **HTTPS Requirement**
   - Modern browsers require HTTPS for geolocation
   - In development, `localhost` is allowed
   - For production, you need an SSL certificate

3. **Try Different Browser**
   - Some browsers have stricter location policies
   - Try Chrome or Firefox if having issues

### Database Issues

If you encounter database errors:

```bash
# Delete the old database
rm tourist_safety.db

# Reinitialize
python init_db.py
```

### Port Already in Use

If port 5000 is already in use, edit `app.py`:

```python
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)  # Change to any available port
```

## Features

- ✅ User registration and authentication with password hashing
- ✅ Real-time GPS location tracking
- ✅ Three types of safety alerts
- ✅ Interactive map with location pins
- ✅ Emergency alerts highlighted with pulsing animation
- ✅ Live statistics dashboard
- ✅ Auto-refresh every 30 seconds
- ✅ Mobile responsive design
- ✅ Secure session management

## Security Notes

- Passwords are hashed using Werkzeug's security functions
- Sessions are protected with a secret key
- For production, change the secret key in `app.py`
- Consider adding HTTPS for production deployment
- Add authentication to the police dashboard for production use

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

## Environment Variables

The app uses the `GEOAPIFY_API_KEY` environment variable if needed for additional mapping features (currently using OpenStreetMap which doesn't require an API key).

## Development

To run in development mode with debug enabled:

```bash
python app.py
```

For production deployment, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn app:app
```

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors (F12)
2. Check the Flask terminal output for server errors
3. Ensure all dependencies are installed
4. Verify location permissions are enabled
5. Try a different browser

Happy coding! Stay safe! 🚨
