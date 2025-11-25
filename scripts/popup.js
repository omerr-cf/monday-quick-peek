/**
 * Popup Script for Monday Quick Peek Extension
 *
 * This script handles:
 * - Settings page UI logic
 * - API key management (save/load/validate)
 * - Connection testing
 * - User preferences
 */

// DOM elements (will be populated on load)
let apiKeyInput = null;
let saveButton = null;
let testButton = null;
let statusMessage = null;
let apiKeyStatus = null;

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
  apiKeyInput = document.getElementById("api-key-input");
  saveButton = document.getElementById("save-button");
  testButton = document.getElementById("test-button");
  statusMessage = document.getElementById("status-message");
  apiKeyStatus = document.getElementById("api-key-status");

  // TODO: Initialize other UI elements
  // TODO: Add toggle switches for preferences
  // TODO: Add hover delay slider
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    // Load API key
    const result = await chrome.storage.sync.get(["apiKey", "settings"]);

    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      updateApiKeyStatus(true);
    } else {
      updateApiKeyStatus(false);
    }

    // TODO: Load other settings (hover delay, theme, etc.)
    if (result.settings) {
      // Apply settings to UI
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
  if (saveButton) {
    saveButton.addEventListener("click", handleSaveApiKey);
  }

  if (testButton) {
    testButton.addEventListener("click", handleTestConnection);
  }

  // TODO: Add listeners for other settings
  // TODO: Add input validation on keyup
  // TODO: Add keyboard shortcuts

  // Auto-save on Enter key
  if (apiKeyInput) {
    apiKeyInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSaveApiKey();
      }
    });
  }
}

/**
 * Handle save API key button click
 */
async function handleSaveApiKey() {
  const apiKey = apiKeyInput?.value?.trim();

  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  // Validate format (basic check)
  if (!isValidApiKeyFormat(apiKey)) {
    showStatus("Invalid API key format", "error");
    return;
  }

  // Show loading state
  setButtonLoading(saveButton, true);
  showStatus("Saving...", "info");

  try {
    // Send to background script
    const response = await sendMessage({
      action: "saveApiKey",
      apiKey: apiKey,
    });

    if (response.success) {
      showStatus("API key saved successfully!", "success");
      updateApiKeyStatus(true);

      // TODO: Auto-test connection after saving
    } else {
      showStatus(response.error || "Failed to save API key", "error");
    }
  } catch (error) {
    console.error("Popup: Error saving API key", error);
    showStatus("Error saving API key: " + error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
}

/**
 * Handle test connection button click
 */
async function handleTestConnection() {
  const apiKey = apiKeyInput?.value?.trim();

  if (!apiKey) {
    showStatus("Please enter an API key first", "error");
    return;
  }

  // Show loading state
  setButtonLoading(testButton, true);
  showStatus("Testing connection...", "info");

  try {
    const response = await sendMessage({
      action: "testApiConnection",
      apiKey: apiKey,
    });

    if (response.success) {
      const userName = response.user?.name || "Unknown";
      showStatus(`Connection successful! Connected as ${userName}`, "success");
      updateApiKeyStatus(true);
    } else {
      showStatus(response.error || "Connection failed", "error");
      updateApiKeyStatus(false);
    }
  } catch (error) {
    console.error("Popup: Error testing connection", error);
    showStatus("Error testing connection: " + error.message, "error");
  } finally {
    setButtonLoading(testButton, false);
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format is valid
 */
function isValidApiKeyFormat(apiKey) {
  // TODO: Add more sophisticated validation
  // Monday.com API keys are typically long alphanumeric strings
  return apiKey.length > 10;
}

/**
 * Update API key status indicator
 * @param {boolean} isSet - Whether API key is set
 */
function updateApiKeyStatus(isSet) {
  if (!apiKeyStatus) return;

  if (isSet) {
    apiKeyStatus.textContent = "✓ API Key Configured";
    apiKeyStatus.className = "status-indicator status-success";
  } else {
    apiKeyStatus.textContent = "⚠ API Key Not Set";
    apiKeyStatus.className = "status-indicator status-warning";
  }
}

/**
 * Show status message
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, info)
 */
function showStatus(message, type = "info") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;

  // Auto-hide after 5 seconds for success messages
  if (type === "success") {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
      }
    }, 5000);
  }
}

/**
 * Set button loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 */
function setButtonLoading(button, loading) {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.textContent = button.textContent
      .replace("Save", "Saving...")
      .replace("Test", "Testing...");
  } else {
    button.disabled = false;
    // TODO: Restore original button text
    if (button.id === "save-button") {
      button.textContent = "Save API Key";
    } else if (button.id === "test-button") {
      button.textContent = "Test Connection";
    }
  }
}

/**
 * Send message to background script
 * @param {Object} message - Message object
 * @returns {Promise<Object>} Response promise
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || {});
      }
    });
  });
}

/**
 * Save other settings (preferences)
 * @param {Object} settings - Settings object
 */
async function saveSettings(settings) {
  // TODO: Save user preferences (hover delay, theme, etc.)
  try {
    await chrome.storage.sync.set({ settings: settings });
    showStatus("Settings saved", "success");
  } catch (error) {
    console.error("Popup: Error saving settings", error);
    showStatus("Error saving settings", "error");
  }
}
