let currentLocation = null
const watchId = null

// Check authentication
window.addEventListener("DOMContentLoaded", () => {
  const touristId = localStorage.getItem("touristId")
  const touristName = localStorage.getItem("touristName")
  const touristPhone = localStorage.getItem("touristPhone")
  const touristEmail = localStorage.getItem("touristEmail")

  if (!touristId) {
    window.location.href = "/login"
    return
  }

  // Display user info
  document.getElementById("user-name").textContent = touristName
  document.getElementById("user-phone").textContent = touristPhone
  document.getElementById("user-email").textContent = touristEmail

  console.log("[v0] Initializing location services...")
  getLocationFromAPI()
  startLocationRefresh()
})

// Logout handler
document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" })
  localStorage.clear()
  window.location.href = "/login"
})

async function getLocationFromAPI() {
  updateLocationStatus(null, "Getting your location...")
  console.log("[v0] Requesting location from Geoapify API...")

  try {
    const response = await fetch("/api/get-location")
    const data = await response.json()

    console.log("[v0] Location API response:", data)

    if (data.success) {
      currentLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
      }
      const locationText = `Location: ${data.city}, ${data.country} (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`
      updateLocationStatus(true, locationText)
      console.log("[v0] Location acquired successfully:", currentLocation)
    } else {
      // Use fallback location
      console.log("[v0] Using fallback location")
      currentLocation = data.fallback || {
        latitude: 40.758,
        longitude: -73.9855,
      }
      updateLocationStatus(
        true,
        "Using demo location (Times Square, NYC) for testing. Your actual location: IP-based lookup unavailable.",
      )
    }
  } catch (error) {
    console.log("[v0] Location API error:", error)
    // Use fallback location
    currentLocation = {
      latitude: 40.758,
      longitude: -73.9855,
    }
    updateLocationStatus(true, "Using demo location (Times Square, NYC) for testing")
  }
}

function startLocationRefresh() {
  setInterval(() => {
    console.log("[v0] Refreshing location...")
    getLocationFromAPI()
  }, 120000) // 2 minutes
}

function updateLocationStatus(success, customMessage = null) {
  const locationText = document.getElementById("location-text")
  const statusIndicator = document.querySelector(".status-indicator")

  if (success && currentLocation) {
    locationText.textContent =
      customMessage || `Location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
    statusIndicator.classList.add("active")
    statusIndicator.classList.remove("inactive")
  } else if (success === null) {
    locationText.textContent = customMessage || "Getting your location..."
    statusIndicator.classList.remove("active", "inactive")
  } else {
    locationText.textContent = customMessage || "Location unavailable - Please try again"
    statusIndicator.classList.remove("active")
    statusIndicator.classList.add("inactive")
  }
}

// Handle all alert buttons
document.querySelectorAll("[data-alert-type]").forEach((button) => {
  button.addEventListener("click", async (e) => {
    console.log("[v0] Alert button clicked, current location:", currentLocation)

    if (!currentLocation) {
      alert("Unable to get your location. Please wait a moment and try again.")
      getLocationFromAPI()
      return
    }

    const alertType = e.currentTarget.getAttribute("data-alert-type")
    const originalText = e.currentTarget.textContent

    e.currentTarget.disabled = true
    e.currentTarget.textContent = "Sending..."

    console.log("[v0] Sending alert:", alertType, currentLocation)

    try {
      const response = await fetch("/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alert_type: alertType,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          message: getAlertMessage(alertType),
        }),
      })

      const data = await response.json()
      console.log("[v0] Alert response:", data)

      if (data.success) {
        showSuccessMessage(alertType)
      } else {
        alert("Failed to send alert: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.log("[v0] Alert send error:", error)
      alert("Failed to send alert. Please check your internet connection and try again.")
    } finally {
      e.currentTarget.disabled = false
      e.currentTarget.textContent = originalText
    }
  })
})

function getAlertMessage(alertType) {
  const messages = {
    emergency_sos: "Emergency assistance needed immediately",
    location_tracking: "Sharing location for safety tracking",
    "24_7_support": "Requesting general assistance from support team",
  }
  return messages[alertType] || "Assistance needed"
}

function showSuccessMessage(alertType) {
  const alertDiv = document.getElementById("alert-sent")
  const messageSpan = document.getElementById("alert-message")

  const messages = {
    emergency_sos: "Emergency alert sent! Police are notified and help is on the way.",
    location_tracking: "Your location has been shared with authorities.",
    "24_7_support": "Support request sent! Our team will contact you shortly.",
  }

  messageSpan.textContent = messages[alertType]
  alertDiv.style.display = "block"

  setTimeout(() => {
    alertDiv.style.display = "none"
  }, 5000)
}
