# Tourist Safety Tracking System - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Maps API Key

The police dashboard requires a Google Maps API key to display the live location map.

**Important:** The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable is intentionally exposed to the client because the Google Maps JavaScript API requires it to run in the browser. This is the standard and recommended approach by Google.

#### How to Get Your API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **Credentials** and create an **API Key**
5. **Secure your API key** (see below)

#### How to Add the API Key to v0:

In v0, you can add environment variables through the **Vars section** in the in-chat sidebar:

1. Click on the sidebar in your chat
2. Navigate to **Vars**
3. Add a new variable:
   - **Name:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google Maps API key

#### Securing Your Google Maps API Key:

To prevent unauthorized use and unexpected charges:

1. In Google Cloud Console, go to your API key settings
2. Add **Application restrictions:**
   - Choose "HTTP referrers (web sites)"
   - Add your domain: `https://yourdomain.com/*`
   - For development: `http://localhost:3000/*`
3. Add **API restrictions:**
   - Select "Restrict key"
   - Choose "Maps JavaScript API"

**Note:** Even though the key is visible in the client code, it's protected by domain restrictions, making it safe for production use.

### 3. Run the Development Server

```bash
npm run dev
```

Visit:
- **Tourist App:** http://localhost:3000/
- **Police Dashboard:** http://localhost:3000/police

### 4. Test the System

#### Testing Tourist App:
1. Open http://localhost:3000/ on a mobile device or browser
2. Enter your name and register
3. Grant location permissions when prompted
4. Click "Start Location Tracking"
5. Your location will be sent to the database every few seconds
6. Test the SOS button (will send emergency alert)

#### Testing Police Dashboard:
1. Open http://localhost:3000/police on a desktop browser
2. You should see all registered tourists on the map
3. Click markers to view tourist details
4. Check the Alerts tab for any SOS alerts
5. View risk levels assigned by the AI engine

### 5. Optional: Run AI Analysis Background Service

For continuous AI safety monitoring:

```bash
# Requires Python 3
pip install requests
python scripts/ai_analyzer_cron.py
```

This runs AI analysis every 5 minutes in the background.

## Troubleshooting

### "Google Maps API key not configured" Error
- Make sure you've added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to the Vars section in v0
- Verify the API key is correct and the Maps JavaScript API is enabled

### "Failed to load Google Maps" Error
- Check that your API key has the Maps JavaScript API enabled
- Verify domain restrictions allow your current domain
- Check the browser console for detailed error messages

### Location Permission Denied
- The app requires HTTPS in production (works on localhost for development)
- Check browser location settings
- Some browsers block location on insecure connections

### Database Errors
- The database file will be created automatically at `./data/tracking.db`
- Ensure the `data` directory can be created
- For production, upgrade to PostgreSQL

## Production Deployment

### Environment Variables Needed:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key

### Recommended Upgrades for Production:
1. Replace SQLite with PostgreSQL or Supabase
2. Add authentication for police dashboard
3. Implement WebSocket for real-time updates
4. Set up SSL/HTTPS (required for geolocation)
5. Add rate limiting and CORS policies
6. Set up monitoring and alerting
7. Configure domain restrictions for Google Maps API key

## Security Notes

- The Google Maps API key is public by design and should be secured via domain restrictions in Google Cloud Console
- Always use HTTPS in production for geolocation to work
- Implement authentication for the police dashboard before deploying
- Use environment variables for any sensitive backend keys
- Enable CORS only for trusted domains

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review the API endpoint documentation
- Check browser console for error messages
