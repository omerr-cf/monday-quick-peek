/**
 * Popup Script for Monday Quick Peek Extension
 *
 * Handles settings page UI, API key management, and connection testing
 */

// DOM elements
let apiKeyInput = null;
let saveButton = null;
let statusIndicator = null;
let statusMessage = null;
let togglePasswordBtn = null;
let loadingOverlay = null;
let disableTrackingCheckbox = null;
let resetUsageBtn = null;

// State
let isTesting = false;
let originalButtonText = "";

/**
 * Initialize popup when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Monday Quick Peek: Popup loaded");

  initializeElements();
  loadSettings();
  attachEventListeners();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
  apiKeyInput = document.getElementById("apiKey");
  saveButton = document.getElementById("saveBtn");
  statusIndicator = document.getElementById("statusIndicator");
  statusMessage = document.getElementById("statusMessage");
  togglePasswordBtn = document.getElementById("togglePassword");
  loadingOverlay = document.getElementById("loadingOverlay");
  disableTrackingCheckbox = document.getElementById("disableTracking");
  resetUsageBtn = document.getElementById("resetUsageBtn");

  if (saveButton) {
    originalButtonText =
      saveButton.querySelector(".button-text")?.textContent || "Save & Test";
  }
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(["apiKey", "apiKeyValid"]);

    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      updateConnectionStatus(
        result.apiKeyValid === true ? "connected" : "not-connected"
      );
    } else {
      updateConnectionStatus("not-connected");
    }
  } catch (error) {
    console.error("Popup: Error loading settings", error);
    showStatus("Error loading settings", "error");
  }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Save button click
  if (saveButton) {
    saveButton.addEventListener("click", handleSaveAndTest);
  }

  // Enter key to save
  if (apiKeyInput) {
    apiKeyInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !isTesting) {
        handleSaveAndTest();
      }
    });

    // Update status on input change
    apiKeyInput.addEventListener("input", () => {
      if (statusMessage.classList.contains("show")) {
        hideStatus();
      }
    });
  }

  // Toggle password visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  }

  // Dev mode: Disable tracking checkbox
  if (disableTrackingCheckbox) {
    disableTrackingCheckbox.addEventListener("change", handleTrackingToggle);
    loadDevSettings();
  }

  // Dev mode: Reset usage button
  if (resetUsageBtn) {
    resetUsageBtn.addEventListener("click", handleResetUsage);
  }
}

/**
 * Handle save and test button click
 */
async function handleSaveAndTest() {
  const apiKey = apiKeyInput?.value?.trim();

  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    apiKeyInput?.focus();
    return;
  }

  // Basic format validation
  if (!isValidApiKeyFormat(apiKey)) {
    showStatus(
      "Invalid API key format. API keys should be at least 20 characters long.",
      "error"
    );
    return;
  }

  // Prevent multiple simultaneous requests
  if (isTesting) {
    return;
  }

  isTesting = true;
  setButtonLoading(true);
  updateConnectionStatus("testing");
  showStatus("Testing connection...", "info");

  try {
    // Test API key by making a request to Monday.com API
    const isValid = await testApiKey(apiKey);

    if (isValid) {
      // Save to Chrome storage
      await chrome.storage.sync.set({
        apiKey: apiKey,
        apiKeyValid: true,
      });

      showStatus("✓ API key saved and validated successfully!", "success");
      updateConnectionStatus("connected");
      setButtonSuccess();

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        hideStatus();
        setButtonNormal();
      }, 3000);
    } else {
      showStatus(
        "Invalid API key. Please check your key and try again.",
        "error"
      );
      updateConnectionStatus("not-connected");
      setButtonNormal();
    }
  } catch (error) {
    console.error("Popup: Error testing API key", error);
    handleApiError(error);
    updateConnectionStatus("not-connected");
    setButtonNormal();
  } finally {
    isTesting = false;
    setButtonLoading(false);
  }
}

/**
 * Test API key by making a request to Monday.com API
 * @param {string} apiKey - API key to test
 * @returns {Promise<boolean>} True if API key is valid
 */
