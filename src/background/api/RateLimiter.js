/**
 * Rate Limiter for Monday.com API Calls
 *
 * Prevents exceeding API rate limits with exponential backoff
 */

(function () {
  "use strict";

  const CONFIG = {
    maxRequestsPerMinute: 50,
    backoffBaseDelay: 1000,
    backoffMaxDelay: 60000,
    rateLimitDelay: 1000,
  };

  // Rate limiting tracking
  const rateLimitTracker = {
    requests: [], // Array of timestamps
    backoffUntil: null, // Timestamp when we can retry after rate limit
    backoffAttempts: 0, // Number of consecutive rate limit hits
  };

  const RateLimiter = {
    /**
     * Check rate limiting before making API call
     * @returns {Promise<void>}
     * @throws {Error} If rate limit exceeded
     */
    async checkRateLimit() {
      const now = Date.now();

      // Check if we're in backoff period
      if (
        rateLimitTracker.backoffUntil &&
        now < rateLimitTracker.backoffUntil
      ) {
        const waitTime = rateLimitTracker.backoffUntil - now;
        throw new Error(
          `Rate limit exceeded. Please wait ${Math.ceil(
            waitTime / 1000
          )} seconds before trying again.`
        );
      }

      // Clear old requests (older than 1 minute)
      const oneMinuteAgo = now - 60 * 1000;
      rateLimitTracker.requests = rateLimitTracker.requests.filter(
        (timestamp) => timestamp > oneMinuteAgo
      );

      // Check if we're approaching rate limit
      if (rateLimitTracker.requests.length >= CONFIG.maxRequestsPerMinute) {
        // Wait a bit before allowing next request
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.rateLimitDelay)
        );
      }

      // Record this request
      rateLimitTracker.requests.push(now);
    },

    /**
     * Handle rate limit error with exponential backoff
     */
    handleRateLimit() {
      rateLimitTracker.backoffAttempts++;
      const backoffDelay = Math.min(
        CONFIG.backoffBaseDelay *
          Math.pow(2, rateLimitTracker.backoffAttempts - 1),
        CONFIG.backoffMaxDelay
      );

      rateLimitTracker.backoffUntil = Date.now() + backoffDelay;
    },

    /**
     * Reset rate limit tracking (on successful request)
     */
    resetBackoff() {
      if (rateLimitTracker.backoffAttempts > 0) {
        rateLimitTracker.backoffAttempts = 0;
        rateLimitTracker.backoffUntil = null;
      }
    },

    /**
     * Get current rate limit status
     * @returns {Object} Status information
     */
    getStatus() {
      return {
        requestsInLastMinute: rateLimitTracker.requests.length,
        maxRequests: CONFIG.maxRequestsPerMinute,
        backoffUntil: rateLimitTracker.backoffUntil,
        backoffAttempts: rateLimitTracker.backoffAttempts,
      };
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.RateLimiter = RateLimiter;
  } else if (typeof window !== "undefined") {
    window.RateLimiter = RateLimiter;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RateLimiter;
  }
})();
