/**
 * DOM Helper Functions
 * Utilities for extracting data from Monday.com DOM elements
 */

(function () {
  "use strict";

  // Dependencies
  const getConfig = () => window.CONFIG || {};

  const DOMHelpers = {
    /**
     * Get task ID from row element
     * @param {HTMLElement} row - Task row element
     * @returns {string|null} Task ID or null
     */
    getTaskId(row) {
      // Monday.com row IDs are like: row-pulse-currentBoard-5088029457-2536250444-notplaceholder
      if (row.id && row.id.startsWith("row-pulse-")) {
        const parts = row.id.split("-");
        for (let i = parts.length - 1; i >= 0; i--) {
          if (parts[i] === "notplaceholder" && i > 0) {
            const itemId = parts[i - 1];
            if (/^\d+$/.test(itemId)) {
              return itemId;
            }
          }
        }
        const numbers = row.id.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          return numbers[numbers.length - 1];
        }
      }

      // Try to extract task ID from various attributes
      const idSelectors = [
        "[data-item-id]",
        "[data-id]",
        "[id*='item']",
        "[id*='task']",
      ];

      for (const selector of idSelectors) {
        const element = row.querySelector(selector) || row.closest(selector);
        if (element) {
          const id =
            element.dataset.itemId ||
            element.dataset.id ||
            element.id?.match(/\d+/)?.[0];
          if (id) return id;
        }
      }

      // Try to get from row itself
      const rowId =
        row.dataset.itemId || row.dataset.id || row.id?.match(/\d+/)?.[0];
      if (rowId) return rowId;

      return null;
    },

    /**
     * Get task name from row element
     * @param {HTMLElement} row - Task row element
     * @returns {string} Task name
     */
    getTaskName(row) {
      const config = getConfig();
      const nameSelectors = config.selectors?.taskName
        ? config.selectors.taskName.split(", ")
        : [
            ".name-cell-text",
            ".ds-text-component-content-text",
            '[id^="name-cell-"] .ds-text-component-content-text',
            ".board-row-name",
            '[data-testid*="name"]',
            ".item-name",
            "h3",
            "h4",
          ];

      for (const selector of nameSelectors) {
        const element = row.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            return text;
          }
        }
      }

      // Fallback: look for name cell by ID pattern
      const nameCell = row.querySelector('[id^="name-cell-"]');
      if (nameCell) {
        const text = nameCell.textContent?.trim();
        if (text && text.length > 0) {
          return text;
        }
      }

      // Fallback: use first text node or row text
      return row.textContent?.trim().split("\n")[0] || "Untitled Task";
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.DOMHelpers = DOMHelpers;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = DOMHelpers;
  }
})();
