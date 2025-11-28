/**
 * State Manager for Content Script
 *
 * Manages shared state across content script modules
 */

(function () {
  "use strict";

  // Global state object
  const state = {
    // Hover state
    hoverTimeout: null,
    hideTimeout: null,
    currentTooltip: null,
    currentTarget: null,
    isMouseOverTooltip: false,

    // Search state
    searchDebounceTimer: null,
    currentNotes: null,
    currentSearchTerm: "",

    // Performance: Request cancellation
    currentRequestKey: null,
    requestAbortController: null,

    // Initialization state
    mutationObserver: null,
    isInitialized: false,
  };

  const StateManager = {
    /**
     * Get state value
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
      return state[key];
    },

    /**
     * Set state value
     * @param {string} key - State key
     * @param {*} value - State value
     */
    set(key, value) {
      state[key] = value;
    },

    /**
     * Clear hover-related timeouts
     */
    clearHoverTimeouts() {
      if (state.hoverTimeout) {
        clearTimeout(state.hoverTimeout);
        state.hoverTimeout = null;
      }
      if (state.hideTimeout) {
        clearTimeout(state.hideTimeout);
        state.hideTimeout = null;
      }
    },

    /**
     * Clear search debounce timer
     */
    clearSearchDebounce() {
      if (state.searchDebounceTimer) {
        clearTimeout(state.searchDebounceTimer);
        state.searchDebounceTimer = null;
      }
    },

    /**
     * Cancel current API request
     */
    cancelCurrentRequest() {
      if (state.requestAbortController) {
        state.requestAbortController.abort();
        state.requestAbortController = null;
      }
    },

    /**
     * Reset all state (for cleanup)
     */
    reset() {
      this.clearHoverTimeouts();
      this.clearSearchDebounce();
      this.cancelCurrentRequest();
      state.currentTooltip = null;
      state.currentTarget = null;
      state.isMouseOverTooltip = false;
      state.currentNotes = null;
      state.currentSearchTerm = "";
      state.currentRequestKey = null;
    },
  };

  // Export globally
  if (typeof window !== "undefined") {
    window.QuickPeekState = state;
    window.StateManager = StateManager;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { state, StateManager };
  }
})();
