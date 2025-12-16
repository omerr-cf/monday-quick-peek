/**
 * Usage Tracker for Monday Quick Peek Extension
 * Tracks daily tooltip views and enforces free tier limits
 *
 * Note: Requires GumroadAPI for Pro license validation
 */

class UsageTracker {
  static FREE_TIER_LIMIT = 5; // Free tier: 10 tooltip views per day
  static MAX_UPGRADE_PROMPTS = 3; // Show upgrade prompt max 3 times, then switch to banner

  /**
   * Check if usage tracking is disabled (dev mode)
   * @returns {Promise<boolean>} True if tracking is disabled
   */
  static async isTrackingDisabled() {
    try {
      // Check localStorage first (for quick dev toggle)
      if (typeof localStorage !== "undefined") {
        const localFlag = localStorage.getItem(
          "mondayQuickPeek_disableUsageTracking"
        );
        if (localFlag === "true") {
          return true;
        }
      }

      // Check chrome storage (with error handling for invalidated context)
      if (!chrome?.storage?.local) {
        // Extension context invalidated - default to false (tracking enabled)
        return false;
      }

      const result = await chrome.storage.local.get("disableUsageTracking");
      return result.disableUsageTracking === true;
    } catch (error) {
      // Extension context invalidated or other error - default to false (tracking enabled)
      console.warn(
        "UsageTracker: Error checking tracking status, defaulting to enabled",
        error
      );
      return false;
    }
  }

  /**
   * Check if user can show tooltip
   * @returns {Promise<Object>} { allowed, isPro, remaining, message, showBanner }
   */
  static async canShowTooltip() {
    // Dev mode: skip tracking
    const trackingDisabled = await this.isTrackingDisabled();
    if (trackingDisabled) {
      return {
        allowed: true,
        isPro: false,
        remaining: null,
        message: null,
        showBanner: false,
      };
    }

    const isPro = await this.isProUser();
    if (isPro) {
      return {
        allowed: true,
        isPro: true,
        remaining: null,
        message: null,
        showBanner: false,
      };
    }

    // Check if we should show banner instead of prompt
    const upgradePromptCount = await this.getUpgradePromptCount();
    const shouldShowBanner = upgradePromptCount >= this.MAX_UPGRADE_PROMPTS;

    const usage = await this.getTodayUsage();
    const limit = this.FREE_TIER_LIMIT;

    if (usage >= limit) {
      // When limit is reached:
      // - First 3 times: show upgrade prompt (allowed: false, showBanner: false)
      // - After 3 times: show banner only (allowed: false, showBanner: true)
      return {
        allowed: false, // Never allow tooltip when limit is reached
        isPro: false,
        remaining: 0,
        limit: limit,
        message: "Daily limit reached! Upgrade to Pro for unlimited views.",
        showBanner: shouldShowBanner, // Show banner only after 3 prompts
      };
    }

    const remaining = limit - usage;
    return {
      allowed: true,
      isPro: false,
      remaining: remaining,
      limit: limit,
      message: `${remaining} of ${limit} free views today`,
      showBanner: false,
    };
  }

