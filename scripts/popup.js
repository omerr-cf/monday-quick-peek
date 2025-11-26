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

// Pro License elements
let proBadge = null;
let freeUserView = null;
let proUserView = null;
let upgradeBtn = null;
let licenseKeyInput = null;
let activateLicenseBtn = null;
let deactivateLicenseBtn = null;
let licenseEmail = null;

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

  // Wait a bit for GumroadAPI to load, then initialize license UI
  setTimeout(() => {
    if (window.GumroadAPI) {
      console.log("Popup: GumroadAPI loaded, initializing license UI");
      initializeLicenseUI();
    } else {
      console.warn("Popup: GumroadAPI not found, retrying...");
      // Retry after a short delay
      setTimeout(() => {
        if (window.GumroadAPI) {
          initializeLicenseUI();
        } else {
          console.error("Popup: GumroadAPI still not available after retry");
        }
      }, 500);
    }
  }, 100);
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

  // Ensure reset button is enabled and clickable
  if (resetUsageBtn) {
    resetUsageBtn.disabled = false;
    resetUsageBtn.style.pointerEvents = "auto";
    resetUsageBtn.style.opacity = "1";
    resetUsageBtn.style.cursor = "pointer";
    console.log("[RESET] Reset button initialized and enabled");
  }

  // Pro License elements
  proBadge = document.getElementById("proBadge");
  freeUserView = document.getElementById("freeUserView");
  proUserView = document.getElementById("proUserView");
  upgradeBtn = document.getElementById("upgradeBtn");
  licenseKeyInput = document.getElementById("licenseKey");
  activateLicenseBtn = document.getElementById("activateLicenseBtn");
  deactivateLicenseBtn = document.getElementById("deactivateLicenseBtn");
  licenseEmail = document.getElementById("licenseEmail");

  // Elements initialized - removed verbose logging

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
    // Ensure button is enabled
    resetUsageBtn.disabled = false;
    resetUsageBtn.style.pointerEvents = "auto";
    resetUsageBtn.style.opacity = "1";
    resetUsageBtn.style.cursor = "pointer";

    // Add visual feedback styles
    resetUsageBtn.addEventListener("mouseenter", () => {
      resetUsageBtn.style.background = "#e1e4e8";
      resetUsageBtn.style.transform = "scale(1.02)";
    });
    resetUsageBtn.addEventListener("mouseleave", () => {
      resetUsageBtn.style.background = "#f3f4f6";
      resetUsageBtn.style.transform = "scale(1)";
    });

    resetUsageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[RESET] ===== RESET BUTTON CLICKED =====");
      // Visual feedback
      resetUsageBtn.style.background = "#d1d5db";
      resetUsageBtn.style.transform = "scale(0.98)";
      setTimeout(() => {
        resetUsageBtn.style.background = "#f3f4f6";
        resetUsageBtn.style.transform = "scale(1)";
      }, 150);
      handleResetUsage();
    });
    console.log("[RESET] Reset button event listener attached");
  } else {
    console.error("[RESET] Reset usage button not found!");
  }

  // Pro License: Upgrade button
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      // Get URL from centralized CONFIG (loaded via config.js first)
      // CONFIG should always be available since config.js is loaded before this script
      const gumroadUrl =
        window.CONFIG?.gumroad?.productUrl || window.GumroadAPI?.PRODUCT_URL;

      if (!gumroadUrl) {
        console.error("Popup: Gumroad URL not found in CONFIG or GumroadAPI!");
        showStatus("Configuration error: Gumroad URL not found", "error");
        return;
      }

      chrome.tabs.create({
        url: gumroadUrl,
      });
    });
  }

  // Pro License: Activate license button
  if (activateLicenseBtn) {
    activateLicenseBtn.addEventListener("click", handleActivateLicense);
  }

  // Pro License: Enter key to activate
  if (licenseKeyInput) {
    licenseKeyInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleActivateLicense();
      }
    });
  }

  // Pro License: Deactivate license button
  if (deactivateLicenseBtn) {
    deactivateLicenseBtn.addEventListener("click", handleDeactivateLicense);
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

/**
 * ============================================
 * DEV MODE FUNCTIONS
 * ============================================
 */

/**
 * Load dev settings
 */
async function loadDevSettings() {
  try {
    const result = await chrome.storage.local.get("disableUsageTracking");
    if (disableTrackingCheckbox) {
      disableTrackingCheckbox.checked = result.disableUsageTracking === true;
    }
  } catch (error) {
    console.error("Popup: Error loading dev settings", error);
  }
}

/**
 * Handle tracking toggle
 */
async function handleTrackingToggle() {
  const isDisabled = disableTrackingCheckbox?.checked || false;

  try {
    await chrome.storage.local.set({ disableUsageTracking: isDisabled });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "mondayQuickPeek_disableUsageTracking",
        isDisabled.toString()
      );
    }

    if (window.UsageTracker) {
      await window.UsageTracker.setTrackingDisabled(isDisabled);
    }

    showStatus(`Usage tracking ${isDisabled ? "disabled" : "enabled"}`, "info");
    setTimeout(() => hideStatus(), 2000);
  } catch (error) {
    console.error("Popup: Error toggling tracking", error);
    showStatus("Failed to update setting", "error");
  }
}

