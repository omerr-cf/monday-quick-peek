/**
 * LRU Cache Implementation for API Response Caching
 *
 * Provides in-memory caching with LRU (Least Recently Used) eviction policy
 * and automatic expiry based on TTL.
 */

(function () {
  "use strict";

  /**
   * Create an LRU cache instance
   * @param {number} maxSize - Maximum number of entries
   * @returns {Object} Cache instance with get, set, delete, clear, size methods
   */
  function createLRUCache(maxSize = 50) {
    const cache = new Map();

    return {
      /**
       * Get value from cache
       * @param {string} key - Cache key
       * @returns {Object|null} Cached value or null
       */
      get(key) {
        if (!cache.has(key)) return null;

        const value = cache.get(key);

        // Check expiry
        if (value.expiry && Date.now() > value.expiry) {
          cache.delete(key);
          return null;
        }

        // Move to end (most recently used)
        cache.delete(key);
        cache.set(key, value);
        return value;
      },

      /**
       * Set value in cache
       * @param {string} key - Cache key
       * @param {Object} value - Value to cache (must have content and expiry)
       */
      set(key, value) {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Remove least recently used (first item)
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },

      /**
       * Delete entry from cache
       * @param {string} key - Cache key
       * @returns {boolean} True if deleted
       */
      delete(key) {
        return cache.delete(key);
      },

      /**
       * Clear all cache entries
       */
      clear() {
        cache.clear();
      },

      /**
       * Get current cache size
       * @returns {number} Number of entries
       */
      size() {
        return cache.size;
      },
    };
  }

  // Export for use in other modules (service worker context)
  if (typeof self !== "undefined") {
    self.LRUCache = { create: createLRUCache };
  } else if (typeof window !== "undefined") {
    window.LRUCache = { create: createLRUCache };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { create: createLRUCache };
  }
})();
