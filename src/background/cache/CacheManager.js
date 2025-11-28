/**
 * Cache Manager for Background Service Worker
 *
 * Manages API response caching with expiry and cache key generation
 */

(function () {
  "use strict";

  // Import LRU Cache (will be loaded before this script)
  const getLRUCache = () => {
    const global = typeof self !== "undefined" ? self : window;
    if (global && global.LRUCache) {
      return global.LRUCache.create(50); // Max 50 entries
    }
    // Fallback if LRUCache not available
    console.warn("CacheManager: LRUCache not found, using fallback");
    return {
      get: () => null,
      set: () => {},
      delete: () => {},
      clear: () => {},
      size: () => 0,
    };
  };

  const apiCache = getLRUCache();
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  const CacheManager = {
    /**
     * Get cached API response
     * @param {string} key - Cache key
     * @returns {string|null} Cached content or null
     */
    get(key) {
      const cached = apiCache.get(key);
      if (!cached) return null;

      // Double-check expiry
      if (cached.expiry && Date.now() > cached.expiry) {
        apiCache.delete(key);
        return null;
      }

      return cached.content;
    },

    /**
     * Set cached API response
     * @param {string} key - Cache key
     * @param {string} content - Content to cache
     */
    set(key, content) {
      apiCache.set(key, {
        content: content,
        expiry: Date.now() + CACHE_EXPIRY,
      });
    },

    /**
     * Generate cache key from parameters
     * @param {string} type - Content type
     * @param {string} itemId - Item ID
     * @param {string} updateId - Optional update ID
     * @returns {string} Cache key
     */
    generateKey(type, itemId, updateId = "") {
      return `${type}-${itemId}-${updateId || ""}`;
    },

    /**
     * Clear all cache entries
     */
    clear() {
      apiCache.clear();
    },

    /**
     * Get cache size
     * @returns {number} Number of cached entries
     */
    size() {
      return apiCache.size();
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.CacheManager = CacheManager;
  } else if (typeof window !== "undefined") {
    window.CacheManager = CacheManager;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CacheManager;
  }
})();
