/**
 * Usage Tracker for Monday Quick Peek Extension
 * Tracks daily tooltip views and enforces free tier limits
 */

class UsageTracker {
  static FREE_TIER_LIMIT = 10; // Free tier: 10 tooltip views per day
  static MAX_UPGRADE_PROMPTS = 3; // Show upgrade prompt max 3 times, then switch to banner

  /**
   * Check if usage tracking is disabled (dev mode)
   * @returns {Promise<boolean>} True if tracking is disabled
   */
  static async isTrackingDisabled() {
    // Check localStorage first (for quick dev toggle)
    if (typeof localStorage !== "undefined") {
      const localFlag = localStorage.getItem(
        "mondayQuickPeek_disableUsageTracking"
      );
      if (localFlag === "true") {
        return true;
      }
    }

    // Check chrome storage
    const result = await chrome.storage.local.get("disableUsageTracking");
    return result.disableUsageTracking === true;
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
      return {
        allowed: shouldShowBanner, // Allow tooltip if showing banner instead
        isPro: false,
        remaining: 0,
        limit: limit,
        message: "Daily limit reached! Upgrade to Pro for unlimited views.",
        showBanner: shouldShowBanner,
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
    const result = await chrome.storage.local.get("upgradePromptCount");
    const count = (result.upgradePromptCount || 0) + 1;
    await chrome.storage.local.set({ upgradePromptCount: count });
    console.log(`UsageTracker: Upgrade prompt shown ${count} times`);
  }

  /**
   * Get upgrade prompt count
   * @returns {Promise<number>} Number of times upgrade prompt was shown
   */
  static async getUpgradePromptCount() {
    const result = await chrome.storage.local.get("upgradePromptCount");
    return result.upgradePromptCount || 0;
  }

  /**
   * Reset upgrade prompt count (for testing)
   */
  static async resetUpgradePromptCount() {
    await chrome.storage.local.remove("upgradePromptCount");
    console.log("UsageTracker: Upgrade prompt count reset");
  }

  /**
   * Increment usage counter for today
   */
  static async incrementUsage() {
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
  }

  /**
   * Get today's usage count
   * @returns {Promise<number>} Number of tooltip views today
   */
  static async getTodayUsage() {
    const today = this.getToday();
    const result = await chrome.storage.local.get("usageData");
    const usageData = result.usageData || {};
    return usageData[today] || 0;
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
   * Check if user is a Pro user
   * @returns {Promise<boolean>} True if Pro user
   */
  static async isProUser() {
    const result = await chrome.storage.sync.get("licenseKey");
    const licenseKey = result.licenseKey;

    if (!licenseKey) {
      return false;
    }

    // Validate license (will be implemented in next prompt)
    const isValid = await this.validateLicense(licenseKey);
    return isValid;
  }

  /**
   * Validate license key
   * @param {string} licenseKey - License key to validate
   * @returns {Promise<boolean>} True if license is valid
   */
  static async validateLicense(licenseKey) {
    // Placeholder - will implement in Prompt 18 (Gumroad integration)
    // For now, check if license status is stored locally
    const result = await chrome.storage.local.get("licenseStatus");
    return result.licenseStatus === "active";
  }

  /**
   * Reset usage data (for testing or admin purposes)
   */
  static async resetUsage() {
    await chrome.storage.local.remove("usageData");
    console.log("UsageTracker: Usage data reset");
  }

  /**
   * Get usage statistics
   * @returns {Promise<Object>} Usage stats
   */
  static async getUsageStats() {
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
      allTime: Object.values(usageData).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Increment upgrade prompt count
   */
  static async incrementUpgradePromptCount() {
    const result = await chrome.storage.local.get("upgradePromptCount");
    const count = (result.upgradePromptCount || 0) + 1;
    await chrome.storage.local.set({ upgradePromptCount: count });
    console.log(`UsageTracker: Upgrade prompt shown ${count} times`);
  }

  /**
   * Get upgrade prompt count
   * @returns {Promise<number>} Number of times upgrade prompt was shown
   */
  static async getUpgradePromptCount() {
    const result = await chrome.storage.local.get("upgradePromptCount");
    return result.upgradePromptCount || 0;
  }

  /**
   * Reset upgrade prompt count (for testing)
   */
  static async resetUpgradePromptCount() {
    await chrome.storage.local.remove("upgradePromptCount");
    console.log("UsageTracker: Upgrade prompt count reset");
  }

  /**
   * Toggle usage tracking (dev mode)
   * @param {boolean} disabled - True to disable tracking
   */
  static async setTrackingDisabled(disabled) {
    await chrome.storage.local.set({ disableUsageTracking: disabled });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "mondayQuickPeek_disableUsageTracking",
        disabled ? "true" : "false"
      );
    }
    console.log(
      `UsageTracker: Usage tracking ${disabled ? "disabled" : "enabled"}`
    );
  }

  /**
   * Reset all usage tracking data (for testing)
   */
  static async resetAll() {
    await this.resetUsage();
    await this.resetUpgradePromptCount();
    await chrome.storage.local.remove("disableUsageTracking");
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("mondayQuickPeek_disableUsageTracking");
    }
    console.log("UsageTracker: All usage data reset");
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = UsageTracker;
} else {
  // Make available globally
  window.UsageTracker = UsageTracker;
}
