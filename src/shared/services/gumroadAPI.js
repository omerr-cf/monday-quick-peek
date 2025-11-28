/**
 * Gumroad API Integration for Monday Quick Peek Pro
 * Handles license key validation and Pro subscription management
 */

// Get Gumroad config from centralized CONFIG
// CONFIG is loaded via config.js before this script (loaded first in manifest.json and popup.html)
const getGumroadConfig = () => {
  // CONFIG should always be available since config.js is loaded first
  if (typeof window !== "undefined" && window.CONFIG?.gumroad) {
    return window.CONFIG.gumroad;
  }
  // This should never happen if config.js is loaded properly
  // Fail loudly rather than silently using wrong values
  console.error(
    "GumroadAPI: CONFIG not found! Make sure config.js is loaded before gumroadAPI.js"
  );
  throw new Error(
    "GumroadAPI: CONFIG.gumroad is not available. Check that config.js is loaded first."
  );
};

const GUMROAD_CONFIG = getGumroadConfig();

class GumroadAPI {
  static PRODUCT_PERMALINK = GUMROAD_CONFIG.productPermalink;
  static PRODUCT_URL = GUMROAD_CONFIG.productUrl;
  static PRODUCT_ID = GUMROAD_CONFIG.productId;

  /**
   * Validate license key with Gumroad API
   * @param {string} licenseKey - License key to validate
   * @param {string} email - Optional email for validation
   * @returns {Promise<Object>} Validation result with valid, active, email, etc.
   */
  static async validateLicense(licenseKey, email = "") {
    try {
      // Gumroad License API endpoint
      // Gumroad requires both product_permalink AND product_id
      const requestBody = new URLSearchParams({
        product_permalink: this.PRODUCT_PERMALINK,
        license_key: licenseKey,
        increment_uses_count: "false", // Don't increment on validation
      });

      // Add product_id if available (required by Gumroad API)
      if (this.PRODUCT_ID) {
        requestBody.append("product_id", this.PRODUCT_ID);
      }

      const response = await fetch(
        "https://api.gumroad.com/v2/licenses/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: requestBody,
        }
      );

      if (!response.ok) {
        // Handle HTTP errors
        if (response.status === 404) {
          return {
            valid: false,
            error:
              "License key not found. Make sure you're using the license key from your purchase email (not the order ID).",
          };
        } else if (response.status === 400) {
          return {
            valid: false,
            error:
              "Invalid license key format. Please use the license key from your Gumroad purchase email.",
          };
        } else if (response.status === 500) {
          // Gumroad API server error - try to get more details
          let errorText = "";
          try {
            errorText = await response.text();
          } catch (e) {}

          // Check if it's a product permalink issue
          if (errorText && errorText.includes("product")) {
            return {
              valid: false,
              error:
                "Product not found. Please verify the product permalink in Gumroad settings matches 'monday-quick-peek-pro'.",
            };
          }

          return {
            valid: false,
            error:
              "Gumroad API server error (500). This might be a temporary issue. Please try again in a few moments. If the problem persists, check that license keys are enabled in your Gumroad product settings.",
          };
        } else {
          return {
            valid: false,
            error: `Validation failed (${response.status}). Please try again.`,
          };
        }
      }

      let data;
      try {
        data = await response.json();
        console.log(
          "GumroadAPI: Full API response:",
          JSON.stringify(data, null, 2)
        );
      } catch (parseError) {
        return {
          valid: false,
          error: "Invalid response from Gumroad API. Please try again.",
        };
      }

      // Check if API returned an error message
      if (!data.success) {
        // Provide more detailed error message
        const errorMessage = data.message || "License key validation failed.";

        // Check for common error cases
        if (
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("not found") ||
          errorMessage.toLowerCase().includes("does not exist")
        ) {
          return {
            valid: false,
            error:
              "Invalid license key. Please check that you're using the license key from your Gumroad purchase email (not the order ID).",
          };
        }

        return {
          valid: false,
          error:
            errorMessage ||
            "License key validation failed. Make sure license keys are enabled in your Gumroad product settings.",
        };
      }

      if (data.success && data.purchase) {
        // Check if subscription is active
        // For one-time purchases, these fields don't exist (undefined)
        // For subscriptions, they are null when active, or have dates when cancelled/failed
        const cancelledAt = data.purchase.subscription_cancelled_at;
        const failedAt = data.purchase.subscription_failed_at;

        // Subscription is active if:
        // - Fields don't exist (one-time purchase) OR
        // - Fields are null (active subscription) OR
        // - Fields are empty strings
        const isActive =
          (cancelledAt === null ||
            cancelledAt === undefined ||
            cancelledAt === "") &&
          (failedAt === null || failedAt === undefined || failedAt === "");

        return {
          valid: true,
          active: isActive,
          email: data.purchase.email || email,
          purchaseDate: data.purchase.created_at,
          subscriptionId: data.purchase.subscription_id,
        };
      }

      return {
        valid: false,
        error:
          data.message ||
          "Invalid license key. Please check your purchase email for the license key.",
      };
    } catch (error) {
      // Handle network errors
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        return {
          valid: false,
          error: "Network error. Please check your internet connection.",
        };
      }
      return {
        valid: false,
        error: "Validation failed. Please try again.",
      };
    }
  }

  /**
   * Save license key after validation
   * @param {string} licenseKey - License key to save
   * @returns {Promise<Object>} { success, message }
   */
  static async saveLicense(licenseKey) {
    const validation = await this.validateLicense(licenseKey);

    // Accept license if it's valid, even if active is false (one-time purchases don't have subscription fields)
    // Only reject if there's an explicit error
    if (validation.valid) {
      // Save to Chrome storage
      await chrome.storage.sync.set({
        licenseKey,
        licenseStatus: "active",
        licensedEmail: validation.email,
        lastValidated: Date.now(),
      });

      // Reset upgrade prompt count when Pro is activated
      // This ensures Pro users never see upgrade prompts
      if (window.UsageTracker) {
        try {
          await window.UsageTracker.resetUpgradePromptCount();
          console.log(
            "GumroadAPI: Reset upgrade prompt count after Pro activation"
          );
        } catch (error) {
          console.warn(
            "GumroadAPI: Error resetting upgrade prompt count",
            error
          );
        }
      }

      return {
        success: true,
        message: "Pro license activated! 🎉",
      };
    }

    return {
      success: false,
      message: validation.error || "Invalid license key",
    };
  }

  /**
   * Check current license status
   * Re-validates every 24 hours
   * @returns {Promise<Object>} { isPro, reason? }
   */
  static async checkLicenseStatus() {
    const { licenseKey, lastValidated } = await chrome.storage.sync.get([
      "licenseKey",
      "lastValidated",
    ]);

    if (!licenseKey) {
      return { isPro: false };
    }

    // Re-validate every 24 hours
    const dayInMs = 24 * 60 * 60 * 1000;
    if (lastValidated && Date.now() - lastValidated < dayInMs) {
      // Use cached status if validated within last 24 hours
      const { licenseStatus } = await chrome.storage.sync.get("licenseStatus");
      return { isPro: licenseStatus === "active" };
    }

    // Re-validate license
    const validation = await this.validateLicense(licenseKey);

    if (validation.valid && validation.active) {
      await chrome.storage.sync.set({
        licenseStatus: "active",
        lastValidated: Date.now(),
      });
      return { isPro: true };
    }

    // License expired or cancelled
    await chrome.storage.sync.set({
      licenseStatus: "inactive",
      lastValidated: Date.now(),
    });
    return {
      isPro: false,
      reason: validation.error || "License expired or cancelled",
    };
  }

  /**
   * Remove license (deactivate)
   * @returns {Promise<void>}
   */
  static async removeLicense() {
    await chrome.storage.sync.remove([
      "licenseKey",
      "licenseStatus",
      "licensedEmail",
      "lastValidated",
    ]);

    // Clear banner dismissal when deactivated so banner can show again
    // Send message to content script to clear banner dismissal
    try {
      const tabs = await chrome.tabs.query({ url: "https://*.monday.com/*" });
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, {
            action: "clearBannerDismissal",
          })
          .catch(() => {
            // Tab might not have content script loaded, ignore
          });
      });
    } catch (error) {
      console.warn(
        "GumroadAPI: Error sending clearBannerDismissal message",
        error
      );
    }
  }

  /**
   * Get license information
   * @returns {Promise<Object>} License info
   */
  static async getLicenseInfo() {
    const result = await chrome.storage.sync.get([
      "licenseKey",
      "licenseStatus",
      "licensedEmail",
      "lastValidated",
    ]);

    return {
      hasLicense: !!result.licenseKey,
      isActive: result.licenseStatus === "active",
      email: result.licensedEmail || null,
      lastValidated: result.lastValidated || null,
    };
  }
}

// Make available globally for content scripts
if (typeof window !== "undefined") {
  window.GumroadAPI = GumroadAPI;
}

// Export for ES modules (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = GumroadAPI;
}
