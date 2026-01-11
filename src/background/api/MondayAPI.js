/**
 * Monday.com API Client
 *
 * Handles all API communication with Monday.com
 */

(function () {
  "use strict";

  const CONFIG = {
    apiBaseUrl: "https://api.monday.com/v2",
    apiVersion: "2025-10",
  };

  // Dependencies (loaded before this script)
  const getDependencies = () => {
    const global = typeof self !== "undefined" ? self : window;
    return {
      GraphQLQueries: global.GraphQLQueries,
      ResponseParser: global.ResponseParser,
      RateLimiter: global.RateLimiter,
      CacheManager: global.CacheManager,
    };
  };

  const MondayAPI = {
    /**
     * Fetch task notes from Monday.com API
     * @param {string} taskId - Task/Item ID
     * @param {string} apiKey - Monday.com API key
     * @returns {Promise<Object>} Formatted notes data
     */
    async fetchTaskNotes(taskId, apiKey) {
      const deps = getDependencies();
      const query = deps.GraphQLQueries.buildFetchNotesQuery(taskId);

      try {
        // Check rate limit
        if (deps.RateLimiter) {
          await deps.RateLimiter.checkRateLimit();
        }

        // Clean API key and use credentials: 'omit' to prevent cookie conflicts
        const cleanApiKey = apiKey.trim();
        const response = await fetch(CONFIG.apiBaseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: cleanApiKey,
          },
          body: JSON.stringify({ query }),
          credentials: "omit",
        });

        // Handle HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "MondayAPI: API HTTP error",
            response.status,
            errorText
          );

          if (response.status === 401) {
            throw new Error(
              "Invalid API key. Please check your API key in settings."
            );
          } else if (response.status === 403) {
            throw new Error(
              "Access forbidden. Your API key may not have permission to access this task."
            );
          } else if (response.status === 429) {
            // Handle rate limiting
            if (deps.RateLimiter) {
              deps.RateLimiter.handleRateLimit();
            }
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
          console.error("MondayAPI: GraphQL error", error);

          if (
            error.message?.includes("Invalid token") ||
            error.message?.includes("Unauthorized")
          ) {
            throw new Error(
              "Invalid API key. Please check your API key in settings."
            );
          } else if (error.message?.includes("Rate limit")) {
            if (deps.RateLimiter) {
              deps.RateLimiter.handleRateLimit();
            }
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
          throw new Error("Task not found or you don't have access to it.");
        }

        const item = data.data.items[0];

        // Format the response with HTML parsing and relative timestamps
        const formattedData = {
          taskId: item.id,
          taskName: item.name || "Untitled Task",
          notes: (item.updates || []).map((update) => ({
            id: update.id,
            content: deps.ResponseParser.parseHtmlContent(update.body || ""),
            author: update.creator?.name || "Unknown",
            authorPhoto: update.creator?.photo_thumb || null,
            createdAt: update.created_at,
            createdAtRelative: deps.ResponseParser.formatRelativeTime(
              update.created_at
            ),
          })),
          columnValues: (item.column_values || []).map((col) => ({
            id: col.id,
            type: col.type || "",
            text: col.text || "",
          })),
        };

        // Reset rate limit backoff on success
        if (deps.RateLimiter) {
          deps.RateLimiter.resetBackoff();
        }

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
          throw new Error(
            "Network error. Please check your internet connection."
          );
        }

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
          throw new Error("Invalid response from API. Please try again.");
        }

        // Generic error
        throw new Error(error.message || "An unexpected error occurred");
      }
    },

    /**
     * Validate API key by making a simple "me" query
     * @param {string} apiKey - API key to validate
     * @returns {Promise<Object>} Validation result with user info
     */
    async validateApiKey(apiKey) {
      const deps = getDependencies();
      const query = deps.GraphQLQueries.buildMeQuery();
      const cleanKey = apiKey.trim();

      try {
        const response = await fetch(CONFIG.apiBaseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: cleanKey,
          },
          body: JSON.stringify({ query }),
          credentials: "omit",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Invalid API key. Please check your API key.");
          } else if (response.status === 403) {
            throw new Error(
              "Access forbidden. Your Monday.com account may not have API access, or the token is invalid."
            );
          } else {
            throw new Error(
              `API request failed: ${response.status} ${response.statusText}`
            );
          }
        }

        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].message || "Invalid API key");
        }

        const user = data.data?.me;
        if (user) {
          return {
            valid: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          };
        } else {
          throw new Error("Unexpected response from API");
        }
      } catch (error) {
        throw new Error(error.message || "Failed to validate API key");
      }
    },

    /**
     * Fetch content from Monday.com API (generic method)
     * @param {string} itemId - Item ID
     * @param {string} type - Content type (note/comment)
     * @param {string} updateId - Update ID (for comments)
     * @param {string} apiKey - Monday.com API key
     * @returns {Promise<string>} Content promise
     */
    async fetchContent(itemId, type, updateId, apiKey) {
      const deps = getDependencies();
      const query = deps.GraphQLQueries.buildGraphQLQuery(
        itemId,
        type,
        updateId
      );

      try {
        const cleanApiKey = apiKey.trim();
        const response = await fetch(CONFIG.apiBaseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: cleanApiKey,
          },
          body: JSON.stringify({ query }),
          credentials: "omit",
        });

        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Invalid API key");
          } else if (response.status === 403) {
            throw new Error("Access forbidden");
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

        return deps.ResponseParser.extractContentFromResponse(data, type);
      } catch (error) {
        // Re-throw formatted errors
        if (error.message) {
          throw error;
        }
        // Handle network errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new Error(
            "Network error. Please check your internet connection."
          );
        }
        throw new Error(error.message || "An unexpected error occurred");
      }
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.MondayAPI = MondayAPI;
  } else if (typeof window !== "undefined") {
    window.MondayAPI = MondayAPI;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = MondayAPI;
  }
})();