  /**
   * Increment upgrade prompt count
   */
  static async incrementUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return;
      const result = await chrome.storage.local.get("upgradePromptCount");
      const oldCount = result.upgradePromptCount || 0;
      const newCount = oldCount + 1;
      await chrome.storage.local.set({ upgradePromptCount: newCount });
      if (newCount >= this.MAX_UPGRADE_PROMPTS) {
      }
    } catch (error) {
      console.warn(
        "UsageTracker: Error incrementing upgrade prompt count",
        error
      );
    }
  }

  /**
   * Get upgrade prompt count
   * @returns {Promise<number>} Number of times upgrade prompt was shown
   */
  static async getUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return 0;
      const result = await chrome.storage.local.get("upgradePromptCount");
      return result.upgradePromptCount || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Reset upgrade prompt count (for testing)
   */
  static async resetUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return;
      await chrome.storage.local.remove("upgradePromptCount");
    } catch (error) {}
  }

  /**
   * Increment usage counter for today
   */
  static async incrementUsage() {
    try {
      if (!chrome?.storage?.local) return;
      const today = this.getToday();
      const result = await chrome.storage.local.get("usageData");
      const usageData = result.usageData || {};

      // Increment today's count
      usageData[today] = (usageData[today] || 0) + 1;

      // Clean up old dates (keep last 7 days)
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      Object.keys(usageData).forEach((date) => {
        const dateTime = new Date(date).getTime();
        if (dateTime < cutoff) {
          delete usageData[date];
        }
      });

      await chrome.storage.local.set({ usageData: usageData });
      console.log(
        `UsageTracker: Incremented usage for ${today}. Total: ${usageData[today]}`
      );
    } catch (error) {}
  }

  /**
   * Get today's usage count
   * @returns {Promise<number>} Number of tooltip views today
   */
  static async getTodayUsage() {
    try {
      if (!chrome?.storage?.local) return 0;
      const today = this.getToday();
      const result = await chrome.storage.local.get("usageData");
      const usageData = result.usageData || {};
      return usageData[today] || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get today's date string (YYYY-MM-DD)
   * @returns {string} Today's date
   */
  static getToday() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  /**
   * Check if user is a Pro user (has valid license)
   * @returns {Promise<boolean>} True if user is Pro
   */
  static async isProUser() {
    try {
      // Use GumroadAPI to check license status
      if (typeof window !== "undefined" && window.GumroadAPI) {
        const status = await window.GumroadAPI.checkLicenseStatus();
        return status.isPro;
      }

      // Fallback: check storage directly (for background script context)
      // In background script, we need to use chrome.storage directly
      if (!chrome?.storage?.sync) {
        // Extension context invalidated - default to false (not Pro)
        return false;
      }

      const { licenseStatus } = await chrome.storage.sync.get("licenseStatus");
      return licenseStatus === "active";
    } catch (error) {
      // Extension context invalidated or other error - default to false (not Pro)
      console.warn(
        "UsageTracker: Error checking Pro status, defaulting to free",
        error
      );
      return false;
    }
  }

  /**
   * Reset usage data (for testing or admin purposes)
   */
  static async resetUsage() {
    try {
      if (!chrome?.storage?.local) return;
      await chrome.storage.local.remove("usageData");
    } catch (error) {}
  }

  /**
   * Get usage statistics
   * @returns {Promise<Object>} Usage stats
   */
  static async getUsageStats() {
    try {
      if (!chrome?.storage?.local) {
        return {
          today: 0,
          limit: this.FREE_TIER_LIMIT,
          remaining: this.FREE_TIER_LIMIT,
          isPro: false,
          allTime: 0,
        };
      }
      const result = await chrome.storage.local.get("usageData");
      const usageData = result.usageData || {};
      const today = this.getToday();
      const todayUsage = usageData[today] || 0;
      const isPro = await this.isProUser();

      return {
        today: todayUsage,
        limit: this.FREE_TIER_LIMIT,
        remaining: Math.max(0, this.FREE_TIER_LIMIT - todayUsage),
        isPro: isPro,
        allTime: Object.values(usageData).reduce(
          (sum, count) => sum + count,
          0
        ),
      };
    } catch (error) {
      return {
        today: 0,
        limit: this.FREE_TIER_LIMIT,
        remaining: this.FREE_TIER_LIMIT,
        isPro: false,
        allTime: 0,
      };
    }
  }

  /**
   * Increment upgrade prompt count (duplicate - keeping the one with error handling)
   */
  static async incrementUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return;
      const result = await chrome.storage.local.get("upgradePromptCount");
      const count = (result.upgradePromptCount || 0) + 1;
      await chrome.storage.local.set({ upgradePromptCount: count });
    } catch (error) {
      console.warn(
        "UsageTracker: Error incrementing upgrade prompt count",
        error
      );
    }
  }

  /**
   * Get upgrade prompt count (duplicate - keeping the one with error handling)
   * @returns {Promise<number>} Number of times upgrade prompt was shown
   */
  static async getUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return 0;
      const result = await chrome.storage.local.get("upgradePromptCount");
      return result.upgradePromptCount || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Reset upgrade prompt count (for testing) (duplicate - keeping the one with error handling)
   */
  static async resetUpgradePromptCount() {
    try {
      if (!chrome?.storage?.local) return;
      await chrome.storage.local.remove("upgradePromptCount");
    } catch (error) {}
  }

  /**
   * Toggle usage tracking (dev mode)
   * @param {boolean} disabled - True to disable tracking
   */
  static async setTrackingDisabled(disabled) {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ disableUsageTracking: disabled });
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "mondayQuickPeek_disableUsageTracking",
          disabled ? "true" : "false"
        );
      }
      console.log(
        `UsageTracker: Usage tracking ${disabled ? "disabled" : "enabled"}`
      );
    } catch (error) {}
  }

  /**
   * Reset all usage tracking data (for testing)
   */
  static async resetAll() {
    try {
      await this.resetUsage();
      await this.resetUpgradePromptCount();
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove("disableUsageTracking");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("mondayQuickPeek_disableUsageTracking");
      }
      // Also clear sessionStorage banner dismissals
      if (typeof sessionStorage !== "undefined") {
        const today = this.getToday();
        sessionStorage.removeItem(`bannerDismissed_${today}`);
        // Clear all banner dismissals (in case of multiple days)
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("bannerDismissed_")) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      throw error; // Re-throw so popup can handle it
    }
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = UsageTracker;
} else {
  // Make available globally
  window.UsageTracker = UsageTracker;
}
