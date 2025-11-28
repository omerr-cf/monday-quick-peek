/**
 * Tooltip Positioner Module
 * Pure function for calculating tooltip position
 */

(function () {
  "use strict";

  // Dependencies
  const getConfig = () => window.CONFIG || {};

  const TooltipPositioner = {
    /**
     * Calculate and set tooltip position
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} row - Task row element
     * @param {Event} event - Mouse event for cursor position
     */
    position(tooltip, row, event) {
      const config = getConfig();
      const rect = row.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipOffset = config.tooltipOffset || 20;

      // Default: position below and to the right of the row
      let top = rect.bottom + tooltipOffset + window.scrollY;
      let left = rect.left + window.scrollX;

      // If mouse event is available, position near cursor
      if (event && event.clientX && event.clientY) {
        left = event.clientX + tooltipOffset + window.scrollX;
        top = event.clientY + tooltipOffset + window.scrollY;
      }

      // Check right edge
      if (left + tooltipRect.width > viewportWidth + window.scrollX) {
        if (event && event.clientX) {
          left =
            event.clientX - tooltipRect.width - tooltipOffset + window.scrollX;
        } else {
          left = rect.right - tooltipRect.width + window.scrollX;
        }
      }

      // Check bottom edge - comprehensive viewport checking
      const availableBottomSpace =
        viewportHeight + window.scrollY - (top - window.scrollY);
      const tooltipHeight = tooltipRect.height;

      if (top + tooltipHeight > viewportHeight + window.scrollY) {
        // Position above cursor/row
        if (event && event.clientY) {
          top = event.clientY - tooltipHeight - tooltipOffset + window.scrollY;
        } else {
          top = rect.top - tooltipHeight - tooltipOffset + window.scrollY;
        }
      }

      // Ensure tooltip doesn't go off left edge
      if (left < window.scrollX) {
        left = window.scrollX + tooltipOffset;
      }

      // Ensure tooltip doesn't go off top edge
      if (top < window.scrollY) {
        top = window.scrollY + tooltipOffset;
      }

      // Final safety check: ensure tooltip fits in viewport
      const maxBottom = viewportHeight + window.scrollY - 20; // 20px padding
      const finalBottom = top + tooltipHeight;
      if (finalBottom > maxBottom) {
        // Adjust max-height dynamically if needed
        const availableHeight = maxBottom - top;
        if (availableHeight > 100) {
          // Only adjust if we have reasonable space
          tooltip.style.maxHeight = `${availableHeight}px`;
        }
        // Recalculate position
        top = maxBottom - tooltipHeight;
        if (top < window.scrollY) {
          top = window.scrollY + tooltipOffset;
        }
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.TooltipPositioner = TooltipPositioner;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = TooltipPositioner;
  }
})();
