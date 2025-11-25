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
  apiVersion: "2023-10",
  rateLimitDelay: 1000, // Delay between requests to avoid rate limiting
  maxRequestsPerMinute: 50, // Monday.com rate limit (conservative estimate)
  backoffBaseDelay: 1000, // Base delay for exponential backoff (ms)
  backoffMaxDelay: 60000, // Maximum backoff delay (1 minute)
};

// In-memory cache for API responses
const apiCache = new Map();

// Rate limiting tracking
const rateLimitTracker = {
  requests: [], // Array of timestamps
  backoffUntil: null, // Timestamp when we can retry after rate limit
  backoffAttempts: 0, // Number of consecutive rate limit hits
};

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

    case "fetchNotes":
      handleFetchNotes(request, sender, sendResponse);
      return true;

    case "validateApiKey":
      handleValidateApiKey(request, sendResponse);
      return true;

    case "cacheCheck":
      handleCacheCheck(request, sendResponse);
      return true;

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
  const query = buildGraphQLQuery(itemId, type, updateId);

  try {
    const response = await fetch(CONFIG.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
        "API-Version": CONFIG.apiVersion,
      },
      body: JSON.stringify({ query }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid API key");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      } else if (response.status === 404) {
        throw new Error("Task not found");
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors) {
      const error = data.errors[0];
      if (
        error.message?.includes("Invalid token") ||
        error.message?.includes("Unauthorized")
      ) {
        throw new Error("Invalid API key");
      } else if (error.message?.includes("Rate limit")) {
        throw new Error("Rate limit exceeded");
      } else if (error.message?.includes("not found")) {
        throw new Error("Task not found");
      }
      throw new Error(error.message || "API error");
    }

    return extractContentFromResponse(data, type);
  } catch (error) {
    // Re-throw formatted errors
    if (error.message) {
      throw error;
    }
    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw new Error(error.message || "An unexpected error occurred");
  }
}

/**
 * Build GraphQL query to fetch task notes and updates
 * @param {string} taskId - Task/Item ID
 * @returns {string} GraphQL query
 */
function buildFetchNotesQuery(taskId) {
  return `
    query {
      items(ids: [${taskId}]) {
        id
        name
        updates {
          id
          body
          created_at
          creator {
            name
            photo_thumb
          }
        }
        column_values {
          id
          text
          title
        }
      }
    }
  `;
}

/**
 * Build GraphQL query for Monday.com API
 * @param {string} itemId - Item ID
 * @param {string} type - Content type
 * @param {string} updateId - Update ID
 * @returns {string} GraphQL query
 */
function buildGraphQLQuery(itemId, type, updateId) {
  if (type === "note") {
    return `
      query {
        items(ids: [${itemId}]) {
          id
          name
          updates {
            id
            body
            created_at
            creator {
              name
              photo_thumb
            }
          }
          column_values {
            id
            text
            title
          }
        }
      }
    `;
  } else if (type === "comment" || type === "update") {
    return `
      query {
        items(ids: [${itemId}]) {
          updates(limit: 1, ids: [${updateId}]) {
            id
            body
            text_body
            created_at
            creator {
              name
              photo_thumb
            }
          }
        }
      }
    `;
  }

  return "";
}

/**
 * Handle fetch notes request from content script
 * @param {Object} request - Message request
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
async function handleFetchNotes(request, sender, sendResponse) {
  try {
    const { taskId, apiKey } = request;

    console.log("Background: Fetching notes for task", taskId);

    // Validate request parameters
    if (!taskId) {
      console.error("Background: Missing taskId in request");
      sendResponse({
        success: false,
        error: "Missing taskId parameter",
      });
      return;
    }

    // Validate taskId format (should be numeric)
    if (!/^\d+$/.test(String(taskId))) {
      console.error("Background: Invalid taskId format", taskId);
      sendResponse({
        success: false,
        error: "Invalid taskId format",
      });
      return;
    }

    // Check cache first
    const cacheKey = `${taskId}_${Math.floor(Date.now() / CONFIG.cacheExpiry)}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log(
        "Background: Cache HIT - Returning cached notes for task",
        taskId
      );
      sendResponse({ success: true, data: cached, cached: true });
      return;
    }

    console.log("Background: Cache MISS - Fetching notes for task", taskId);

    // Get API key (from request or storage)
    const keyToUse = apiKey || (await getStoredApiKey());
    if (!keyToUse) {
      console.error("Background: API key not configured");
      sendResponse({
        success: false,
        error:
          "API key not configured. Please set your API key in the extension settings.",
      });
      return;
    }

    // Check rate limiting
    await checkRateLimit();

    // Fetch from Monday.com API
    const notesData = await fetchTaskNotes(taskId, keyToUse);

    // Cache the response
    setCachedResponse(cacheKey, notesData);

    console.log("Background: Successfully fetched notes for task", taskId);
    sendResponse({ success: true, data: notesData, cached: false });
  } catch (error) {
    console.error("Background: Error fetching notes", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to fetch notes",
    });
  }
}

/**
 * Fetch task notes from Monday.com API
 * @param {string} taskId - Task/Item ID
 * @param {string} apiKey - Monday.com API key
 * @returns {Promise<Object>} Formatted notes data
 */
