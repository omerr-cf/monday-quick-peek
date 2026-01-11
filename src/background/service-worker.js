/**
 * Background Service Worker for Monday Quick Peek Extension
 *
 * This service worker orchestrates:
 * - Monday.com API communication (via MondayAPI)
 * - Caching (via CacheManager)
 * - Message passing (via MessageHandler)
 * - Rate limiting (via RateLimiter)
 */

// Import all required modules
// Note: importScripts paths are relative to the service worker file location
// Service worker is at: src/background/service-worker.js
// So paths are relative to src/background/
importScripts(
  "./cache/LRUCache.js",
  "./cache/CacheManager.js",
  "./api/RateLimiter.js",
  "./api/GraphQLQueries.js",
  "./api/ResponseParser.js",
  "./api/MondayAPI.js",
  "./messaging/MessageHandler.js"
);

// Configuration
const CONFIG = {
  apiBaseUrl: "https://api.monday.com/v2",
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  apiVersion: "2025-10",
};

/**
 * Initialize the background service worker
 */
chrome.runtime.onInstalled.addListener((details) => {
  // Set uninstall survey URL - redirects user to feedback form when they uninstall
  chrome.runtime.setUninstallURL(
    "https://docs.google.com/forms/d/e/1FAIpQLScgweeipg6FVk7lLtaNnuRdNQ9FK4G3VT1g2g2fPwwLyLeYMg/viewform"
  );

  // Track install date for NPS survey timing
  if (details.reason === "install") {
    chrome.storage.local.set({
      installDate: Date.now(),
      hasRated: false,
      npsShown: false,
    });
  }
});

/**
 * Handle messages from content script and popup
 * Routes to MessageHandler for processing
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ensure MessageHandler is available (service worker uses self, not window)
  const MessageHandler = self.MessageHandler;
  if (!MessageHandler) {
    sendResponse({ success: false, error: "Service not initialized" });
    return false;
  }

  // Route messages to appropriate handler
  switch (request.action) {
    case "fetchContent":
      MessageHandler.handleFetchContent(request, sendResponse);
      return true; // Indicates we will send a response asynchronously

    case "fetchNotes":
      MessageHandler.handleFetchNotes(request, sendResponse);
      return true;

    case "validateApiKey":
      MessageHandler.handleValidateApiKey(request, sendResponse);
      return true;

    case "cacheCheck":
      MessageHandler.handleCacheCheck(request, sendResponse);
      return true;

    case "saveApiKey":
      MessageHandler.handleSaveApiKey(request, sendResponse);
      return true;

    case "getApiKey":
      MessageHandler.handleGetApiKey(sendResponse);
      return true;

    case "testApiConnection":
      MessageHandler.handleTestApiConnection(request, sendResponse);
      return true;

    default:
      console.warn("Background: Unknown action", request.action);
      sendResponse({ success: false, error: "Unknown action" });
      return false;
  }
});
