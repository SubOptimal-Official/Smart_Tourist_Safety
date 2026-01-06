# Geoapify API Setup Guide

This tourist tracking system now uses **Geoapify** for mapping services instead of Google Maps.

## Getting Your Free Geoapify API Key

### Step 1: Create an Account
1. Visit [Geoapify](https://www.geoapify.com/)
2. Click "Get Started for Free" or "Sign Up"
3. Create your account using email or GitHub

### Step 2: Get Your API Key
1. After signing up, you'll be redirected to your dashboard
2. Your API key will be displayed on the main dashboard page
3. Copy the API key (it starts with a long alphanumeric string)

### Step 3: Add API Key to v0

**In v0 Interface:**
1. Click the sidebar in your v0 chat
2. Navigate to the **Vars** section
3. Add a new environment variable:
   - **Variable Name:** `GEOAPIFY_API_KEY` (without NEXT_PUBLIC_ prefix)
   - **Value:** Your Geoapify API key (paste it here)
4. Save the variable

**For Local Development:**
Create a `.env.local` file in your project root:
```bash
GEOAPIFY_API_KEY=your_api_key_here
```

## Important: Environment Variable Security

This app uses `GEOAPIFY_API_KEY` (without the `NEXT_PUBLIC_` prefix) and fetches it through a server action. This approach:
- Keeps the variable server-side only
- Prevents direct client access to the environment variable
- The API key is still included in tile URLs (required for maps to work), but it's fetched securely from the server

Note: All mapping services (Google Maps, Mapbox, Geoapify) require API keys to be included in tile requests. The security comes from domain restrictions in your Geoapify dashboard, not from hiding the key.

## Geoapify Free Tier Benefits

The free tier includes:
- **3,000 credits/day** (resets daily)
- **100,000 credits/month**
- All map styles available
- Geocoding and routing APIs
- No credit card required

### API Usage Costs:
- Map tiles: 1 credit per 15 tiles
- Typical map view loads: 30-50 tiles
- Your tourist tracking app should stay well within free limits

## Security Best Practices

How to secure your Geoapify API key through the dashboard:

1. **Log into Geoapify Dashboard**
2. **Go to API Keys section**
3. **Set Allowed Domains**:
   - Add your production domain (e.g., `yourdomain.com`)
   - Add your v0 preview domain
   - Add `localhost` for development
4. **Enable Usage Alerts** to monitor for suspicious activity
5. **Set Rate Limits** if available

This prevents anyone from using your API key on unauthorized domains.

## Switching Map Styles

Geoapify offers multiple map styles. To change the style, edit `app/actions/get-map-config.ts`:

```typescript
// Current style: osm-bright
return {
  apiKey,
  tileUrl: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`
}

// Other available styles:
// osm-carto (OpenStreetMap default)
// osm-bright-grey
// osm-bright-smooth
// klokantech-basic
// dark-matter
// positron
```

## Troubleshooting

### Map Not Loading?
1. Check that `GEOAPIFY_API_KEY` is set in Vars section (WITHOUT the NEXT_PUBLIC_ prefix)
2. Verify the API key is correct (check Geoapify dashboard)
3. Check browser console for error messages
4. Ensure you haven't exceeded your daily/monthly quota

### Exceeded Free Tier?
- Free tier resets daily (3,000 credits)
- Consider upgrading to paid tier if needed
- Or optimize map tile requests

## Support

- Geoapify Documentation: https://apidocs.geoapify.com/
- Geoapify Support: support@geoapify.com
- Leaflet Documentation: https://leafletjs.com/reference.html

## Why Geoapify?

✅ **Free tier** with generous limits  
✅ **No credit card** required  
✅ **Fast** and reliable tile delivery  
✅ **Multiple map styles** included  
✅ **Easy setup** - just one API key needed  
✅ **Great for prototyping** and production apps  
✅ **Secure server-side configuration**
