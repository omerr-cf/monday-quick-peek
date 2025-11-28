/**
 * Storage Utility for Monday Quick Peek Extension
 *
 * Provides wrapper functions for Chrome Storage API with error handling,
 * caching, and settings management.
 *
 * Uses:
 * - chrome.storage.sync for API key and settings (syncs across devices, 100KB limit)
 * - chrome.storage.local for cache data (larger storage, device-specific)
 */

/**
 * Storage utility object
 */
const storage = {
  /**
   * Save API key to Chrome sync storage
   * @param {string} apiKey - Monday.com API key to save
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async saveApiKey(apiKey) {
    try {
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        throw new Error("Invalid API key: key cannot be empty");
      }

      // Validate API key format
      if (apiKey.length < 20) {
        throw new Error("Invalid API key: key must be at least 20 characters");
      }

      await chrome.storage.sync.set({ apiKey: apiKey.trim() });

      // Also save validation status
      await chrome.storage.sync.set({ apiKeyValid: true });

      return { success: true };
    } catch (error) {
      // Handle quota exceeded error
      if (error.message && error.message.includes("QUOTA")) {
        return {
          success: false,
          error:
            "Storage quota exceeded. Please clear some data and try again.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to save API key",
      };
    }
  },

  /**
   * Get API key from Chrome sync storage
   * @returns {Promise<string|null>} API key or null if not found
   */
  async getApiKey() {
    try {
      const result = await chrome.storage.sync.get("apiKey");
      return result.apiKey || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Clear API key from Chrome sync storage
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async clearApiKey() {
    try {
      await chrome.storage.sync.remove(["apiKey", "apiKeyValid"]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to clear API key",
      };
    }
  },

  /**
   * Save user settings to Chrome sync storage
   * @param {Object} settings - Settings object to save
   * @param {number} [settings.hoverDelay] - Hover delay in milliseconds
   * @param {string} [settings.tooltipPosition] - Tooltip position preference
   * @param {number} [settings.cacheExpiry] - Cache expiry time in minutes
   * @param {boolean} [settings.enableNotifications] - Enable notifications
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async saveSettings(settings) {
    try {
      if (!settings || typeof settings !== "object") {
        throw new Error("Invalid settings: must be an object");
      }

      // Get existing settings to merge
      const existing = await this.getSettings();
      const mergedSettings = { ...existing, ...settings };

      // Validate settings
      if (mergedSettings.hoverDelay !== undefined) {
        if (
          typeof mergedSettings.hoverDelay !== "number" ||
          mergedSettings.hoverDelay < 0 ||
          mergedSettings.hoverDelay > 10000
        ) {
          throw new Error(
            "Invalid hoverDelay: must be a number between 0 and 10000"
          );
        }
      }

      if (mergedSettings.cacheExpiry !== undefined) {
        if (
          typeof mergedSettings.cacheExpiry !== "number" ||
          mergedSettings.cacheExpiry < 1 ||
          mergedSettings.cacheExpiry > 1440
        ) {
          throw new Error(
            "Invalid cacheExpiry: must be a number between 1 and 1440 minutes"
          );
        }
      }

      // Add last sync timestamp
      mergedSettings.lastSyncTimestamp = Date.now();

      await chrome.storage.sync.set({ settings: mergedSettings });

      return { success: true };
    } catch (error) {
      // Handle quota exceeded error
      if (error.message && error.message.includes("QUOTA")) {
        return {
          success: false,
          error:
            "Storage quota exceeded. Please clear some data and try again.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to save settings",
      };
    }
  },

  /**
   * Get user settings from Chrome sync storage
   * @returns {Promise<Object>} Settings object with default values
   */
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get("settings");
      const settings = result.settings || {};

      // Return settings with defaults
      return {
        hoverDelay: settings.hoverDelay ?? 500, // Default 500ms
        tooltipPosition: settings.tooltipPosition ?? "auto", // Default auto
        cacheExpiry: settings.cacheExpiry ?? 5, // Default 5 minutes
        enableNotifications: settings.enableNotifications ?? true,
        lastSyncTimestamp: settings.lastSyncTimestamp ?? null,
      };
    } catch (error) {
      // Return default settings on error
      return {
        hoverDelay: 500,
        tooltipPosition: "auto",
        cacheExpiry: 5,
        enableNotifications: true,
        lastSyncTimestamp: null,
      };
    }
  },

  /**
   * Get a specific setting value
   * @param {string} key - Setting key
   * @returns {Promise<any>} Setting value or default
   */
  async getSetting(key) {
    try {
      const settings = await this.getSettings();
      return settings[key];
    } catch (error) {
      return null;
    }
  },

  /**
   * Save data to cache in Chrome local storage
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} [expiryMinutes=5] - Expiry time in minutes
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async saveToCache(key, data, expiryMinutes = 5) {
    try {
      if (!key || typeof key !== "string") {
        throw new Error("Invalid cache key: must be a non-empty string");
      }

      if (expiryMinutes < 1 || expiryMinutes > 1440) {
        throw new Error(
          "Invalid expiryMinutes: must be between 1 and 1440 minutes"
        );
      }

      const cacheData = {
        data: data,
        expiry: Date.now() + expiryMinutes * 60 * 1000,
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ [key]: cacheData });

      return { success: true };
    } catch (error) {
      // Handle quota exceeded error
      if (error.message && error.message.includes("QUOTA")) {
        // Try to clear old cache entries
        await this.clearExpiredCache();
        // Retry once
        try {
          const cacheData = {
            data: data,
            expiry: Date.now() + expiryMinutes * 60 * 1000,
            timestamp: Date.now(),
          };
          await chrome.storage.local.set({ [key]: cacheData });
          return { success: true };
        } catch (retryError) {
          return {
            success: false,
            error: "Storage quota exceeded. Please clear cache and try again.",
          };
        }
      }

      return {
        success: false,
        error: error.message || "Failed to save to cache",
      };
    }
  },

  /**
   * Get data from cache in Chrome local storage
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached data or null if not found/expired
   */
  async getFromCache(key) {
    try {
      if (!key || typeof key !== "string") {
        return null;
      }

      const result = await chrome.storage.local.get(key);
      const cached = result[key];

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      if (Date.now() > cached.expiry) {
        // Remove expired cache entry
        await chrome.storage.local.remove(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Clear a specific cache entry
   * @param {string} key - Cache key to clear
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async clearCacheEntry(key) {
    try {
      await chrome.storage.local.remove(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to clear cache entry",
      };
    }
  },

  /**
   * Clear all expired cache entries
   * @returns {Promise<{success: boolean, cleared: number, error?: string}>} Result object
   */
  async clearExpiredCache() {
    try {
      const allData = await chrome.storage.local.get(null);
      const now = Date.now();
      let clearedCount = 0;

      for (const [key, value] of Object.entries(allData)) {
        // Check if it's a cache entry (has expiry property)
        if (value && typeof value === "object" && value.expiry) {
          if (now > value.expiry) {
            await chrome.storage.local.remove(key);
            clearedCount++;
          }
        }
      }

      return { success: true, cleared: clearedCount };
    } catch (error) {
      return {
        success: false,
        cleared: 0,
        error: error.message || "Failed to clear expired cache",
      };
    }
  },

  /**
   * Clear all cache entries
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async clearAllCache() {
    try {
      await chrome.storage.local.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to clear all cache",
      };
    }
  },

  /**
   * Get cache statistics
   * @returns {Promise<{totalEntries: number, expiredEntries: number, totalSize: number}>} Cache stats
   */
  async getCacheStats() {
    try {
      const allData = await chrome.storage.local.get(null);
      const now = Date.now();
      let totalEntries = 0;
      let expiredEntries = 0;
      let totalSize = 0;

      for (const [key, value] of Object.entries(allData)) {
        if (value && typeof value === "object" && value.expiry) {
          totalEntries++;
          totalSize += JSON.stringify(value).length;

          if (now > value.expiry) {
            expiredEntries++;
          }
        }
      }

      return {
        totalEntries,
        expiredEntries,
        totalSize,
      };
    } catch (error) {
      return {
        totalEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
      };
    }
  },

  /**
   * Check if storage quota is available
   * @param {number} requiredBytes - Required bytes
   * @returns {Promise<{available: boolean, error?: string}>} Availability check result
   */
  async checkStorageQuota(requiredBytes = 0) {
    try {
      // Chrome sync storage limit is approximately 100KB
      const syncLimit = 100 * 1024; // 100KB
      const localLimit = 10 * 1024 * 1024; // 10MB (approximate)

      // Get current usage
      const syncUsage = await chrome.storage.sync.getBytesInUse(null);
      const localUsage = await chrome.storage.local.getBytesInUse(null);

      const syncAvailable = syncUsage + requiredBytes < syncLimit;
      const localAvailable = localUsage + requiredBytes < localLimit;

      return {
        available: syncAvailable && localAvailable,
        syncUsage,
        syncLimit,
        syncAvailable,
        localUsage,
        localLimit,
        localAvailable,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message || "Failed to check storage quota",
      };
    }
  },

  /**
   * Get API key validation status
   * @returns {Promise<boolean>} True if API key is marked as valid
   */
  async getApiKeyValid() {
    try {
      const result = await chrome.storage.sync.get("apiKeyValid");
      return result.apiKeyValid === true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Set API key validation status
   * @param {boolean} isValid - Validation status
   * @returns {Promise<{success: boolean, error?: string}>} Result object
   */
  async setApiKeyValid(isValid) {
    try {
      await chrome.storage.sync.set({ apiKeyValid: isValid });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to set API key validation status",
      };
    }
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = storage;
} else {
  // Make available globally
  window.storage = storage;
}
