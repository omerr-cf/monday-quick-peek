/**
 * Error Handler Utility for Monday Quick Peek Extension
 *
 * Provides centralized error handling, logging, and user-friendly error messages
 * with recovery strategies and retry logic.
 */

/**
 * Error codes used throughout the extension
 */
const ERROR_CODES = {
  API_KEY_INVALID: "API_KEY_INVALID",
  API_KEY_MISSING: "API_KEY_MISSING",
  NETWORK_ERROR: "NETWORK_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  MONDAY_DOWN: "MONDAY_DOWN",
  STORAGE_ERROR: "STORAGE_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.API_KEY_INVALID]:
    "Invalid API key. Please check your settings and try again.",
  [ERROR_CODES.API_KEY_MISSING]:
    "API key not configured. Click to open settings and add your API key.",
  [ERROR_CODES.NETWORK_ERROR]:
    "Network error. Please check your internet connection and try again.",
  [ERROR_CODES.RATE_LIMITED]:
    "Too many requests. Please wait a moment and try again.",
  [ERROR_CODES.TASK_NOT_FOUND]:
    "Task not found. The task may have been deleted or you don't have access.",
  [ERROR_CODES.MONDAY_DOWN]:
    "Monday.com API is currently unavailable. Please try again later.",
  [ERROR_CODES.STORAGE_ERROR]:
    "Storage error. Please check your browser storage permissions.",
  [ERROR_CODES.PERMISSION_DENIED]:
    "Permission denied. Please check your API key permissions.",
  [ERROR_CODES.UNKNOWN_ERROR]:
    "Something went wrong. Please try again or contact support.",
};

/**
 * Error recovery actions
 */
const ERROR_ACTIONS = {
  [ERROR_CODES.API_KEY_INVALID]: {
    action: "openSettings",
    label: "Open Settings",
    url: chrome.runtime.getURL("popup.html"),
  },
  [ERROR_CODES.API_KEY_MISSING]: {
    action: "openSettings",
    label: "Add API Key",
    url: chrome.runtime.getURL("popup.html"),
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    action: "retry",
    label: "Retry",
  },
  [ERROR_CODES.RATE_LIMITED]: {
    action: "wait",
    label: "Wait",
  },
  [ERROR_CODES.TASK_NOT_FOUND]: {
    action: "dismiss",
    label: "Dismiss",
  },
  [ERROR_CODES.MONDAY_DOWN]: {
    action: "retry",
    label: "Retry Later",
  },
};

/**
 * Error Handler Class
 */
class ErrorHandler {
  /**
   * Handle an error with context
   * @param {Error|Object} error - Error object or error info
   * @param {string} context - Context where error occurred
   * @param {Object} options - Additional options
   * @param {boolean} options.showUI - Show error UI (default: true)
   * @param {boolean} options.logError - Log error to console (default: true)
   * @param {boolean} options.retry - Enable retry logic (default: false)
   * @param {Function} options.retryCallback - Callback for retry
   * @returns {Object} Error information object
   */
  static handle(error, context = "", options = {}) {
    const {
      showUI = true,
      logError = true,
      retry = false,
      retryCallback = null,
    } = options;

    // Normalize error object
    const errorInfo = this.normalizeError(error);

    // Log error
    if (logError) {
      this.logError(errorInfo, context);
    }

    // Get user-friendly message
    const userMessage = this.getUserMessage(errorInfo);

    // Show error UI
    if (showUI) {
      this.showErrorUI(userMessage, errorInfo, options);
    }

    // Handle retry logic
    if (retry && retryCallback && this.isRetryable(errorInfo)) {
      this.handleRetry(errorInfo, retryCallback, context);
    }

    return errorInfo;
  }

