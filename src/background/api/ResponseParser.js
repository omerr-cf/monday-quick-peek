/**
 * Response Parser for Monday.com API Responses
 *
 * Parses HTML content and formats timestamps
 */

(function () {
  "use strict";

  const ResponseParser = {
    /**
     * Parse HTML content from Monday.com update body
     * Service worker context - no DOM access, so we use regex-based parsing
     * @param {string} html - HTML string from API
     * @returns {string} Plain text or formatted content
     */
    parseHtmlContent(html) {
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
            return displayText !== url
              ? `${displayText} (${url})`
              : displayText;
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
    },

    /**
     * Format timestamp to relative time (e.g., "2 hours ago")
     * @param {string} timestamp - ISO timestamp string
     * @returns {string} Relative time string
     */
    formatRelativeTime(timestamp) {
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
          return `${diffMinutes} ${
            diffMinutes === 1 ? "minute" : "minutes"
          } ago`;
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
        return timestamp;
      }
    },

    /**
     * Extract content from API response
     * @param {Object} data - API response data
     * @param {string} type - Content type
     * @returns {string} Extracted content
     */
    extractContentFromResponse(data, type) {
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
    },
  };

  // Export globally (service worker context)
  if (typeof self !== "undefined") {
    self.ResponseParser = ResponseParser;
  } else if (typeof window !== "undefined") {
    window.ResponseParser = ResponseParser;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ResponseParser;
  }
})();
