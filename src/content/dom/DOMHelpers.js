/**
 * DOM Helper Functions
 * Utilities for extracting data from Monday.com DOM elements
 */

import { SELECTORS } from "../../config/selectors.js";

/**
 * Get task ID from row element
 * @param {HTMLElement} row - Task row element
 * @returns {string|null} Task ID or null
 */
export function getTaskId(row) {
  // Monday.com row IDs are like: row-pulse-currentBoard-5088029457-2536250444-notplaceholder
  // The item ID is typically the last number before "notplaceholder"
  if (row.id && row.id.startsWith("row-pulse-")) {
    // Extract ID from format: row-pulse-currentBoard-5088029457-2536250444-notplaceholder
    const parts = row.id.split("-");
    // Find the item ID (usually the second-to-last number before "notplaceholder")
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] === "notplaceholder" && i > 0) {
        // The item ID is the previous part
        const itemId = parts[i - 1];
        if (/^\d+$/.test(itemId)) {
          return itemId;
        }
      }
    }
    // Fallback: extract all numbers and take the last one (item ID)
    const numbers = row.id.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      // Usually the last number is the item ID
      return numbers[numbers.length - 1];
    }
  }

  // Try to extract task ID from various attributes
  for (const selector of SELECTORS.taskId) {
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
}

/**
 * Get task name from row element
 * @param {HTMLElement} row - Task row element
 * @returns {string} Task name
 */
export function getTaskName(row) {
  // Try multiple selectors to find task name (Monday.com current structure)
  const nameSelectors = SELECTORS.taskName.split(", ");

  for (const selector of nameSelectors) {
    const nameCell = row.querySelector(selector);
    if (nameCell) {
      const text = nameCell.textContent?.trim();
      if (text && text.length > 0) {
        return text;
      }
    }
  }

  // Fallback: use first text node or row text
  return row.textContent?.trim().split("\n")[0] || "Untitled Task";
}