async function fetchTaskNotes(taskId, apiKey) {
  const query = buildFetchNotesQuery(taskId);

  console.log("Background: Making API request for task", taskId);

  try {
    const response = await fetch(CONFIG.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
        "API-Version": CONFIG.apiVersion,
      },
      body: JSON.stringify({ query }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Background: API HTTP error", response.status, errorText);

      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your API key in settings."
        );
      } else if (response.status === 403) {
        throw new Error(
          "Access forbidden. Your API key may not have permission to access this task."
        );
      } else if (response.status === 429) {
        // Handle rate limiting with exponential backoff
        handleRateLimit();
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      } else if (response.status === 404) {
        throw new Error("Task not found. The task ID may be incorrect.");
      } else {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }
    }

    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors && data.errors.length > 0) {
      const error = data.errors[0];
      console.error("Background: GraphQL error", error);

      // Handle specific error types
      if (
        error.message?.includes("Invalid token") ||
        error.message?.includes("Unauthorized")
      ) {
        throw new Error(
          "Invalid API key. Please check your API key in settings."
        );
      } else if (error.message?.includes("Rate limit")) {
        // Handle rate limiting with exponential backoff
        handleRateLimit();
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      } else if (
        error.message?.includes("not found") ||
        error.message?.includes("does not exist")
      ) {
        throw new Error("Task not found. The task ID may be incorrect.");
      } else {
        throw new Error(error.message || "GraphQL error occurred");
      }
    }

    // Validate response structure
    if (!data.data || !data.data.items || data.data.items.length === 0) {
      console.warn("Background: No items found in response");
      throw new Error("Task not found or you don't have access to it.");
    }

    const item = data.data.items[0];

    // Format the response with HTML parsing and relative timestamps
    const formattedData = {
      taskId: item.id,
      taskName: item.name || "Untitled Task",
      notes: (item.updates || []).map((update) => ({
        id: update.id,
        content: parseHtmlContent(update.body || ""),
        author: update.creator?.name || "Unknown",
        authorPhoto: update.creator?.photo_thumb || null,
        createdAt: update.created_at,
        createdAtRelative: formatRelativeTime(update.created_at),
      })),
      columnValues: (item.column_values || []).map((col) => ({
        id: col.id,
        title: col.title || "",
        text: col.text || "",
      })),
    };

    console.log(
      `Background: Formatted ${formattedData.notes.length} notes for task ${taskId}`
    );

    return formattedData;
  } catch (error) {
    // Re-throw if it's already a formatted error
    if (
      (error.message && error.message.startsWith("Invalid")) ||
      error.message.startsWith("Rate limit") ||
      error.message.startsWith("Task not found") ||
      error.message.startsWith("Access forbidden")
    ) {
      throw error;
    }

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("Background: Network error", error);
      throw new Error("Network error. Please check your internet connection.");
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      console.error("Background: JSON parse error", error);
      throw new Error("Invalid response from API. Please try again.");
    }

    // Generic error
    console.error("Background: Unexpected error", error);
    throw new Error(error.message || "An unexpected error occurred");
  }
}

/**
 * Extract content from API response
 * @param {Object} data - API response data
 * @param {string} type - Content type
 * @returns {string} Extracted content
 */
function extractContentFromResponse(data, type) {
  if (data.errors) {
    throw new Error(data.errors[0]?.message || "API error");
  }

  // Extract updates/notes
  const item = data.data?.items?.[0];
  if (!item) {
    return "No content available";
  }

  if (type === "note" || !type) {
    // Return all updates formatted
    const updates = item.updates || [];
    if (updates.length === 0) {
      return "No notes available";
    }

    return updates
      .map(
        (update) =>
          `${update.creator?.name || "Unknown"}: ${
            update.body || update.text_body || ""
          }`
      )
      .join("\n\n");
  } else if (type === "comment" || type === "update") {
    const update = item.updates?.[0];
    return update?.body || update?.text_body || "No content available";
  }

  return "No content available";
}

