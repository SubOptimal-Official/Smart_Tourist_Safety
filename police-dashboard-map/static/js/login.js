// Tab switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab")

    // Update active tab button
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")

    // Update active tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}-tab`).classList.add("active")
  })
})

// Login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  const errorDiv = document.getElementById("login-error")

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      // Store user data
      localStorage.setItem("touristId", data.tourist.id)
      localStorage.setItem("touristName", data.tourist.name)
      localStorage.setItem("touristPhone", data.tourist.phone)
      localStorage.setItem("touristEmail", data.tourist.email)

      // Redirect to tourist portal
      window.location.href = "/tourist"
    } else {
      errorDiv.textContent = data.error
      errorDiv.style.display = "block"
    }
  } catch (error) {
    errorDiv.textContent = "Login failed. Please try again."
    errorDiv.style.display = "block"
  }
})

// Register form
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const name = document.getElementById("reg-name").value
  const email = document.getElementById("reg-email").value
  const phone = document.getElementById("reg-phone").value
  const password = document.getElementById("reg-password").value
  const confirmPassword = document.getElementById("reg-confirm-password").value
  const errorDiv = document.getElementById("register-error")

  // Validate password match
  if (password !== confirmPassword) {
    errorDiv.textContent = "Passwords do not match"
    errorDiv.style.display = "block"
    return
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json()

    if (data.success) {
      // Store user data
      localStorage.setItem("touristId", data.tourist_id)
      localStorage.setItem("touristName", name)
      localStorage.setItem("touristPhone", phone)
      localStorage.setItem("touristEmail", email)

      // Redirect to tourist portal
      window.location.href = "/tourist"
    } else {
      errorDiv.textContent = data.error
      errorDiv.style.display = "block"
    }
  } catch (error) {
    errorDiv.textContent = "Registration failed. Please try again."
    errorDiv.style.display = "block"
  }
})
