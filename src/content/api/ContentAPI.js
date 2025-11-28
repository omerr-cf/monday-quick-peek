/**
 * Content API Module
 *
 * Handles API communication from content script to background worker
 */

(function () {
  "use strict";

  // Dependencies
  const getState = () => window.QuickPeekState || {};

  const ContentAPI = {
    /**
     * Fetch content from API via background worker
     * @param {string} itemId - Item ID
     * @param {string} type - Content type (note/comment)
     * @param {AbortSignal} signal - Optional abort signal
     * @returns {Promise<Object>} API response
     */
    async fetchContent(itemId, type, signal = null) {
      const state = getState();

      return new Promise((resolve, reject) => {
        // Check if request was cancelled
        if (signal && signal.aborted) {
          resolve(null);
          return;
        }

        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
          console.warn(
            "ContentAPI: Extension context invalidated, using mock data"
          );
          resolve(null);
          return;
        }

        // Set up abort listener
        if (signal) {
          signal.addEventListener("abort", () => {
            resolve(null);
          });
        }

        chrome.runtime.sendMessage(
          {
            action: "fetchNotes",
            taskId: itemId,
            type: type,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              const errorMessage = chrome.runtime.lastError.message;

              // Handle "Extension context invalidated" gracefully
              if (
                errorMessage.includes("Extension context invalidated") ||
                errorMessage.includes("message port closed") ||
                errorMessage.includes("Could not establish connection")
              ) {
                console.warn(
                  "ContentAPI: Extension context invalidated, using mock data"
                );
                resolve(null);
                return;
              }

              const error = new Error(errorMessage);
              error.code = "NETWORK_ERROR";

              // Use error handler if available
              if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, "fetchContentFromAPI", {
                  showUI: false,
                });
              }

              reject(error);
              return;
            }

            if (!response) {
              const error = new Error("No response from background script");
              error.code = "UNKNOWN_ERROR";
              reject(error);
              return;
            }

            if (response.success) {
              resolve({
                success: true,
                data: response.data,
                cached: response.cached || false,
              });
            } else {
              // Handle API errors
              const error = new Error(
                response.error || "Failed to fetch content"
              );

              // Classify error based on response
              if (response.error?.includes("API key")) {
                error.code =
                  window.ErrorHandler?.ERROR_CODES?.API_KEY_MISSING ||
                  "API_KEY_MISSING";
              } else if (response.error?.includes("not found")) {
                error.code =
                  window.ErrorHandler?.ERROR_CODES?.TASK_NOT_FOUND ||
                  "TASK_NOT_FOUND";
              } else if (response.error?.includes("rate limit")) {
                error.code =
                  window.ErrorHandler?.ERROR_CODES?.RATE_LIMITED ||
                  "RATE_LIMITED";
              } else {
                error.code =
                  window.ErrorHandler?.ERROR_CODES?.UNKNOWN_ERROR ||
                  "UNKNOWN_ERROR";
              }

              reject(error);
            }
          }
        );
      });
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.ContentAPI = ContentAPI;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ContentAPI;
  }
})();
