let map = null
let markers = []
const activeAlerts = new Map()

const L = window.L

// Initialize map
function initMap() {
  map = L.map("map").setView([0, 0], 2)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map)
}

// Get alert type styling
function getAlertStyle(alertType) {
  const styles = {
    emergency_sos: { color: "#dc2626", icon: "🚨", label: "EMERGENCY SOS" },
    location_tracking: { color: "#2563eb", icon: "📍", label: "Location Tracking" },
    "24_7_support": { color: "#16a34a", icon: "🆘", label: "24/7 Support" },
  }
  return styles[alertType] || styles["emergency_sos"]
}

// Add marker to map
function addMarker(alert) {
  const style = getAlertStyle(alert.alert_type)

  // Create custom icon for emergency SOS
  const iconHtml =
    alert.alert_type === "emergency_sos"
      ? `<div style="background: ${style.color}; color: white; padding: 8px; border-radius: 50%; font-size: 20px; animation: pulse 2s infinite;">${style.icon}</div>`
      : `<div style="background: ${style.color}; color: white; padding: 8px; border-radius: 50%; font-size: 20px;">${style.icon}</div>`

  const customIcon = L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [40, 40],
  })

  const marker = L.marker([alert.latitude, alert.longitude], { icon: customIcon })
    .addTo(map)
    .bindPopup(`
      <div class="marker-popup">
        <h3 style="color: ${style.color}">${style.icon} ${style.label}</h3>
        <p><strong>Tourist:</strong> ${alert.tourist_name}</p>
        <p><strong>Phone:</strong> ${alert.tourist_phone}</p>
        <p><strong>Email:</strong> ${alert.tourist_email}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.created_at).toLocaleString()}</p>
        <button onclick="resolveAlert(${alert.id})" class="btn btn-sm btn-success">Resolve</button>
      </div>
    `)

  markers.push({ id: alert.id, marker })
  activeAlerts.set(alert.id, alert)

  return marker
}

// Remove marker from map
function removeMarker(alertId) {
  const markerObj = markers.find((m) => m.id === alertId)
  if (markerObj) {
    map.removeLayer(markerObj.marker)
    markers = markers.filter((m) => m.id !== alertId)
    activeAlerts.delete(alertId)
  }
}

// Load alert statistics
async function loadStats() {
  try {
    const response = await fetch("/api/alerts/stats")
    const stats = await response.json()

    document.getElementById("tourists-at-risk").textContent = stats.tourists_at_risk
    document.getElementById("emergency-count").textContent = stats.emergency_sos_count
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

// Fetch and display alerts
async function loadAlerts() {
  try {
    const response = await fetch("/api/alerts?status=active")
    const alerts = await response.json()

    // Clear existing markers
    markers.forEach((m) => map.removeLayer(m.marker))
    markers = []
    activeAlerts.clear()

    // Update alerts list
    const alertsList = document.getElementById("alerts-list")

    if (alerts.length === 0) {
      alertsList.innerHTML = '<p class="no-alerts">No active alerts</p>'
      return
    }

    alertsList.innerHTML = ""

    // Add markers and list items
    const bounds = []
    alerts.forEach((alert) => {
      const style = getAlertStyle(alert.alert_type)

      // Add marker to map
      addMarker(alert)
      bounds.push([alert.latitude, alert.longitude])

      // Add to alerts list with highlighting for emergency SOS
      const alertCard = document.createElement("div")
      alertCard.className = `alert-card ${alert.alert_type === "emergency_sos" ? "emergency-highlight" : ""}`
      alertCard.innerHTML = `
        <div class="alert-header">
          <span class="alert-badge" style="background: ${style.color}">${style.icon} ${style.label}</span>
          <span class="alert-time">${new Date(alert.created_at).toLocaleTimeString()}</span>
        </div>
        <div class="alert-body">
          <p><strong>${alert.tourist_name}</strong></p>
          <p>📞 ${alert.tourist_phone}</p>
          <p>✉️ ${alert.tourist_email}</p>
          <p>📍 ${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}</p>
          ${alert.message ? `<p class="alert-message">${alert.message}</p>` : ""}
        </div>
        <div class="alert-actions">
          <button onclick="focusOnAlert(${alert.id})" class="btn btn-sm btn-secondary">View on Map</button>
          <button onclick="resolveAlert(${alert.id})" class="btn btn-sm btn-success">Resolve</button>
        </div>
      `
      alertsList.appendChild(alertCard)
    })

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    // Update statistics
    loadStats()
  } catch (error) {
    console.error("Error loading alerts:", error)
    document.getElementById("alerts-list").innerHTML = '<p class="error">Failed to load alerts</p>'
  }
}

// Focus on specific alert
window.focusOnAlert = (alertId) => {
  const alert = activeAlerts.get(alertId)
  if (alert) {
    map.setView([alert.latitude, alert.longitude], 15)
    const markerObj = markers.find((m) => m.id === alertId)
    if (markerObj) {
      markerObj.marker.openPopup()
    }
  }
}

// Resolve alert
window.resolveAlert = async (alertId) => {
  if (!confirm("Are you sure you want to resolve this alert?")) {
    return
  }

  try {
    const response = await fetch(`/api/alerts/${alertId}/resolve`, {
      method: "POST",
    })

    const data = await response.json()

    if (data.success) {
      removeMarker(alertId)
      loadAlerts()
    }
  } catch (error) {
    console.error("Error resolving alert:", error)
    alert("Failed to resolve alert. Please try again.")
  }
}

// Refresh button
document.getElementById("refresh-btn").addEventListener("click", () => {
  loadAlerts()
})

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  initMap()
  loadAlerts()

  // Auto-refresh every 30 seconds
  setInterval(loadAlerts, 30000)
})
