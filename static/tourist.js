let touristId = null
let locationWatchId = null
let lastUpdateTime = null

// DOM Elements
const registrationScreen = document.getElementById("registration-screen")
const trackingScreen = document.getElementById("tracking-screen")
const registrationForm = document.getElementById("registration-form")
const errorMessage = document.getElementById("error-message")
const sosButton = document.getElementById("sos-button")
const sosMessage = document.getElementById("sos-message")

// Check if already registered
const storedTouristId = localStorage.getItem("touristId")
if (storedTouristId) {
  touristId = storedTouristId
  showTrackingScreen()
}

// Registration Form Submit
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    passportNumber: document.getElementById("passport").value,
    hotelName: document.getElementById("hotel").value,
    emergencyContact: document.getElementById("emergency").value,
  }

  try {
    const response = await fetch("/api/tourist/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      touristId = data.touristId
      localStorage.setItem("touristId", touristId)
      showTrackingScreen()
    } else {
      showError(data.error || "Registration failed")
    }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    showError("Network error. Please try again.")
  }
})

// SOS Button Click
sosButton.addEventListener("click", async () => {
  if (!touristId) return

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const response = await fetch("/api/sos/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            touristId: touristId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            message: "Emergency SOS Alert",
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          showSosSuccess("SOS Alert Sent! Help is on the way.")
        } else {
          showError("Failed to send SOS alert")
        }
      } catch (error) {
        console.error("[v0] SOS error:", error)
        showError("Network error. Please try again.")
      }
    },
    (error) => {
      showError("Unable to get your location")
    },
  )
})

// Show Tracking Screen
function showTrackingScreen() {
  registrationScreen.classList.remove("active")
  trackingScreen.classList.add("active")

  document.getElementById("tourist-id").textContent = touristId

  // Request location permission and start tracking
  requestLocationPermission()
}

// Request Location Permission
function requestLocationPermission() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startLocationTracking()
      },
      (error) => {
        console.error("[v0] Location permission denied:", error)
        document.getElementById("gps-status").textContent = "Permission Denied"
      },
    )
  } else {
    document.getElementById("gps-status").textContent = "Not Supported"
  }
}

// Start Location Tracking
function startLocationTracking() {
  if (locationWatchId) return

  locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      updateLocation(position)
    },
    (error) => {
      console.error("[v0] Location tracking error:", error)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  )

  document.getElementById("gps-status").textContent = "Active"
}

// Update Location
async function updateLocation(position) {
  if (!touristId) return

  const locationData = {
    touristId: touristId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed,
  }

  try {
    const response = await fetch("/api/location/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    })

    if (response.ok) {
      lastUpdateTime = new Date()
      document.getElementById("last-update").textContent = formatTime(lastUpdateTime)
      document.getElementById("accuracy").textContent = Math.round(position.coords.accuracy) + "m"
    }
  } catch (error) {
    console.error("[v0] Location update error:", error)
  }
}

// Helper Functions
function showError(message) {
  errorMessage.textContent = message
  errorMessage.classList.add("show")
  setTimeout(() => errorMessage.classList.remove("show"), 5000)
}

function showSosSuccess(message) {
  sosMessage.textContent = message
  sosMessage.classList.add("show")
  setTimeout(() => sosMessage.classList.remove("show"), 5000)
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
