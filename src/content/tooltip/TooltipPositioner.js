/**
 * Tooltip Positioner Module
 * Pure function for calculating tooltip position
 */

import { CONFIG } from "../../config/constants.js";

/**
 * Calculate and set tooltip position
 * @param {HTMLElement} tooltip - Tooltip element
 * @param {HTMLElement} row - Task row element
 * @param {Event} event - Mouse event for cursor position
 */
export function positionTooltip(tooltip, row, event) {
  const rect = row.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default: position below and to the right of the row
  let top = rect.bottom + CONFIG.tooltipOffset + window.scrollY;
  let left = rect.left + window.scrollX;

  // If mouse event is available, position near cursor
  if (event && event.clientX && event.clientY) {
    left = event.clientX + CONFIG.tooltipOffset + window.scrollX;
    top = event.clientY + CONFIG.tooltipOffset + window.scrollY;
  }

  // Check right edge
  if (left + tooltipRect.width > viewportWidth + window.scrollX) {
    // Position to the left of cursor/row
    if (event && event.clientX) {
      left =
        event.clientX -
        tooltipRect.width -
        CONFIG.tooltipOffset +
        window.scrollX;
    } else {
      left = rect.right - tooltipRect.width + window.scrollX;
    }
  }

  // Check bottom edge
  if (top + tooltipRect.height > viewportHeight + window.scrollY) {
    // Position above cursor/row
    if (event && event.clientY) {
      top =
        event.clientY -
        tooltipRect.height -
        CONFIG.tooltipOffset +
        window.scrollY;
    } else {
      top =
        rect.top - tooltipRect.height - CONFIG.tooltipOffset + window.scrollY;
    }
  }

  // Ensure tooltip doesn't go off left edge
  if (left < window.scrollX) {
    left = window.scrollX + CONFIG.tooltipOffset;
  }

  // Ensure tooltip doesn't go off top edge
  if (top < window.scrollY) {
    top = window.scrollY + CONFIG.tooltipOffset;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;

  console.log(`Monday Quick Peek: Tooltip positioned at (${left}, ${top})`);
}