/**
 * Handle reset usage data
 */
async function handleResetUsage() {
  console.log("[RESET] ===== handleResetUsage FUNCTION CALLED =====");
  console.log("[RESET] Function is executing...");

  // No confirmation needed - reset immediately when clicked
  console.log("[RESET] ✅ Proceeding with reset immediately...");

  // Disable button during reset (but ensure it starts enabled)
  if (resetUsageBtn) {
    // Make sure button is enabled before disabling
    resetUsageBtn.disabled = false;
    resetUsageBtn.style.pointerEvents = "auto";
    resetUsageBtn.style.opacity = "1";
    resetUsageBtn.style.cursor = "pointer";

    // Now disable for the operation
    resetUsageBtn.disabled = true;
    resetUsageBtn.textContent = "Resetting...";
    console.log("[RESET] Button disabled for reset operation");
  }

  try {
    console.log("[RESET] Checking for UsageTracker...");

    if (window.UsageTracker) {
      console.log("[RESET] UsageTracker found, calling resetAll()");
      await window.UsageTracker.resetAll();
      console.log("[RESET] resetAll() completed");
      showStatus(
        "Usage data reset successfully! Reload the page to see changes.",
        "success"
      );
    } else {
      console.log("[RESET] UsageTracker not found, using fallback");
      // Fallback: manually reset
      await chrome.storage.local.remove([
        "usageData",
        "upgradePromptCount",
        "disableUsageTracking",
      ]);
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("mondayQuickPeek_disableUsageTracking");
      }
      // Clear sessionStorage banner dismissals
      if (typeof sessionStorage !== "undefined") {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("bannerDismissed_")) {
            sessionStorage.removeItem(key);
          }
        });
      }
      console.log("[RESET] Fallback reset completed");
      showStatus(
        "Usage data reset successfully! Reload the page to see changes.",
        "success"
      );
    }

    console.log("[RESET] Reset completed successfully");
    setTimeout(() => hideStatus(), 3000);
  } catch (error) {
    console.error("[RESET] Error resetting usage data", error);
    showStatus(`Failed to reset usage data: ${error.message}`, "error");
  } finally {
    // Re-enable button
    if (resetUsageBtn) {
      resetUsageBtn.disabled = false;
      resetUsageBtn.textContent = "Reset Usage Data";
    }
    console.log("[RESET] Button re-enabled");
  }
}

/**
 * ============================================
 * PRO LICENSE MANAGEMENT
 * ============================================
 */

/**
 * Initialize Pro License UI
 */
async function initializeLicenseUI() {
  console.log("Popup: initializeLicenseUI called");

  if (!window.GumroadAPI) {
    console.error("Popup: GumroadAPI not loaded");
    showStatus("Gumroad API not loaded. Please reload the extension.", "error");
    return;
  }

  try {
    console.log("Popup: Checking license status...");
    const status = await window.GumroadAPI.checkLicenseStatus();
    console.log("Popup: License status:", status);

    if (status.isPro) {
      showProView();
    } else {
      showFreeView();
    }
  } catch (error) {
    console.error("Popup: Error initializing license UI", error);
    showFreeView(); // Default to free view on error
  }
}

/**
 * Show Pro user view
 */
function showProView() {
  if (!proBadge || !freeUserView || !proUserView) return;

  proBadge.textContent = "PRO";
  proBadge.style.background =
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  proBadge.style.color = "white";
  proBadge.classList.add("active");

  freeUserView.style.display = "none";
  proUserView.style.display = "block";

  // Load license email
  chrome.storage.sync.get("licensedEmail", (result) => {
    if (licenseEmail && result.licensedEmail) {
      licenseEmail.textContent = result.licensedEmail;
    }
  });
}

/**
 * Show Free user view
 */
function showFreeView() {
  if (!proBadge || !freeUserView || !proUserView) return;

  proBadge.textContent = "FREE";
  proBadge.style.background = "#e1e4e8";
  proBadge.style.color = "#676879";
  proBadge.classList.remove("active");

  freeUserView.style.display = "block";
  proUserView.style.display = "none";

  // Clear license key input
  if (licenseKeyInput) {
    licenseKeyInput.value = "";
  }
}

