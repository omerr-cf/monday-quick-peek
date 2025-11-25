/**
 * DOM Selectors for Monday.com
 * Centralized selectors for finding elements on Monday.com pages
 */

export const SELECTORS = {
  // Task row selectors (multiple fallbacks for robustness)
  boardRow:
    '.pulse-component[role="list"], [id^="row-pulse-"], .board-row, [data-testid*="board-row"], [class*="boardRow"], [class*="pulse-component"]',

  // Task name selectors
  taskName:
    '.name-cell-text, .ds-text-component-content-text, .board-row-name, [data-testid*="name"]',

  // Task ID extraction selectors
  taskId: ["[data-item-id]", "[data-id]", "[id*='item']", "[id*='task']"],
};
