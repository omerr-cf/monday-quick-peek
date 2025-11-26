/**
 * Application Constants - Shared Configuration
 * Centralized configuration values accessible across all extension scripts
 *
 * This file provides a single source of truth for all configuration,
 * including Gumroad URLs and product settings.
 */

(function () {
  "use strict";

  // Main configuration object
  const CONFIG = {
    // Tooltip settings
    hoverDelay: 500, // Delay before showing tooltip (ms)
    hideDelay: 200, // Delay before hiding tooltip (ms)
    tooltipId: "quick-peek-tooltip",
    tooltipOffset: 15, // Distance from cursor/element
    zIndex: 999999, // High z-index to appear above Monday.com UI

    // Search settings
    searchDebounceMs: 150, // Debounce delay for search input

    // API settings
    apiBaseUrl: "https://api.monday.com/v2",
    apiVersion: "2023-10",
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 100,
    rateLimitDelay: 1000, // Delay between requests
    maxRequestsPerMinute: 50,
    backoffBaseDelay: 1000, // Base delay for exponential backoff (ms)
    backoffMaxDelay: 60000, // Maximum backoff delay (1 minute)

    // Retry settings
    maxRetries: 5, // Maximum retry attempts for attaching listeners
    retryDelay: 1000, // Delay between retries (ms)

    // Gumroad settings - SINGLE SOURCE OF TRUTH
    gumroad: {
      productUrl: "https://busymind.gumroad.com/l/monday-quick-peek-pro",
      productPermalink: "monday-quick-peek-pro", // Product permalink for API calls
      productId: "vwCBiUmNcdA9nJ6oUfhI6A==", // Product ID required by Gumroad API
    },
  };

  // Expose CONFIG globally for all scripts
  if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
  }

  // Also expose for Node.js/CommonJS if needed
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CONFIG;
  }

  // Also expose for ES6 modules if needed
  if (typeof exports !== "undefined") {
    exports.CONFIG = CONFIG;
  }
})();
