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
     * Find all task rows and attach hover listeners to updates column
     * @returns {number} Number of update targets found
     */
    attachHoverListeners(handlers) {
      // Row selectors (find task rows)
      const rowSelectors = [
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

      // Updates column selectors (find updates icon/column within row)
      // Based on Monday.com's actual DOM structure
      const updatesSelectors = [
        ".name-cell-component-side-cell",
        ".monday-name-cell-conversation-wrapper",
        '[aria-label="Start conversation"]',
        '[aria-label*="conversation"]',
        ".conversation-cta-module_withUpdates__lLlWU",
        ".number-indicator-module_wrapper__p5upC",
        // Generic fallbacks
        '[class*="conversation"]',
        '[class*="updates"]',
        '[class*="notes"]',
        '[data-column-type="updates"]',
        '[aria-label*="updates"]',
        '[aria-label*="Updates"]',
      ];

      let rows = [];
      rowSelectors.forEach((selector) => {
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

      // Find updates column within each row and attach listeners
      let attachedCount = 0;
      rows.forEach((row) => {
        if (row.dataset.quickPeekListener === "true") {
          return;
        }

        // Try to find the updates column within this row
        let updatesTarget = null;
        for (const selector of updatesSelectors) {
          try {
            updatesTarget = row.querySelector(selector);
            if (updatesTarget) {
              break;
            }
          } catch (e) {
            // Selector failed, try next one
          }
        }

        // If no specific updates column found, fall back to entire row
        if (!updatesTarget) {
          updatesTarget = row;
        }

        // Mark row as processed
        row.dataset.quickPeekListener = "true";

        // Store reference to parent row on the target element
        if (updatesTarget !== row) {
          updatesTarget.dataset.quickPeekParentRow = "true";
          // Store row reference for later use
          updatesTarget._quickPeekRow = row;

          // Create custom event handlers that pass the row reference via proxy
          const createHandler = (handler) => {
            return (event) => {
              // Create proxy event with row as currentTarget (can't modify original)
              const proxyEvent = {
                currentTarget: row,
                target: event.target,
                clientX: event.clientX,
                clientY: event.clientY,
                pageX: event.pageX,
                pageY: event.pageY,
                type: event.type,
                preventDefault: () => event.preventDefault(),
                stopPropagation: () => event.stopPropagation(),
              };
              handler.call(row, proxyEvent);
            };
          };

          // Add hover listeners to updates target
          if (handlers.onMouseEnter) {
            updatesTarget.addEventListener(
              "mouseenter",
              createHandler(handlers.onMouseEnter)
            );
          }
          if (handlers.onMouseLeave) {
            updatesTarget.addEventListener(
              "mouseleave",
              createHandler(handlers.onMouseLeave)
            );
          }
          if (handlers.onMouseMove) {
            updatesTarget.addEventListener(
              "mousemove",
              createHandler(handlers.onMouseMove)
            );
          }
        } else {
          // Fall back to row-level listeners
          if (handlers.onMouseEnter) {
            updatesTarget.addEventListener("mouseenter", handlers.onMouseEnter);
          }
          if (handlers.onMouseLeave) {
            updatesTarget.addEventListener("mouseleave", handlers.onMouseLeave);
          }
          if (handlers.onMouseMove) {
            updatesTarget.addEventListener("mousemove", handlers.onMouseMove);
          }
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
