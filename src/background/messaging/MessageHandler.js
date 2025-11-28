/**
 * Message Handler for Background Service Worker
 *
 * Routes messages between content script, popup, and background
 */

(function () {
  "use strict";

  // Dependencies (loaded before this script)
  const getDependencies = () => {
    const global = typeof self !== "undefined" ? self : window;
    return {
      MondayAPI: global.MondayAPI,
      CacheManager: global.CacheManager,
    };
  };

  // Helper: Get stored API key
  async function getStoredApiKey() {
    try {
      const result = await chrome.storage.sync.get(["apiKey"]);
      return result.apiKey || null;
    } catch (error) {
      console.error("MessageHandler: Error getting stored API key", error);
      return null;
    }
  }

  const MessageHandler = {
    /**
     * Handle fetch notes request
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleFetchNotes(request, sendResponse) {
      try {
        const { taskId, apiKey } = request;
        const deps = getDependencies();

        // Validate request parameters
        if (!taskId) {
          sendResponse({
            success: false,
            error: "Missing taskId parameter",
          });
          return;
        }

        // Validate taskId format (should be numeric)
        if (!/^\d+$/.test(String(taskId))) {
          sendResponse({
            success: false,
            error: "Invalid taskId format",
          });
          return;
        }

        // Check cache first
        const cacheKey = deps.CacheManager.generateKey("note", taskId);
        const cached = deps.CacheManager.get(cacheKey);
        if (cached) {
          sendResponse({ success: true, data: cached, cached: true });
          return;
        }

        // Get API key
        const keyToUse = apiKey || (await getStoredApiKey());
        if (!keyToUse) {
          sendResponse({
            success: false,
            error:
              "API key not configured. Please set your API key in the extension settings.",
          });
          return;
        }

        // Fetch from Monday.com API
        const notesData = await deps.MondayAPI.fetchTaskNotes(taskId, keyToUse);

        // Cache the response
        deps.CacheManager.set(cacheKey, notesData);

        sendResponse({ success: true, data: notesData, cached: false });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message || "Failed to fetch notes",
        });
      }
    },

    /**
     * Handle fetch content request
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleFetchContent(request, sendResponse) {
      try {
        const { itemId, type, updateId } = request;
        const deps = getDependencies();

        if (!itemId) {
          sendResponse({ success: false, error: "Missing itemId" });
          return;
        }

        // Check cache first
        const cacheKey = deps.CacheManager.generateKey(type, itemId, updateId);
        const cached = deps.CacheManager.get(cacheKey);
        if (cached) {
          sendResponse({ success: true, content: cached });
          return;
        }

        // Get API key from storage
        const apiKey = await getStoredApiKey();
        if (!apiKey) {
          sendResponse({ success: false, error: "API key not configured" });
          return;
        }

        // Fetch from Monday.com API
        const content = await deps.MondayAPI.fetchContent(
          itemId,
          type,
          updateId,
          apiKey
        );

        // Cache the response
        deps.CacheManager.set(cacheKey, content);

        sendResponse({ success: true, content: content });
      } catch (error) {
        console.error("MessageHandler: Error fetching content", error);
        sendResponse({ success: false, error: error.message });
      }
    },

    /**
     * Handle API key validation request
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleValidateApiKey(request, sendResponse) {
      try {
        const { apiKey } = request;
        const deps = getDependencies();

        if (
          !apiKey ||
          typeof apiKey !== "string" ||
          apiKey.trim().length === 0
        ) {
          sendResponse({
            success: false,
            error: "API key cannot be empty",
            valid: false,
          });
          return;
        }

        const validation = await deps.MondayAPI.validateApiKey(apiKey.trim());

        sendResponse({
          success: true,
          valid: validation.valid,
          user: validation.user,
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message || "Failed to validate API key",
          valid: false,
        });
      }
    },

    /**
     * Handle API key save request
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleSaveApiKey(request, sendResponse) {
      try {
        const { apiKey } = request;
        const deps = getDependencies();

        if (
          !apiKey ||
          typeof apiKey !== "string" ||
          apiKey.trim().length === 0
        ) {
          sendResponse({ success: false, error: "Invalid API key format" });
          return;
        }

        // Validate API key before saving
        const validation = await deps.MondayAPI.validateApiKey(apiKey.trim());

        if (!validation.valid) {
          sendResponse({
            success: false,
            error: "Invalid API key",
          });
          return;
        }

        // Store API key securely
        await chrome.storage.sync.set({ apiKey: apiKey.trim() });

        // Clear cache when API key changes
        deps.CacheManager.clear();

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    },

    /**
     * Handle API key retrieval request
     * @param {Function} sendResponse - Response callback
     */
    async handleGetApiKey(sendResponse) {
      try {
        const apiKey = await getStoredApiKey();
        sendResponse({ success: true, apiKey: apiKey });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    },

    /**
     * Handle API connection test
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleTestApiConnection(request, sendResponse) {
      try {
        const { apiKey } = request;
        const testKey = apiKey || (await getStoredApiKey());
        const deps = getDependencies();

        if (!testKey) {
          sendResponse({ success: false, error: "No API key provided" });
          return;
        }

        const validation = await deps.MondayAPI.validateApiKey(testKey);

        if (validation.valid) {
          sendResponse({
            success: true,
            user: validation.user,
          });
        } else {
          sendResponse({
            success: false,
            error: "Invalid API key",
          });
        }
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message || "Connection test failed",
        });
      }
    },

    /**
     * Handle cache check request
     * @param {Object} request - Message request
     * @param {Function} sendResponse - Response callback
     */
    async handleCacheCheck(request, sendResponse) {
      try {
        const { taskId } = request;
        const deps = getDependencies();

        if (!taskId) {
          sendResponse({
            success: false,
            error: "Missing taskId parameter",
            cached: false,
          });
          return;
        }

        const cacheKey = deps.CacheManager.generateKey("note", taskId);
        const cached = deps.CacheManager.get(cacheKey);

        sendResponse({
          success: true,
          cached: !!cached,
          cacheSize: deps.CacheManager.size(),
          cacheKey: cacheKey,
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message || "Failed to check cache",
          cached: false,
        });
      }
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.MessageHandler = MessageHandler;
  } else if (typeof window !== "undefined") {
    window.MessageHandler = MessageHandler;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MessageHandler;
  }
})();
