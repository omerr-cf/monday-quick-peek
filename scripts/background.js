/**
 * Background Service Worker for Monday Quick Peek Extension
 *
 * This service worker handles:
 * - Monday.com API communication
 * - API key management and storage
 * - Message passing between content script and popup
 * - Caching API responses
 */

// Configuration
const CONFIG = {
  apiBaseUrl: "https://api.monday.com/v2",
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
};

// In-memory cache for API responses
const apiCache = new Map();

/**
 * Initialize the background service worker
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("Monday Quick Peek: Background service worker installed");

  // TODO: Set default settings
  // TODO: Check for existing API key
  // TODO: Initialize storage
});

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background: Received message", request);

  // Handle different message types
  switch (request.action) {
    case "fetchContent":
      handleFetchContent(request, sender, sendResponse);
      return true; // Indicates we will send a response asynchronously

    case "saveApiKey":
      handleSaveApiKey(request, sendResponse);
      return true;

    case "getApiKey":
      handleGetApiKey(sendResponse);
      return true;

    case "testApiConnection":
      handleTestApiConnection(request, sendResponse);
      return true;

    default:
      console.warn("Background: Unknown action", request.action);
      sendResponse({ success: false, error: "Unknown action" });
      return false;
  }
});

/**
 * Handle content fetch request
 * @param {Object} request - Message request
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
async function handleFetchContent(request, sender, sendResponse) {
  try {
    const { itemId, type, updateId } = request;

    // TODO: Validate request parameters
    if (!itemId) {
      sendResponse({ success: false, error: "Missing itemId" });
      return;
    }

    // Check cache first
    const cacheKey = `${type}-${itemId}-${updateId || ""}`;
    const cached = getCachedResponse(cacheKey);
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
    const content = await fetchFromMondayAPI(itemId, type, updateId, apiKey);

    // Cache the response
    setCachedResponse(cacheKey, content);

    sendResponse({ success: true, content: content });
  } catch (error) {
    console.error("Background: Error fetching content", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Fetch content from Monday.com API
 * @param {string} itemId - Item ID
 * @param {string} type - Content type (note/comment)
 * @param {string} updateId - Update ID (for comments)
 * @param {string} apiKey - Monday.com API key
 * @returns {Promise<string>} Content promise
 */
async function fetchFromMondayAPI(itemId, type, updateId, apiKey) {
  // TODO: Construct GraphQL query based on type
  // TODO: Handle different content types (notes, comments, updates)
  // TODO: Parse and format response

  const query = buildGraphQLQuery(itemId, type, updateId);

  const response = await fetch(CONFIG.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "API-Version": "2023-10",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // TODO: Extract and format content from GraphQL response
  return extractContentFromResponse(data, type);
}

/**
 * Build GraphQL query for Monday.com API
 * @param {string} itemId - Item ID
 * @param {string} type - Content type
 * @param {string} updateId - Update ID
 * @returns {string} GraphQL query
 */
function buildGraphQLQuery(itemId, type, updateId) {
  // TODO: Build appropriate GraphQL query
  // TODO: Handle notes vs comments vs updates

  if (type === "note") {
    return `
      query {
        items(ids: [${itemId}]) {
          column_values {
            text
            type
          }
        }
      }
    `;
  } else if (type === "comment" || type === "update") {
    return `
      query {
        items(ids: [${itemId}]) {
          updates(limit: 1, ids: [${updateId}]) {
            body
            text_body
            creator {
              name
            }
            created_at
          }
        }
      }
    `;
  }

  return "";
}

/**
 * Extract content from API response
 * @param {Object} data - API response data
 * @param {string} type - Content type
 * @returns {string} Extracted content
 */
function extractContentFromResponse(data, type) {
  // TODO: Parse GraphQL response structure
  // TODO: Extract relevant content fields
  // TODO: Format for display

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "API error");
  }

  // Placeholder extraction logic
  return (
    data.data?.items?.[0]?.updates?.[0]?.body ||
    data.data?.items?.[0]?.updates?.[0]?.text_body ||
    "No content available"
  );
}

/**
 * Handle API key save request
 * @param {Object} request - Message request
 * @param {Function} sendResponse - Response callback
 */
async function handleSaveApiKey(request, sendResponse) {
  try {
    const { apiKey } = request;

    // TODO: Validate API key format
    if (!apiKey || typeof apiKey !== "string") {
      sendResponse({ success: false, error: "Invalid API key" });
      return;
    }

    // Store API key securely
    await chrome.storage.sync.set({ apiKey: apiKey });

    // Clear cache when API key changes
    apiCache.clear();

    sendResponse({ success: true });
  } catch (error) {
    console.error("Background: Error saving API key", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle API key retrieval request
 * @param {Function} sendResponse - Response callback
 */
async function handleGetApiKey(sendResponse) {
  try {
    const result = await chrome.storage.sync.get(["apiKey"]);
    sendResponse({ success: true, apiKey: result.apiKey || null });
  } catch (error) {
    console.error("Background: Error getting API key", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle API connection test
 * @param {Object} request - Message request
 * @param {Function} sendResponse - Response callback
 */
async function handleTestApiConnection(request, sendResponse) {
  try {
    const { apiKey } = request;
    const testKey = apiKey || (await getStoredApiKey());

    if (!testKey) {
      sendResponse({ success: false, error: "No API key provided" });
      return;
    }

    // TODO: Make a simple API call to test connection
    // TODO: Verify API key is valid

    const testQuery = "{ me { id name } }";
    const response = await fetch(CONFIG.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: testKey,
        "API-Version": "2023-10",
      },
      body: JSON.stringify({ query: testQuery }),
    });

    const data = await response.json();

    if (data.errors) {
      sendResponse({
        success: false,
        error: data.errors[0]?.message || "Invalid API key",
      });
    } else {
      sendResponse({ success: true, user: data.data?.me });
    }
  } catch (error) {
    console.error("Background: Error testing API connection", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get stored API key
 * @returns {Promise<string|null>} API key or null
 */
async function getStoredApiKey() {
  try {
    const result = await chrome.storage.sync.get(["apiKey"]);
    return result.apiKey || null;
  } catch (error) {
    console.error("Background: Error getting stored API key", error);
    return null;
  }
}

/**
 * Get cached API response
 * @param {string} key - Cache key
 * @returns {string|null} Cached content or null
 */
function getCachedResponse(key) {
  const cached = apiCache.get(key);
  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CONFIG.cacheExpiry) {
    apiCache.delete(key);
    return null;
  }

  return cached.content;
}

/**
 * Set cached API response
 * @param {string} key - Cache key
 * @param {string} content - Content to cache
 */
function setCachedResponse(key, content) {
  // Limit cache size
  if (apiCache.size >= CONFIG.maxCacheSize) {
    // Remove oldest entry
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }

  apiCache.set(key, {
    content: content,
    timestamp: Date.now(),
  });
}
