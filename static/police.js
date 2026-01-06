let map = null
let markers = []
let touristsData = []
let alertsData = []
let apiKey = null
const L = window.L // Declare the L variable

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadMapConfig()
  initializeMap()
  loadDashboardData()
  startAutoRefresh()

  // Refresh button
  document.getElementById("refresh-btn").addEventListener("click", () => {
    loadDashboardData()
  })
})

// Load map configuration from server
async function loadMapConfig() {
  try {
    const response = await fetch("/api/map/config")
    const data = await response.json()
    apiKey = data.apiKey
  } catch (error) {
    console.error("[v0] Failed to load map config:", error)
  }
}

// Initialize Leaflet Map
function initializeMap() {
  map = L.map("map").setView([0, 0], 2)

  const tileUrl = apiKey
    ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

  L.tileLayer(tileUrl, {
    attribution: apiKey
      ? '&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map)
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    // Load tourists
    const touristsResponse = await fetch("/api/police/tourists")
    touristsData = await touristsResponse.json()

    // Load alerts
    const alertsResponse = await fetch("/api/police/alerts")
    alertsData = await alertsResponse.json()

    // Update UI
    updateStats()
    updateMap()
    updateAlertsList()
    updateTouristsList()
  } catch (error) {
    console.error("[v0] Failed to load dashboard data:", error)
  }
}

// Update Stats
function updateStats() {
  const totalTourists = touristsData.length
  const activeAlerts = alertsData.length
  const highRisk = touristsData.filter((t) => t.riskLevel === "high" || t.riskLevel === "critical").length

  document.getElementById("total-tourists").textContent = totalTourists
  document.getElementById("active-alerts").textContent = activeAlerts
  document.getElementById("high-risk").textContent = highRisk
}

// Update Map
function updateMap() {
  // Clear existing markers
  markers.forEach((marker) => map.removeLayer(marker))
  markers = []

  if (touristsData.length === 0) return

  const bounds = []

  touristsData.forEach((tourist) => {
    if (tourist.latitude && tourist.longitude) {
      const hasActiveSos = tourist.activeSosCount > 0
      const riskLevel = tourist.riskLevel || "low"

      // Determine marker color
      let markerColor = "#48bb78" // green for low risk
      if (hasActiveSos) {
        markerColor = "#e53e3e" // red for SOS
      } else if (riskLevel === "critical") {
        markerColor = "#e53e3e" // red
      } else if (riskLevel === "high") {
        markerColor = "#ed8936" // orange
      } else if (riskLevel === "medium") {
        markerColor = "#ecc94b" // yellow
      }

      // Create custom icon
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      // Create marker
      const marker = L.marker([tourist.latitude, tourist.longitude], { icon })
        .addTo(map)
        .bindPopup(createPopupContent(tourist))

      markers.push(marker)
      bounds.push([tourist.latitude, tourist.longitude])
    }
  })

  // Fit map to show all markers
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

// Create Popup Content
function createPopupContent(tourist) {
  const anomalies = tourist.anomalies || []
  const anomaliesText = anomalies.length > 0 ? anomalies.join(", ") : "None"

  return `
    <div class="map-popup">
      <div class="popup-name">${tourist.name}</div>
      <div class="popup-info">Phone: ${tourist.phone}</div>
      <div class="popup-info">Hotel: ${tourist.hotelName || "N/A"}</div>
      <div class="popup-info">Last Seen: ${formatTime(tourist.lastSeen)}</div>
      <div class="popup-risk">
        <div class="popup-info">Risk Level: <strong>${tourist.riskLevel.toUpperCase()}</strong></div>
        <div class="popup-info">Anomalies: ${anomaliesText}</div>
      </div>
    </div>
  `
}

// Update Alerts List
function updateAlertsList() {
  const alertsList = document.getElementById("alerts-list")

  if (alertsData.length === 0) {
    alertsList.innerHTML = '<p class="empty-state">No active alerts</p>'
    return
  }

  alertsList.innerHTML = alertsData
    .map(
      (alert) => `
    <div class="alert-card">
      <div class="alert-header">
        <div class="alert-name">${alert.touristName}</div>
        <div class="alert-time">${formatTime(alert.createdAt)}</div>
      </div>
      <div class="alert-message">${alert.message}</div>
      <div class="alert-location">
        Location: ${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}
      </div>
      <button class="btn-resolve" onclick="resolveAlert(${alert.id})">
        Resolve Alert
      </button>
    </div>
  `,
    )
    .join("")
}

// Update Tourists List
function updateTouristsList() {
  const touristsList = document.getElementById("tourists-list")

  if (touristsData.length === 0) {
    touristsList.innerHTML = '<p class="empty-state">No tourists registered</p>'
    return
  }

  touristsList.innerHTML = touristsData
    .map((tourist) => {
      const riskClass = `risk-${tourist.riskLevel}`
      const sosIndicator = tourist.activeSosCount > 0 ? " 🚨" : ""

      return `
      <div class="tourist-card ${riskClass}" onclick="focusTourist(${tourist.latitude}, ${tourist.longitude})">
        <div class="tourist-header">
          <div class="tourist-name">${tourist.name}${sosIndicator}</div>
          <span class="risk-badge ${tourist.riskLevel}">${tourist.riskLevel}</span>
        </div>
        <div class="tourist-info">Phone: ${tourist.phone}</div>
        <div class="tourist-info">Hotel: ${tourist.hotelName || "N/A"}</div>
        <div class="tourist-last-seen">Last seen: ${formatTime(tourist.lastSeen)}</div>
      </div>
    `
    })
    .join("")
}

// Focus on Tourist on Map
function focusTourist(lat, lng) {
  if (lat && lng) {
    map.setView([lat, lng], 15)
  }
}

// Resolve Alert
async function resolveAlert(alertId) {
  try {
    const response = await fetch(`/api/police/alerts/${alertId}/resolve`, {
      method: "POST",
    })

    if (response.ok) {
      loadDashboardData()
    }
  } catch (error) {
    console.error("[v0] Failed to resolve alert:", error)
  }
}

// Auto Refresh
function startAutoRefresh() {
  setInterval(() => {
    loadDashboardData()
  }, 10000) // Refresh every 10 seconds
}

// Helper Functions
function formatTime(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
