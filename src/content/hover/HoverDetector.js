/**
 * Hover Detection Module for Content Script
 *
 * Handles detecting hover events on task rows and managing hover state
 */

(function () {
  "use strict";

  // State (shared with other modules via global state object)
  const getState = () => window.QuickPeekState || {};

  const CONFIG = {
    hoverDelay: 500,
    hideDelay: 400,
    selectors: {
      boardRow:
        '.pulse-component[role="list"], [id^="row-pulse-"], .board-row, [data-testid*="board-row"], [class*="boardRow"], [class*="pulse-component"]',
    },
  };

  const HoverDetector = {
    /**
     * Find all task rows and attach hover listeners
     * @returns {number} Number of rows found
     */
    attachHoverListeners(handlers) {
      const selectors = [
        '.pulse-component[role="list"]',
        '[id^="row-pulse-"]',
        '[class*="pulse-component"][role="list"]',
        '[class*="pulse-component"]',
        ".grid-pulse",
        '[class*="grid-pulse"]',
        ".board-row",
        '[data-testid*="board-row"]',
        '[data-testid*="item-row"]',
        '[class*="boardRow"]',
        '[class*="BoardRow"]',
        '[class*="ItemRow"]',
        "[data-item-id]",
      ];

      let rows = [];
      selectors.forEach((selector) => {
        try {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            if (rows.length === 0 || found.length > rows.length) {
              rows = Array.from(found);
            }
          }
        } catch (e) {
          // Selector failed, skip it
        }
      });

      // Remove duplicates
      rows = [...new Set(rows)];

      // Filter out rows that are too small or don't look like task rows
      rows = rows.filter((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.height < 20) return false;
        if (!row.textContent || row.textContent.trim().length < 3) return false;
        return true;
      });

      if (rows.length === 0) {
        return 0;
      }

      // Attach listeners to each row
      let attachedCount = 0;
      rows.forEach((row, index) => {
        if (row.dataset.quickPeekListener === "true") {
          return;
        }

        row.dataset.quickPeekListener = "true";

        // Add hover listeners
        if (handlers.onMouseEnter) {
          row.addEventListener("mouseenter", handlers.onMouseEnter);
        }
        if (handlers.onMouseLeave) {
          row.addEventListener("mouseleave", handlers.onMouseLeave);
        }
        if (handlers.onMouseMove) {
          row.addEventListener("mousemove", handlers.onMouseMove);
        }

        attachedCount++;
      });

      return attachedCount;
    },

    /**
     * Attach hover listeners with retry logic
     * @param {Object} handlers - Event handlers
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} delay - Delay between retries (ms)
     */
    attachHoverListenersWithRetry(handlers, maxRetries = 5, delay = 1000) {
      let attempts = 0;

      const tryAttach = () => {
        attempts++;
        const rowsFound = this.attachHoverListeners(handlers);

        if (rowsFound === 0 && attempts < maxRetries) {
          setTimeout(tryAttach, delay);
        }
      };

      tryAttach();
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.HoverDetector = HoverDetector;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = HoverDetector;
  }
})();
