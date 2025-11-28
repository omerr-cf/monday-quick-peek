/**
 * Tooltip Manager for Content Script
 *
 * Handles tooltip lifecycle: create, show, hide, positioning
 */

(function () {
  "use strict";

  // Dependencies
  const getState = () => window.QuickPeekState || {};
  const getConfig = () => window.CONFIG || {};
  const getTooltipPositioner = () => window.TooltipPositioner;

  const TooltipManager = {
    /**
     * Create tooltip element and append to body (initially hidden)
     * @returns {HTMLElement} Tooltip element
     */
    create() {
      const config = getConfig();
      const tooltipId = config.tooltipId || "quick-peek-tooltip";

      // Remove existing tooltip if present
      const existing = document.getElementById(tooltipId);
      if (existing) {
        existing.remove();
      }

      const tooltip = document.createElement("div");
      tooltip.id = tooltipId;
      tooltip.className = "monday-quick-peek-tooltip";
      tooltip.style.display = "none";
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = config.zIndex || 999999;

      document.body.appendChild(tooltip);
      return tooltip;
    },

    /**
     * Get or create tooltip element
     * @returns {HTMLElement} Tooltip element
     */
    getOrCreate() {
      const config = getConfig();
      const tooltipId = config.tooltipId || "quick-peek-tooltip";
      let tooltip = document.getElementById(tooltipId);
      if (!tooltip) {
        tooltip = this.create();
      }
      return tooltip;
    },

    /**
     * Show tooltip with content
     * @param {HTMLElement} row - Task row element
     * @param {Event} event - Mouse event
     * @param {string} content - HTML content to display
     * @param {Object} options - Additional options
     */
    show(row, event, content, options = {}) {
      const state = getState();
      const config = getConfig();

      // Hide existing tooltip if any
      if (state.currentTooltip) {
        this.hide();
      }

      // Get or create tooltip
      const tooltip = this.getOrCreate();

      // Set content
      tooltip.innerHTML = content;
      tooltip.style.display = "block";

      // Store in state
      state.currentTooltip = tooltip;
      state.currentTarget = row;

      // Position tooltip
      if (getTooltipPositioner) {
        getTooltipPositioner().position(tooltip, row, event);
      } else {
        // Fallback positioning
        this.positionFallback(tooltip, row, event);
      }

      // Attach tooltip mouse events
      tooltip.addEventListener("mouseenter", this.handleTooltipMouseEnter);
      tooltip.addEventListener("mouseleave", this.handleTooltipMouseLeave);
    },

    /**
     * Hide the current tooltip
     */
    hide() {
      const state = getState();
      const StateManager = window.StateManager;

      // Cancel any in-flight requests
      if (StateManager) {
        StateManager.cancelCurrentRequest();
        StateManager.clearHoverTimeouts();
        StateManager.clearSearchDebounce();
      }

      if (state.currentTooltip) {
        // Remove event listeners
        state.currentTooltip.removeEventListener(
          "mouseenter",
          this.handleTooltipMouseEnter
        );
        state.currentTooltip.removeEventListener(
          "mouseleave",
          this.handleTooltipMouseLeave
        );

        state.currentTooltip.style.display = "none";
        state.currentTooltip.innerHTML = "";
        state.currentTooltip = null;
      }

      // Reset state
      state.currentTarget = null;
      state.isMouseOverTooltip = false;
      if (StateManager) {
        StateManager.set("currentSearchTerm", "");
      }
    },

    /**
     * Handle tooltip mouse enter
     */
    handleTooltipMouseEnter() {
      const state = getState();
      const StateManager = window.StateManager;

      state.isMouseOverTooltip = true;

      // Clear any pending hide timeout
      if (StateManager) {
        const hideTimeout = StateManager.get("hideTimeout");
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          StateManager.set("hideTimeout", null);
        }
      }
    },

    /**
     * Handle tooltip mouse leave
     */
    handleTooltipMouseLeave() {
      const state = getState();
      const config = getConfig();
      const StateManager = window.StateManager;

      state.isMouseOverTooltip = false;

      // Hide tooltip after delay
      const hideDelay = config.hideDelay || 400;
      const hideTimeout = setTimeout(() => {
        if (!state.isMouseOverTooltip) {
          this.hide();
        }
      }, hideDelay);

      if (StateManager) {
        StateManager.set("hideTimeout", hideTimeout);
      }
    },

    /**
     * Fallback positioning (if TooltipPositioner not available)
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} row - Task row element
     * @param {Event} event - Mouse event
     */
    positionFallback(tooltip, row, event) {
      const config = getConfig();
      const rect = row.getBoundingClientRect();
      const tooltipOffset = config.tooltipOffset || 20;

      // Position below and to the right of the row
      let top = rect.bottom + tooltipOffset + window.scrollY;
      let left = rect.left + window.scrollX;

      // If mouse event is available, position near cursor
      if (event) {
        left = event.clientX + tooltipOffset;
        top = event.clientY + tooltipOffset;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    },

    /**
     * Update tooltip content
     * @param {string} content - New HTML content
     */
    updateContent(content) {
      const state = getState();
      if (state.currentTooltip) {
        state.currentTooltip.innerHTML = content;
      }
    },

    /**
     * Get current tooltip element
     * @returns {HTMLElement|null} Current tooltip or null
     */
    getCurrent() {
      const state = getState();
      return state.currentTooltip;
    },
  };

  // Bind methods to preserve 'this' context
  TooltipManager.handleTooltipMouseEnter =
    TooltipManager.handleTooltipMouseEnter.bind(TooltipManager);
  TooltipManager.handleTooltipMouseLeave =
    TooltipManager.handleTooltipMouseLeave.bind(TooltipManager);

  // Export globally
  if (typeof window !== "undefined") {
    window.TooltipManager = TooltipManager;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = TooltipManager;
  }
})();