  /**
   * Normalize error object to standard format
   * @param {Error|Object} error - Error to normalize
   * @returns {Object} Normalized error object
   */
  static normalizeError(error) {
    // If already normalized
    if (error && error.code && error.message) {
      return error;
    }

    // If Error object
    if (error instanceof Error) {
      return this.classifyError(error);
    }

    // If string
    if (typeof error === "string") {
      return {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error,
        originalError: error,
      };
    }

    // If object with message
    if (error && error.message) {
      return this.classifyError(error);
    }

    // Default
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: "An unknown error occurred",
      originalError: error,
    };
  }

  /**
   * Classify error based on message and properties
   * @param {Error|Object} error - Error to classify
   * @returns {Object} Classified error object
   */
  static classifyError(error) {
    const message = error.message || String(error);
    const lowerMessage = message.toLowerCase();

    // API key errors
    if (
      lowerMessage.includes("invalid api key") ||
      lowerMessage.includes("invalid token") ||
      lowerMessage.includes("unauthorized") ||
      lowerMessage.includes("authentication failed") ||
      error.status === 401
    ) {
      return {
        code: ERROR_CODES.API_KEY_INVALID,
        message: message,
        originalError: error,
        status: error.status,
      };
    }

    // Network errors
    if (
      lowerMessage.includes("network") ||
      lowerMessage.includes("fetch") ||
      lowerMessage.includes("connection") ||
      lowerMessage.includes("failed to fetch") ||
      error.name === "TypeError"
    ) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: message,
        originalError: error,
      };
    }

    // Rate limiting
    if (
      lowerMessage.includes("rate limit") ||
      lowerMessage.includes("too many requests") ||
      error.status === 429
    ) {
      return {
        code: ERROR_CODES.RATE_LIMITED,
        message: message,
        originalError: error,
        status: error.status,
      };
    }

    // Task not found
    if (
      lowerMessage.includes("not found") ||
      lowerMessage.includes("does not exist") ||
      error.status === 404
    ) {
      return {
        code: ERROR_CODES.TASK_NOT_FOUND,
        message: message,
        originalError: error,
        status: error.status,
      };
    }

    // Monday.com down
    if (
      error.status >= 500 ||
      lowerMessage.includes("unavailable") ||
      lowerMessage.includes("server error")
    ) {
      return {
        code: ERROR_CODES.MONDAY_DOWN,
        message: message,
        originalError: error,
        status: error.status,
      };
    }

    // Permission denied
    if (error.status === 403 || lowerMessage.includes("permission")) {
      return {
        code: ERROR_CODES.PERMISSION_DENIED,
        message: message,
        originalError: error,
        status: error.status,
      };
    }

    // Default classification
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: message,
      originalError: error,
      status: error.status,
    };
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Error information object
   * @returns {string} User-friendly message
   */
  static getUserMessage(errorInfo) {
    return (
      ERROR_MESSAGES[errorInfo.code] ||
      ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
    );
  }

  /**
   * Get error recovery action
   * @param {Object} errorInfo - Error information object
   * @returns {Object|null} Action object or null
   */
  static getErrorAction(errorInfo) {
    return ERROR_ACTIONS[errorInfo.code] || null;
  }

  /**
   * Check if error is retryable
   * @param {Object} errorInfo - Error information object
   * @returns {boolean} True if error is retryable
   */
  static isRetryable(errorInfo) {
    const retryableCodes = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.RATE_LIMITED,
      ERROR_CODES.MONDAY_DOWN,
    ];
    return retryableCodes.includes(errorInfo.code);
  }

  /**
   * Show error UI in tooltip
   * @param {string} message - Error message
   * @param {Object} errorInfo - Error information
   * @param {Object} options - Display options
   */
  static showErrorUI(message, errorInfo, options = {}) {
    const tooltip = document.getElementById("quick-peek-tooltip");
    if (!tooltip) {
      console.warn("ErrorHandler: Tooltip element not found");
      return;
    }

    // Get action for this error
    const action = this.getErrorAction(errorInfo);
    const autoDismiss = options.autoDismiss !== false; // Default: true
    const dismissDelay = options.dismissDelay || 5000; // Default: 5 seconds

    // Build error HTML
    let actionHTML = "";
    if (action) {
      if (action.action === "openSettings") {
        actionHTML = `
          <button class="error-action-btn" onclick="window.open('${action.url}', '_blank')">
            ${action.label}
          </button>
        `;
      } else if (action.action === "retry" && options.retryCallback) {
        actionHTML = `
          <button class="error-action-btn" onclick="window.errorHandlerRetry()">
            ${action.label}
          </button>
        `;
        // Store retry callback globally for onclick
        window.errorHandlerRetry = () => {
          if (options.retryCallback) {
            options.retryCallback();
          }
        };
      } else {
        actionHTML = `
          <button class="error-action-btn error-dismiss-btn">
            ${action.label}
          </button>
        `;
      }
    }

    const errorHTML = `
      <div class="error-container">
        <div class="error-header">
          <span class="error-icon">⚠️</span>
          <span class="error-title">Error</span>
        </div>
        <div class="error-message">${this.escapeHtml(message)}</div>
        ${actionHTML}
        ${
          autoDismiss
            ? `<div class="error-auto-dismiss">Auto-dismissing in <span class="error-countdown">${
                dismissDelay / 1000
              }</span>s</div>`
            : ""
        }
      </div>
    `;

    // Update tooltip
    tooltip.innerHTML = errorHTML;
    tooltip.classList.add("error-state");
    tooltip.style.display = "block";

    // Add dismiss button handler
    const dismissBtn = tooltip.querySelector(".error-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        this.dismissErrorUI(tooltip);
      });
    }

    // Auto-dismiss timer
    if (autoDismiss) {
      let countdown = dismissDelay / 1000;
      const countdownEl = tooltip.querySelector(".error-countdown");
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownEl) {
          countdownEl.textContent = countdown;
        }
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          this.dismissErrorUI(tooltip);
        }
      }, 1000);
    }
  }

  /**
   * Dismiss error UI
   * @param {HTMLElement} tooltip - Tooltip element
   */
  static dismissErrorUI(tooltip) {
    if (tooltip) {
      tooltip.classList.remove("error-state");
      tooltip.style.display = "none";
      tooltip.innerHTML = "";
    }
  }

  /**
   * Handle retry logic with exponential backoff
   * @param {Object} errorInfo - Error information
   * @param {Function} retryCallback - Function to retry
   * @param {string} context - Error context
   * @param {number} attempt - Current attempt number
   * @param {number} maxRetries - Maximum retries
   */
  static async handleRetry(
    errorInfo,
    retryCallback,
    context = "",
    attempt = 1,
    maxRetries = 3
  ) {
    if (attempt > maxRetries) {
      console.error(
        `ErrorHandler: Max retries (${maxRetries}) exceeded for ${errorInfo.code}`
      );
      this.showErrorUI(
        `Failed after ${maxRetries} attempts. Please try again later.`,
        errorInfo,
        { autoDismiss: true, dismissDelay: 10000 }
      );
      return;
    }

    // Calculate exponential backoff delay
    const baseDelay = 1000; // 1 second
    const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
    const maxDelay = 30000; // 30 seconds max
    const delay = Math.min(backoffDelay, maxDelay);

    console.log(
      `ErrorHandler: Retrying ${context} (attempt ${attempt}/${maxRetries}) after ${delay}ms`
    );

    // Show retry indicator
    this.showRetryIndicator(attempt, maxRetries, delay);

    // Wait for backoff delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // Execute retry callback
      await retryCallback();
      console.log(`ErrorHandler: Retry successful for ${context}`);
    } catch (retryError) {
      console.error(`ErrorHandler: Retry ${attempt} failed`, retryError);
      // Recursively retry
      await this.handleRetry(
        errorInfo,
        retryCallback,
        context,
        attempt + 1,
        maxRetries
      );
    }
  }

  /**
   * Show retry indicator in tooltip
   * @param {number} attempt - Current attempt
   * @param {number} maxRetries - Maximum retries
   * @param {number} delay - Delay in milliseconds
   */
  static showRetryIndicator(attempt, maxRetries, delay) {
    const tooltip = document.getElementById("quick-peek-tooltip");
    if (!tooltip) return;

    const retryHTML = `
      <div class="error-retry-indicator">
        <div class="retry-spinner"></div>
        <div class="retry-message">
          Retrying... (${attempt}/${maxRetries})
        </div>
        <div class="retry-delay">Waiting ${Math.ceil(delay / 1000)}s</div>
      </div>
    `;

    const existingRetry = tooltip.querySelector(".error-retry-indicator");
    if (existingRetry) {
      existingRetry.outerHTML = retryHTML;
    } else {
      tooltip.insertAdjacentHTML("beforeend", retryHTML);
    }
  }

  /**
   * Log error for debugging and analytics
   * @param {Object} errorInfo - Error information
   * @param {string} context - Error context
   */
  static logError(errorInfo, context = "") {
    const logEntry = {
      timestamp: new Date().toISOString(),
      code: errorInfo.code,
      message: errorInfo.message,
      context: context,
      status: errorInfo.status,
      stack: errorInfo.originalError?.stack,
    };

    console.error(`[ErrorHandler${context ? `: ${context}` : ""}]`, logEntry);

    // TODO: Send to analytics service
    // this.sendToAnalytics(logEntry);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create a custom error object
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {Error} originalError - Original error object
   * @returns {Object} Error object
   */
  static createError(code, message, originalError = null) {
    return {
      code: code,
      message: message,
      originalError: originalError,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export error codes for use in other files
ErrorHandler.ERROR_CODES = ERROR_CODES;

// Make available globally
if (typeof window !== "undefined") {
  window.ErrorHandler = ErrorHandler;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ErrorHandler;
}
