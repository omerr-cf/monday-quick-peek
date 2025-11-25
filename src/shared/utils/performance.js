/**
 * Performance Utility Functions
 * Debouncing, throttling, and caching utilities
 */

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function - limits execution to once per limit time
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastResult;
  return function (...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * LRU Cache implementation
 * @param {number} maxSize - Maximum cache size
 * @returns {Object} LRU cache instance
 */
export function createLRUCache(maxSize = 50) {
  const cache = new Map();

  return {
    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null
     */
    get(key) {
      if (!cache.has(key)) return null;
      const value = cache.get(key);
      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, value);
      return value;
    },

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    set(key, value) {
      if (cache.has(key)) {
        // Update existing - move to end
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Remove least recently used (first item)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists
     */
    has(key) {
      return cache.has(key);
    },

    /**
     * Delete key from cache
     * @param {string} key - Cache key
     * @returns {boolean} True if key was deleted
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
     * Get cache size
     * @returns {number} Number of entries
     */
    size() {
      return cache.size;
    },

    /**
     * Get all keys
     * @returns {Array} Array of keys
     */
    keys() {
      return Array.from(cache.keys());
    },
  };
}

/**
 * Request cancellation utility
 * Tracks and cancels in-flight requests
 */
export class RequestCanceller {
  constructor() {
    this.requests = new Map();
  }

  /**
   * Register a cancellable request
   * @param {string} key - Request identifier
   * @param {AbortController} controller - AbortController for the request
   */
  register(key, controller) {
    // Cancel previous request with same key
    if (this.requests.has(key)) {
      this.requests.get(key).abort();
    }
    this.requests.set(key, controller);
  }

  /**
   * Cancel a specific request
   * @param {string} key - Request identifier
   */
  cancel(key) {
    if (this.requests.has(key)) {
      this.requests.get(key).abort();
      this.requests.delete(key);
    }
  }

  /**
   * Cancel all requests
   */
  cancelAll() {
    this.requests.forEach((controller) => controller.abort());
    this.requests.clear();
  }

  /**
   * Remove a request (after completion)
   * @param {string} key - Request identifier
   */
  remove(key) {
    this.requests.delete(key);
  }
}

/**
 * Performance monitor utility
 * Tracks performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      tooltipShown: 0,
      tooltipHidden: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
      loadTimes: [],
    };
  }

  /**
   * Record a metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   */
  record(metric, value = 1) {
    if (this.metrics[metric] !== undefined) {
      if (typeof this.metrics[metric] === "number") {
        this.metrics[metric] += value;
      }
    } else {
      this.metrics[metric] = value;
    }
  }

  /**
   * Record load time
   * @param {number} time - Load time in milliseconds
   */
  recordLoadTime(time) {
    this.metrics.loadTimes.push(time);
    // Keep only last 100 measurements
    if (this.metrics.loadTimes.length > 100) {
      this.metrics.loadTimes.shift();
    }
    // Calculate average
    const sum = this.metrics.loadTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageLoadTime = sum / this.metrics.loadTimes.length;
  }

  /**
   * Get metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      tooltipShown: 0,
      tooltipHidden: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
      loadTimes: [],
    };
  }
}