/**
 * Handle API key validation request
 * @param {Object} request - Message request
 * @param {Function} sendResponse - Response callback
 */
async function handleValidateApiKey(request, sendResponse) {
  try {
    const { apiKey } = request;

    console.log("Background: Validating API key");

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      console.error("Background: Empty or invalid API key format");
      sendResponse({
        success: false,
        error: "API key cannot be empty",
        valid: false,
      });
      return;
    }

    // Test the API key with a simple query
    const testQuery = "{ me { id name email } }";
    const response = await fetch(CONFIG.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey.trim(),
        "API-Version": CONFIG.apiVersion,
      },
      body: JSON.stringify({ query: testQuery }),
    });

    const data = await response.json();

    if (data.errors || !response.ok) {
      const error = data.errors?.[0] || { message: "Invalid API key" };
      console.error("Background: API key validation failed", error);
      sendResponse({
        success: false,
        error: error.message || "Invalid API key",
        valid: false,
      });
      return;
    }

    const user = data.data?.me;
    if (user) {
      console.log("Background: API key validation successful", {
        userId: user.id,
        userName: user.name,
      });
      sendResponse({
        success: true,
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } else {
      console.error("Background: Unexpected API response structure");
      sendResponse({
        success: false,
        error: "Unexpected response from API",
        valid: false,
      });
    }
  } catch (error) {
    console.error("Background: Error validating API key", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to validate API key",
      valid: false,
    });
  }
}

/**
 * Handle cache check request
 * @param {Object} request - Message request
 * @param {Function} sendResponse - Response callback
 */
async function handleCacheCheck(request, sendResponse) {
  try {
    const { taskId } = request;

    if (!taskId) {
      sendResponse({
        success: false,
        error: "Missing taskId parameter",
        cached: false,
      });
      return;
    }

    const cacheKey = `${taskId}_${Math.floor(Date.now() / CONFIG.cacheExpiry)}`;
    const cached = getCachedResponse(cacheKey);

    console.log(
      `Background: Cache check for task ${taskId}:`,
      cached ? "HIT" : "MISS"
    );

    sendResponse({
      success: true,
      cached: !!cached,
      cacheSize: apiCache.size,
      cacheKey: cacheKey,
    });
  } catch (error) {
    console.error("Background: Error checking cache", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to check cache",
      cached: false,
    });
  }
}

/**
 * Handle API key save request
 * @param {Object} request - Message request
 * @param {Function} sendResponse - Response callback
 */