async function testApiKey(apiKey) {
  try {
    // Monday.com API endpoint to test authentication
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
        "API-Version": "2023-10",
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              name
              email
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      // Handle different HTTP status codes
      if (response.status === 401) {
        throw new Error("Invalid API key. Authentication failed.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status >= 500) {
        throw new Error(
          "Monday.com API is temporarily unavailable. Please try again later."
        );
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors && data.errors.length > 0) {
      const errorMessage =
        data.errors[0].message || "API key validation failed";
      throw new Error(errorMessage);
    }

    // Check if we got user data (means API key is valid)
    if (data.data && data.data.me) {
      console.log("Popup: API key validated successfully", data.data.me);
      return true;
    }

    return false;
  } catch (error) {
    // Re-throw with more context
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
}

/**
 * Handle API errors gracefully
 * @param {Error} error - Error object
 */
function handleApiError(error) {
  let errorMessage = "An error occurred while testing the API key.";

  if (error.message) {
    errorMessage = error.message;
  } else if (error.name === "TypeError" && error.message.includes("fetch")) {
    errorMessage = "Network error. Please check your internet connection.";
  }

  showStatus(errorMessage, "error");
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format is valid
 */
function isValidApiKeyFormat(apiKey) {
  // Monday.com API keys can be JWT tokens (contain dots) or alphanumeric strings
  // Basic validation: at least 20 characters, alphanumeric and some special chars (including dots for JWT)
  // JWT format: header.payload.signature (contains dots)
  return apiKey.length >= 20 && /^[a-zA-Z0-9_.-]+$/.test(apiKey);
}

/**
 * Update connection status indicator
 * @param {string} status - Status: "connected", "not-connected", "testing"
 */
function updateConnectionStatus(status) {
  if (!statusIndicator) return;

  // Remove all status classes
  statusIndicator.classList.remove("connected", "not-connected", "testing");

  // Add appropriate class
  statusIndicator.classList.add(status);

  // Update status text
  const statusText = statusIndicator.querySelector(".status-text");
  if (statusText) {
    switch (status) {
      case "connected":
        statusText.textContent = "Connected";
        break;
      case "not-connected":
        statusText.textContent = "Not Connected";
        break;
      case "testing":
        statusText.textContent = "Testing...";
        break;
    }
  }
}

/**
 * Show status message
 * @param {string} message - Message to show
 * @param {string} type - Message type: "success", "error", "info"
 */
function showStatus(message, type = "info") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  // Auto-hide info messages after 5 seconds
  if (type === "info") {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        hideStatus();
      }
    }, 5000);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  if (statusMessage) {
    statusMessage.classList.remove("show");
    setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "status-message";
    }, 300);
  }
}

/**
 * Set button loading state
 * @param {boolean} loading - Loading state
 */
function setButtonLoading(loading) {
  if (!saveButton) return;

  const buttonText = saveButton.querySelector(".button-text");

  if (loading) {
    saveButton.disabled = true;
    if (buttonText) {
      buttonText.textContent = "Testing...";
    }
    // Add spinner
    if (!saveButton.querySelector(".spinner")) {
      const spinner = document.createElement("div");
      spinner.className = "spinner";
      saveButton.insertBefore(spinner, buttonText);
    }
  } else {
    saveButton.disabled = false;
    const spinner = saveButton.querySelector(".spinner");
    if (spinner) {
      spinner.remove();
    }
    if (buttonText) {
      buttonText.textContent = originalButtonText;
    }
  }
}

/**
 * Set button success state
 */
function setButtonSuccess() {
  if (!saveButton) return;

  const buttonText = saveButton.querySelector(".button-text");
  if (buttonText) {
    buttonText.textContent = "✓ Saved!";
  }

  // Add checkmark
  if (!saveButton.querySelector(".checkmark")) {
    const checkmark = document.createElement("div");
    checkmark.className = "checkmark";
    checkmark.textContent = "✓";
    saveButton.insertBefore(checkmark, buttonText);
  }

  saveButton.style.background =
    "linear-gradient(135deg, #10b981 0%, #059669 100%)";
}

/**
 * Set button to normal state
 */
function setButtonNormal() {
  if (!saveButton) return;

  const buttonText = saveButton.querySelector(".button-text");
  if (buttonText) {
    buttonText.textContent = originalButtonText;
  }

  const checkmark = saveButton.querySelector(".checkmark");
  if (checkmark) {
    checkmark.remove();
  }

  saveButton.style.background =
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  if (!apiKeyInput || !togglePasswordBtn) return;

  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  togglePasswordBtn.textContent = isPassword ? "🙈" : "👁️";
}

/**
 * Show loading overlay
 */
function showLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.add("show");
  }
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove("show");
  }
}