/**
 * Handle license activation
 */
async function handleActivateLicense() {
  console.log("Popup: handleActivateLicense called");

  // Check if GumroadAPI is loaded
  if (!window.GumroadAPI) {
    console.error("Popup: GumroadAPI not found on window object");
    showStatus(
      "Gumroad API not available. Please reload the extension.",
      "error"
    );
    return;
  }

  const licenseKey = licenseKeyInput?.value?.trim();

  if (!licenseKey) {
    showStatus("Please enter a license key", "error");
    if (licenseKeyInput) {
      licenseKeyInput.focus();
    }
    return;
  }

  console.log(
    "Popup: Validating license key:",
    licenseKey.substring(0, 8) + "..."
  );

  // Disable button during validation
  if (activateLicenseBtn) {
    activateLicenseBtn.disabled = true;
    activateLicenseBtn.textContent = "Validating...";
  }

  showStatus("Validating license...", "info");

  try {
    console.log("Popup: Calling GumroadAPI.saveLicense");
    const result = await window.GumroadAPI.saveLicense(licenseKey);
    console.log("Popup: License validation result:", result);

    if (result.success) {
      showStatus(result.message, "success");
      setTimeout(() => {
        initializeLicenseUI();
        hideStatus();
      }, 1500);
    } else {
      console.error("Popup: License validation failed:", result.message);
      showStatus(result.message, "error");
    }
  } catch (error) {
    console.error("Popup: Error activating license", error);
    showStatus(
      `Failed to activate license: ${error.message || "Unknown error"}`,
      "error"
    );
  } finally {
    // Re-enable button
    if (activateLicenseBtn) {
      activateLicenseBtn.disabled = false;
      activateLicenseBtn.textContent = "Activate";
    }
  }
}

/**
 * Handle license deactivation
 */
async function handleDeactivateLicense() {
  console.log("Popup: handleDeactivateLicense called");

  if (!window.GumroadAPI) {
    console.error("Popup: GumroadAPI not available");
    showStatus("Gumroad API not available", "error");
    return;
  }

  // Use custom confirmation modal instead of window.confirm
  const confirmed = await showConfirmModal(
    "Deactivate Pro License",
    "Are you sure you want to deactivate your Pro license? You'll lose access to Pro features and unlimited tooltip views."
  );

  console.log("Popup: Deactivate confirmation result:", confirmed);

  if (!confirmed) {
    console.log("Popup: User cancelled deactivation");
    return;
  }

  try {
    console.log("Popup: Calling GumroadAPI.removeLicense()");
    await window.GumroadAPI.removeLicense();
    console.log("Popup: License removed successfully");

    showStatus("License deactivated", "info");
    showFreeView();

    // Auto-hide message after 2 seconds
    setTimeout(() => {
      hideStatus();
    }, 2000);
  } catch (error) {
    console.error("Popup: Error deactivating license", error);
    showStatus("Failed to deactivate license. Please try again.", "error");
  }
}

/**
 * Show custom confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @returns {Promise<boolean>} True if user clicked OK, false if cancelled
 */
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("confirmModalTitle");
    const modalMessage = document.getElementById("confirmModalMessage");
    const modalOk = document.getElementById("confirmModalOk");
    const modalCancel = document.getElementById("confirmModalCancel");

    if (!modal || !modalTitle || !modalMessage || !modalOk || !modalCancel) {
      console.error(
        "[CONFIRM] Modal elements not found, falling back to window.confirm"
      );
      resolve(window.confirm(message));
      return;
    }

    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Show modal
    modal.style.display = "flex";

    // Clean up previous listeners
    const okHandler = () => {
      console.log("[CONFIRM] User clicked OK");
      modal.style.display = "none";
      modalOk.removeEventListener("click", okHandler);
      modalCancel.removeEventListener("click", cancelHandler);
      resolve(true);
    };

    const cancelHandler = () => {
      console.log("[CONFIRM] User clicked Cancel");
      modal.style.display = "none";
      modalOk.removeEventListener("click", okHandler);
      modalCancel.removeEventListener("click", cancelHandler);
      resolve(false);
    };

    // Attach listeners
    modalOk.addEventListener("click", okHandler);
    modalCancel.addEventListener("click", cancelHandler);

    // Close on backdrop click
    const backdropHandler = (e) => {
      if (e.target === modal) {
        console.log("[CONFIRM] User clicked backdrop");
        modal.style.display = "none";
        modal.removeEventListener("click", backdropHandler);
        modalOk.removeEventListener("click", okHandler);
        modalCancel.removeEventListener("click", cancelHandler);
        resolve(false);
      }
    };
    modal.addEventListener("click", backdropHandler);
  });
}