async function handleSaveApiKey(request, sendResponse) {
  try {
    const { apiKey } = request;

    console.log("Background: Saving API key");

    // Validate API key format
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      console.error("Background: Invalid API key format");
      sendResponse({ success: false, error: "Invalid API key format" });
      return;
    }

    // Validate API key before saving
    const validationResult = await new Promise((resolve) => {
      handleValidateApiKey({ apiKey: apiKey.trim() }, resolve);
    });

    if (!validationResult.success || !validationResult.valid) {
      console.error("Background: API key validation failed before saving");
      sendResponse({
        success: false,
        error: validationResult.error || "Invalid API key",
      });
      return;
    }

    // Store API key securely
    await chrome.storage.sync.set({ apiKey: apiKey.trim() });

    // Clear cache when API key changes
    apiCache.clear();
    console.log("Background: API key saved and cache cleared");

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

    console.log("Background: Testing API connection");

    const testQuery = "{ me { id name email } }";
    const response = await fetch(CONFIG.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: testKey,
        "API-Version": CONFIG.apiVersion,
      },
      body: JSON.stringify({ query: testQuery }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        sendResponse({
          success: false,
          error: "Invalid API key. Please check your API key.",
        });
        return;
      } else if (response.status === 429) {
        sendResponse({
          success: false,
          error: "Rate limit exceeded. Please wait a moment.",
        });
        return;
      }
      sendResponse({
        success: false,
        error: `Connection failed: ${response.status} ${response.statusText}`,
      });
      return;
    }

    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors) {
      const error = data.errors[0];
      console.error("Background: API test error", error);

      if (
        error.message?.includes("Invalid token") ||
        error.message?.includes("Unauthorized")
      ) {
        sendResponse({
          success: false,
          error: "Invalid API key. Please check your API key.",
        });
      } else {
        sendResponse({
          success: false,
          error: error.message || "Invalid API key",
        });
      }
      return;
    }

    // Success
    const user = data.data?.me;
    if (user) {
      console.log("Background: API connection test successful", user);
      sendResponse({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } else {
      sendResponse({
        success: false,
        error: "Unexpected response from API",
      });
    }
  } catch (error) {
    console.error("Background: Error testing API connection", error);

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      sendResponse({
        success: false,
        error: "Network error. Please check your internet connection.",
      });
    } else {
      sendResponse({
        success: false,
        error: error.message || "An unexpected error occurred",
      });
    }
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
 * @param {Object|string} content - Content to cache
 */
function setCachedResponse(key, content) {
  // Limit cache size
  if (apiCache.size >= CONFIG.maxCacheSize) {
    // Remove oldest entry (FIFO)
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
    console.log("Background: Cache limit reached, removed oldest entry");
  }

  apiCache.set(key, {
    content: content,
    timestamp: Date.now(),
  });

  console.log(
    `Background: Cached response for key: ${key} (cache size: ${apiCache.size})`
  );
}

/**
 * Check rate limiting before making API call
 * @returns {Promise<void>}
 */
async function checkRateLimit() {
  const now = Date.now();

  // Check if we're in backoff period
  if (rateLimitTracker.backoffUntil && now < rateLimitTracker.backoffUntil) {
    const waitTime = rateLimitTracker.backoffUntil - now;
    console.warn(
      `Background: Rate limit backoff active, waiting ${Math.ceil(
        waitTime / 1000
      )}s`
    );
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
    console.warn(
      `Background: Rate limit threshold reached (${rateLimitTracker.requests.length} requests in last minute)`
    );
    throw new Error(
      "Rate limit threshold reached. Please wait a moment before making more requests."
    );
  }

  // Record this request
  rateLimitTracker.requests.push(now);
  console.log(
    `Background: Rate limit check passed (${rateLimitTracker.requests.length}/${CONFIG.maxRequestsPerMinute} requests in last minute)`
  );

  // Add small delay to avoid hitting rate limits
  if (rateLimitTracker.requests.length > CONFIG.maxRequestsPerMinute * 0.8) {
    console.log("Background: Approaching rate limit, adding delay");
    await new Promise((resolve) => setTimeout(resolve, CONFIG.rateLimitDelay));
  }
}

/**
 * Handle rate limit error with exponential backoff
 */
function handleRateLimit() {
  const now = Date.now();
  rateLimitTracker.backoffAttempts += 1;

  // Calculate exponential backoff delay
  const backoffDelay = Math.min(
    CONFIG.backoffBaseDelay * Math.pow(2, rateLimitTracker.backoffAttempts),
    CONFIG.backoffMaxDelay
  );

  rateLimitTracker.backoffUntil = now + backoffDelay;

  console.error(
    `Background: Rate limit hit, backing off for ${
      backoffDelay / 1000
    }s (attempt ${rateLimitTracker.backoffAttempts})`
  );

  // Reset backoff attempts after max delay
  if (backoffDelay >= CONFIG.backoffMaxDelay) {
    setTimeout(() => {
      rateLimitTracker.backoffAttempts = 0;
      rateLimitTracker.backoffUntil = null;
      console.log("Background: Rate limit backoff reset");
    }, CONFIG.backoffMaxDelay);
  }
}

/**
 * Parse HTML content from Monday.com update body
 * Service worker context - no DOM access, so we use regex-based parsing
 * @param {string} html - HTML string from API
 * @returns {string} Plain text or formatted content
 */
function parseHtmlContent(html) {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    let text = html;

    // Remove script and style tags with their content
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Convert <br> and <br/> to line breaks
    text = text.replace(/<br\s*\/?>/gi, "\n");

    // Convert <p> tags to line breaks
    text = text.replace(/<\/p>/gi, "\n");
    text = text.replace(/<p[^>]*>/gi, "");

    // Convert <div> tags to line breaks
    text = text.replace(/<\/div>/gi, "\n");
    text = text.replace(/<div[^>]*>/gi, "");

    // Extract link text and URLs
    text = text.replace(
      /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,
      (match, url, linkText) => {
        const displayText = linkText.trim() || url;
        return displayText !== url ? `${displayText} (${url})` : displayText;
      }
    );

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");

    // Decode numeric entities
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    // Decode hex entities
    text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Clean up whitespace
    text = text
      .replace(/\s+/g, " ") // Multiple spaces to single space
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Multiple line breaks to double
      .replace(/[ \t]+/g, " ") // Tabs and spaces to single space
      .trim();

    // Preserve mentions (@username)
    text = text.replace(/@(\w+)/g, "@$1");

    return text;
  } catch (error) {
    console.warn("Background: Error parsing HTML content", error);
    // Fallback: simple HTML tag removal
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
    } else {
      return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
    }
  } catch (error) {
    console.warn("Background: Error formatting relative time", error);
    return timestamp;
  }
}
